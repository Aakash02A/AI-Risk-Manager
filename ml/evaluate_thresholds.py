"""
Threshold Trade-Off Evaluation for Chargeback Evidence Responder.
Evaluates candidate pairs of (weak_threshold, strong_threshold) on held-out test set.
Calculates:
- Cases defended, sent to review, refunded
- Correctly defended vs wrongly defended
- False-positive cost (lost cases defended)
- Money correctly defended (won cases defended)
- Net financial recovery after false-positive friction
"""

import os
import json
import joblib
import numpy as np
import pandas as pd

def evaluate_all_thresholds():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    test_csv_path = os.path.join(base_dir, 'data', 'test.csv')
    model_path = os.path.join(base_dir, 'model', 'chargeback_model.joblib')

    if not os.path.exists(test_csv_path) or not os.path.exists(model_path):
        raise FileNotFoundError("Missing test data or model artifact. Run train_model.py first.")

    df_test = pd.read_csv(test_csv_path)
    artifact = joblib.load(model_path)
    pipeline = artifact['pipeline']
    feature_columns = artifact['feature_columns']

    X_test = df_test[feature_columns].copy()
    for col in artifact.get('boolean_features', []):
        X_test[col] = X_test[col].astype(int)

    y_test = (df_test['outcome'] == 'won').astype(int).values
    amounts = df_test['dispute_amount'].values

    # Get probabilities
    probabilities = pipeline.predict_proba(X_test)[:, 1]
    total_test = len(df_test)

    # Candidate pairs
    # Weak thresholds: 0.30, 0.35, 0.40, 0.45
    # Strong thresholds: 0.60, 0.65, 0.70, 0.75, 0.80
    weak_candidates = [0.30, 0.35, 0.40, 0.45]
    strong_candidates = [0.60, 0.65, 0.70, 0.75, 0.80]

    results = []

    for w in weak_candidates:
        for s in strong_candidates:
            if s <= w:
                continue

            is_strong = probabilities >= s
            is_review = (probabilities >= w) & (probabilities < s)
            is_weak = probabilities < w

            defended_count = int(np.sum(is_strong))
            review_count = int(np.sum(is_review))
            refund_count = int(np.sum(is_weak))

            # Won & defended
            won_defended_mask = is_strong & (y_test == 1)
            correctly_defended_count = int(np.sum(won_defended_mask))
            money_defended = float(np.sum(amounts[won_defended_mask]))

            # Lost & defended (False Positives)
            lost_defended_mask = is_strong & (y_test == 0)
            wrongly_defended_count = int(np.sum(lost_defended_mask))
            false_positive_cost = float(np.sum(amounts[lost_defended_mask]))

            # Defense precision
            precision = float(correctly_defended_count / defended_count) if defended_count > 0 else 0.0

            # Net benefit: money defended minus false positive penalty
            # Assuming dispute fee / overhead of ~₹1,500 per lost dispute + lost amount
            net_recovered = money_defended - false_positive_cost

            results.append({
                'weak_threshold': w,
                'strong_threshold': s,
                'cases_defended': defended_count,
                'cases_review': review_count,
                'cases_refund': refund_count,
                'correctly_defended': correctly_defended_count,
                'wrongly_defended': wrongly_defended_count,
                'defense_precision': round(precision, 4),
                'money_defended_inr': round(money_defended, 2),
                'false_positive_cost_inr': round(false_positive_cost, 2),
                'net_recovered_inr': round(net_recovered, 2),
                'is_recommended': (w == 0.40 and s == 0.70)
            })

    output_path = os.path.join(base_dir, 'model', 'threshold_candidates.json')
    with open(output_path, 'w') as f:
        json.dump(results, f, indent=2)

    print(f"Evaluated {len(results)} threshold candidate pairs. Saved to {output_path}")
    print("\nTop Candidate Comparison:")
    for r in results:
        star = " [Default]" if r['is_recommended'] else ""
        print(f"Weak: {r['weak_threshold']} | Strong: {r['strong_threshold']} -> Defended: {r['cases_defended']} (Prec: {r['defense_precision']*100:.1f}%) | Won: INR {r['money_defended_inr']:,.0f} | FP Cost: INR {r['false_positive_cost_inr']:,.0f}{star}")

    return results

if __name__ == '__main__':
    evaluate_all_thresholds()
