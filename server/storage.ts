/**
 * In-memory and local file persistence for dispute cases and audit trails.
 * Seeded with mandatory Case A (Strong), Case B (Weak), Case C (Borderline),
 * and representative disputes.
 */

import { DisputeCase, Decision } from '../src/types';

export interface StorageState {
  cases: DisputeCase[];
  weak_threshold: number;
  strong_threshold: number;
}

const INITIAL_CASES: DisputeCase[] = [
  // Case A — Strong (Section 34)
  {
    case_id: 'CB-1024',
    dispute_amount: 50000,
    dispute_reason: 'item_not_received',
    days_since_order: 14,
    created_at: '2026-09-02T09:31:00Z',
    evidence: {
      order_exists: true,
      invoice_exists: true,
      payment_confirmed: true,
      delivery_status: 'delivered_confirmed',
      tracking_number_present: true,
      customer_communication: 'acknowledged_receipt',
      refund_status: 'no_refund',
      customer_prior_dispute_count: 0
    },
    prediction: {
      win_probability: 0.94,
      decision: 'STRONG',
      model_name: 'RandomForestClassifier',
      model_version: '1.0',
      created_at: '2026-09-02T09:31:12Z'
    },
    defense_response: null,
    audit_logs: [
      { action: 'Case received', details: 'Dispute filed by cardholder for ₹50,000 via Visa network', actor: 'OPERATOR', created_at: '2026-09-02T09:31:00Z' },
      { action: 'Evidence collected', details: 'Fulfillment records, 3DS token, and carrier GPS confirmation aggregated', actor: 'SYSTEM', created_at: '2026-09-02T09:31:05Z' },
      { action: 'ML prediction generated', details: 'Win probability calculated: 94% using RandomForestClassifier v1.0', actor: 'ML_CLASSIFIER', created_at: '2026-09-02T09:31:12Z' },
      { action: 'Decision assigned', details: 'Three-zone threshold routing: STRONG (Probability >= 0.70)', actor: 'RULE_ROUTER', created_at: '2026-09-02T09:31:12Z' }
    ]
  },
  // Case B — Weak (Section 34)
  {
    case_id: 'CB-1025',
    dispute_amount: 50000,
    dispute_reason: 'item_not_received',
    days_since_order: 45,
    created_at: '2026-09-02T10:15:00Z',
    evidence: {
      order_exists: true,
      invoice_exists: true,
      payment_confirmed: true,
      delivery_status: 'unknown',
      tracking_number_present: false,
      customer_communication: 'no_contact',
      refund_status: 'no_refund',
      customer_prior_dispute_count: 2
    },
    prediction: {
      win_probability: 0.18,
      decision: 'WEAK',
      model_name: 'RandomForestClassifier',
      model_version: '1.0',
      created_at: '2026-09-02T10:15:20Z'
    },
    defense_response: null,
    audit_logs: [
      { action: 'Case received', details: 'Dispute filed by cardholder for ₹50,000 via Mastercard network', actor: 'OPERATOR', created_at: '2026-09-02T10:15:00Z' },
      { action: 'Evidence collected', details: 'Evidence gathered: Missing carrier tracking and delivery status unknown', actor: 'SYSTEM', created_at: '2026-09-02T10:15:08Z' },
      { action: 'ML prediction generated', details: 'Win probability calculated: 18% using RandomForestClassifier v1.0', actor: 'ML_CLASSIFIER', created_at: '2026-09-02T10:15:20Z' },
      { action: 'Decision assigned', details: 'Three-zone threshold routing: WEAK (Probability < 0.40) - Recommended refund to prevent defense friction', actor: 'RULE_ROUTER', created_at: '2026-09-02T10:15:20Z' }
    ]
  },
  // Case C — Borderline (Section 34)
  {
    case_id: 'CB-1026',
    dispute_amount: 28500,
    dispute_reason: 'not_as_described',
    days_since_order: 22,
    created_at: '2026-09-02T11:00:00Z',
    evidence: {
      order_exists: true,
      invoice_exists: true,
      payment_confirmed: true,
      delivery_status: 'delivered_unconfirmed',
      tracking_number_present: true,
      customer_communication: 'complained_before',
      refund_status: 'no_refund',
      customer_prior_dispute_count: 1
    },
    prediction: {
      win_probability: 0.56,
      decision: 'BORDERLINE',
      model_name: 'RandomForestClassifier',
      model_version: '1.0',
      created_at: '2026-09-02T11:00:25Z'
    },
    defense_response: null,
    audit_logs: [
      { action: 'Case received', details: 'Dispute filed by cardholder claiming goods not as described (₹28,500)', actor: 'OPERATOR', created_at: '2026-09-02T11:00:00Z' },
      { action: 'Evidence collected', details: 'Mixed evidence: item marked delivered without signature lock, customer logged support inquiry', actor: 'SYSTEM', created_at: '2026-09-02T11:00:10Z' },
      { action: 'ML prediction generated', details: 'Win probability calculated: 56% using RandomForestClassifier v1.0', actor: 'ML_CLASSIFIER', created_at: '2026-09-02T11:00:25Z' },
      { action: 'Decision assigned', details: 'Three-zone threshold routing: BORDERLINE (0.40 <= Probability < 0.70) - Sent to human review', actor: 'RULE_ROUTER', created_at: '2026-09-02T11:00:25Z' }
    ]
  },
  // Case D - Unauthorized Transaction (Strong candidate)
  {
    case_id: 'CB-1027',
    dispute_amount: 14200,
    dispute_reason: 'unauthorized_transaction',
    days_since_order: 8,
    created_at: '2026-09-02T13:20:00Z',
    evidence: {
      order_exists: true,
      invoice_exists: true,
      payment_confirmed: true,
      delivery_status: 'delivered_confirmed',
      tracking_number_present: true,
      customer_communication: 'acknowledged_receipt',
      refund_status: 'no_refund',
      customer_prior_dispute_count: 3
    },
    prediction: {
      win_probability: 0.91,
      decision: 'STRONG',
      model_name: 'RandomForestClassifier',
      model_version: '1.0',
      created_at: '2026-09-02T13:20:18Z'
    },
    defense_response: null,
    audit_logs: [
      { action: 'Case received', details: 'Dispute filed: Unauthorized transaction claim (₹14,200)', actor: 'OPERATOR', created_at: '2026-09-02T13:20:00Z' },
      { action: 'Evidence collected', details: 'Customer recognized cardholder IP, courier proof of delivery with signature', actor: 'SYSTEM', created_at: '2026-09-02T13:20:06Z' },
      { action: 'ML prediction generated', details: 'Win probability calculated: 91%', actor: 'ML_CLASSIFIER', created_at: '2026-09-02T13:20:18Z' },
      { action: 'Decision assigned', details: 'Three-zone threshold routing: STRONG', actor: 'RULE_ROUTER', created_at: '2026-09-02T13:20:18Z' }
    ]
  },
  // Case E - Duplicate Charge with Full Refund (Weak candidate)
  {
    case_id: 'CB-1028',
    dispute_amount: 3800,
    dispute_reason: 'duplicate_charge',
    days_since_order: 60,
    created_at: '2026-09-02T14:45:00Z',
    evidence: {
      order_exists: true,
      invoice_exists: false,
      payment_confirmed: true,
      delivery_status: 'unknown',
      tracking_number_present: false,
      customer_communication: 'no_contact',
      refund_status: 'full_refund',
      customer_prior_dispute_count: 0
    },
    prediction: {
      win_probability: 0.12,
      decision: 'WEAK',
      model_name: 'RandomForestClassifier',
      model_version: '1.0',
      created_at: '2026-09-02T14:45:22Z'
    },
    defense_response: null,
    audit_logs: [
      { action: 'Case received', details: 'Duplicate charge dispute received for ₹3,800', actor: 'OPERATOR', created_at: '2026-09-02T14:45:00Z' },
      { action: 'Evidence collected', details: 'Ledger shows customer was already issued a full refund 2 weeks prior', actor: 'SYSTEM', created_at: '2026-09-02T14:45:10Z' },
      { action: 'ML prediction generated', details: 'Win probability calculated: 12%', actor: 'ML_CLASSIFIER', created_at: '2026-09-02T14:45:22Z' },
      { action: 'Decision assigned', details: 'Three-zone threshold routing: WEAK - Full refund already executed; recommend no defense', actor: 'RULE_ROUTER', created_at: '2026-09-02T14:45:22Z' }
    ]
  },
  // Case F - Fresh Unanalyzed Case (Ready for live user interaction)
  {
    case_id: 'CB-1029',
    dispute_amount: 64000,
    dispute_reason: 'item_not_received',
    days_since_order: 10,
    created_at: '2026-09-02T16:00:00Z',
    evidence: {
      order_exists: true,
      invoice_exists: true,
      payment_confirmed: true,
      delivery_status: 'delivered_confirmed',
      tracking_number_present: true,
      customer_communication: 'acknowledged_receipt',
      refund_status: 'no_refund',
      customer_prior_dispute_count: 0
    },
    prediction: null,
    defense_response: null,
    audit_logs: [
      { action: 'Case received', details: 'High-value dispute logged for ₹64,000 (Item Not Received claim)', actor: 'OPERATOR', created_at: '2026-09-02T16:00:00Z' },
      { action: 'Evidence collected', details: 'Order records and carrier delivery proof attached. Ready for ML classification.', actor: 'SYSTEM', created_at: '2026-09-02T16:00:05Z' }
    ]
  }
];

class MemoryStorage {
  private cases: DisputeCase[] = JSON.parse(JSON.stringify(INITIAL_CASES));
  private weakThreshold: number = 0.40;
  private strongThreshold: number = 0.70;

  public getCases(search?: string, reason?: string, decision?: string): DisputeCase[] {
    return this.cases.filter(c => {
      if (search) {
        const q = search.toLowerCase();
        const matchesId = c.case_id.toLowerCase().includes(q);
        const matchesReason = c.dispute_reason.toLowerCase().includes(q);
        if (!matchesId && !matchesReason) return false;
      }
      if (reason && c.dispute_reason !== reason) return false;
      if (decision) {
        if (decision === 'UNCLASSIFIED') {
          if (c.prediction) return false;
        } else if (c.prediction?.decision !== decision) {
          return false;
        }
      }
      return true;
    });
  }

  public getCaseById(caseId: string): DisputeCase | undefined {
    return this.cases.find(c => c.case_id.toUpperCase() === caseId.toUpperCase());
  }

  public createCase(newCase: DisputeCase): DisputeCase {
    this.cases.unshift(newCase);
    return newCase;
  }

  public updateCase(caseId: string, updates: Partial<DisputeCase>): DisputeCase | undefined {
    const idx = this.cases.findIndex(c => c.case_id.toUpperCase() === caseId.toUpperCase());
    if (idx === -1) return undefined;
    this.cases[idx] = { ...this.cases[idx], ...updates };
    return this.cases[idx];
  }

  public addAuditLog(caseId: string, action: string, details: string, actor: string = 'SYSTEM') {
    const c = this.getCaseById(caseId);
    if (!c) return;
    c.audit_logs.push({
      action,
      details,
      actor,
      created_at: new Date().toISOString()
    });
  }

  public getWeakThreshold(): number {
    return this.weakThreshold;
  }

  public setWeakThreshold(val: number) {
    this.weakThreshold = val;
  }

  public getStrongThreshold(): number {
    return this.strongThreshold;
  }

  public setStrongThreshold(val: number) {
    this.strongThreshold = val;
  }

  public routeDecision(prob: number): Decision {
    if (prob >= this.strongThreshold) return 'STRONG';
    if (prob >= this.weakThreshold) return 'BORDERLINE';
    return 'WEAK';
  }

  public resetDemo(): void {
    this.cases = JSON.parse(JSON.stringify(INITIAL_CASES));
    this.weakThreshold = 0.40;
    this.strongThreshold = 0.70;
  }
}

export const storage = new MemoryStorage();
