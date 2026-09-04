"""
Dataset generator for Chargeback Evidence Responder.
Generates 10,000 realistic synthetic payment dispute cases with mixed evidence,
noise, realistic correlations, and non-deterministic outcomes.
"""

import os
import random
import numpy as np
import pandas as pd

RANDOM_SEED = 42
TOTAL_CASES = 10000

DISPUTE_REASONS = [
    'item_not_received',
    'not_as_described',
    'unauthorized_transaction',
    'duplicate_charge'
]

DELIVERY_STATUSES = [
    'delivered_confirmed',
    'delivered_unconfirmed',
    'not_delivered',
    'unknown'
]

CUSTOMER_COMMUNICATIONS = [
    'acknowledged_receipt',
    'complained_before',
    'no_contact'
]

REFUND_STATUSES = [
    'no_refund',
    'partial_refund',
    'full_refund'
]

def generate_dispute_dataset(n_samples: int = TOTAL_CASES, seed: int = RANDOM_SEED) -> pd.DataFrame:
    np.random.seed(seed)
    random.seed(seed)

    records = []
    
    # Realistic amount distributions in INR (e.g., ₹500 to ₹150,000)
    # Common tiers: small purchases (₹500-₹3,000), mid-tier (₹3,000-₹20,000), luxury/electronics (₹20,000-₹120,000)
    tiers = [
        (500, 3000, 0.35),
        (3000, 20000, 0.40),
        (20000, 80000, 0.20),
        (80000, 150000, 0.05),
    ]

    for i in range(1, n_samples + 1):
        case_id = f"CB-{1000 + i}"
        
        # Pick amount based on distribution
        tier_choice = np.random.choice(len(tiers), p=[t[2] for t in tiers])
        min_amt, max_amt, _ = tiers[tier_choice]
        dispute_amount = round(float(np.random.uniform(min_amt, max_amt)), 2)
        
        dispute_reason = np.random.choice(
            DISPUTE_REASONS,
            p=[0.45, 0.25, 0.20, 0.10]
        )
        
        # Days since order: typical dispute window 5 to 120 days
        days_since_order = int(np.random.gamma(shape=3.0, scale=8.0)) + 3
        days_since_order = min(max(days_since_order, 2), 180)
        
        # Evidence generation with realistic domain dependencies
        order_exists = np.random.choice([True, False], p=[0.97, 0.03])
        invoice_exists = np.random.choice([True, False], p=[0.94, 0.06]) if order_exists else np.random.choice([True, False], p=[0.20, 0.80])
        payment_confirmed = np.random.choice([True, False], p=[0.96, 0.04])

        # Delivery status depends on dispute reason
        if dispute_reason == 'item_not_received':
            delivery_status = np.random.choice(
                DELIVERY_STATUSES,
                p=[0.40, 0.25, 0.20, 0.15]
            )
        elif dispute_reason == 'not_as_described':
            # Usually delivered if customer claims not as described
            delivery_status = np.random.choice(
                DELIVERY_STATUSES,
                p=[0.70, 0.20, 0.03, 0.07]
            )
        elif dispute_reason == 'unauthorized_transaction':
            delivery_status = np.random.choice(
                DELIVERY_STATUSES,
                p=[0.50, 0.25, 0.10, 0.15]
            )
        else: # duplicate_charge
            delivery_status = np.random.choice(
                DELIVERY_STATUSES,
                p=[0.60, 0.20, 0.05, 0.15]
            )

        # Tracking number
        if delivery_status in ['delivered_confirmed', 'delivered_unconfirmed']:
            tracking_number_present = np.random.choice([True, False], p=[0.88, 0.12])
        elif delivery_status == 'not_delivered':
            tracking_number_present = np.random.choice([True, False], p=[0.45, 0.55])
        else:
            tracking_number_present = np.random.choice([True, False], p=[0.15, 0.85])

        # Customer communication
        if dispute_reason == 'item_not_received' and delivery_status == 'delivered_confirmed':
            customer_communication = np.random.choice(
                CUSTOMER_COMMUNICATIONS,
                p=[0.30, 0.40, 0.30]
            )
        else:
            customer_communication = np.random.choice(
                CUSTOMER_COMMUNICATIONS,
                p=[0.20, 0.45, 0.35]
            )

        # Refund status
        if dispute_reason == 'duplicate_charge':
            refund_status = np.random.choice(REFUND_STATUSES, p=[0.40, 0.20, 0.40])
        else:
            refund_status = np.random.choice(REFUND_STATUSES, p=[0.82, 0.12, 0.06])

        # Prior dispute count (0 to 6)
        customer_prior_dispute_count = int(np.random.choice(
            [0, 1, 2, 3, 4, 5],
            p=[0.68, 0.18, 0.08, 0.03, 0.02, 0.01]
        ))

        # Latent logit model for realistic win probability calculation with noise
        # This models how banks/card networks review evidence
        logit = -0.20  # Base intercept

        # Order and invoice evidence
        if order_exists:
            logit += 0.85
        else:
            logit -= 1.40

        if invoice_exists:
            logit += 0.70
        else:
            logit -= 0.90

        if payment_confirmed:
            logit += 0.65
        else:
            logit -= 1.60

        # Delivery status influence
        if delivery_status == 'delivered_confirmed':
            logit += 1.80
        elif delivery_status == 'delivered_unconfirmed':
            logit += 0.35
        elif delivery_status == 'not_delivered':
            logit -= 2.10
        else: # unknown
            logit -= 1.30

        # Tracking influence
        if tracking_number_present:
            logit += 0.80
        else:
            logit -= 0.65

        # Customer communication influence
        if customer_communication == 'acknowledged_receipt':
            logit += 1.60
        elif customer_communication == 'complained_before':
            logit -= 0.45
        else: # no_contact
            logit -= 0.10

        # Refund influence
        if refund_status == 'no_refund':
            logit += 0.20
        elif refund_status == 'partial_refund':
            logit += 0.40  # Shows merchant made good-faith resolution effort
        elif refund_status == 'full_refund':
            # If already fully refunded, merchant has no loss or dispute is moot
            logit -= 2.20

        # Prior disputes (frequent disputers often indicate fraud or chargeback abuse)
        if customer_prior_dispute_count >= 3:
            logit += 0.75  # Bank fraud pattern recognized against disputer
        elif customer_prior_dispute_count == 1:
            logit -= 0.20

        # Interaction effects
        if dispute_reason == 'item_not_received' and delivery_status == 'delivered_confirmed' and tracking_number_present:
            logit += 1.10
        if dispute_reason == 'unauthorized_transaction' and customer_communication == 'acknowledged_receipt':
            logit += 1.20
        if dispute_reason == 'duplicate_charge' and refund_status == 'no_refund' and invoice_exists:
            logit += 0.50

        # Age penalty: very stale disputes are harder to defend
        if days_since_order > 90:
            logit -= 0.55
        elif days_since_order < 30:
            logit += 0.25

        # Significant stochastic noise so that evidence is NOT deterministic
        # e.g., bank subjectivity, card scheme rules, merchant documentation flaws
        noise = np.random.normal(loc=0.0, scale=1.35)
        total_logit = logit + noise
        
        # Sigmoid to get probability of winning
        p_win = 1.0 / (1.0 + np.exp(-total_logit))
        p_win = np.clip(p_win, 0.02, 0.98)

        # Outcome sampling based on true latent probability
        outcome = 'won' if np.random.rand() < p_win else 'lost'

        records.append({
            'case_id': case_id,
            'dispute_amount': dispute_amount,
            'dispute_reason': dispute_reason,
            'days_since_order': days_since_order,
            'order_exists': order_exists,
            'invoice_exists': invoice_exists,
            'payment_confirmed': payment_confirmed,
            'delivery_status': delivery_status,
            'tracking_number_present': tracking_number_present,
            'customer_communication': customer_communication,
            'refund_status': refund_status,
            'customer_prior_dispute_count': customer_prior_dispute_count,
            'outcome': outcome
        })

    df = pd.DataFrame(records)
    return df

if __name__ == '__main__':
    data_dir = os.path.join(os.path.dirname(__file__), 'data')
    os.makedirs(data_dir, exist_ok=True)

    print(f"Generating {TOTAL_CASES} synthetic disputes...")
    df = generate_dispute_dataset(TOTAL_CASES, RANDOM_SEED)
    
    out_path = os.path.join(data_dir, 'disputes.csv')
    df.to_csv(out_path, index=False)
    print(f"Saved dataset to {out_path}")
    print(f"Class distribution: \n{df['outcome'].value_counts(normalize=True)}")
