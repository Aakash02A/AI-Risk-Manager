export type DisputeReason =
  | 'item_not_received'
  | 'not_as_described'
  | 'unauthorized_transaction'
  | 'duplicate_charge';

export type DeliveryStatus =
  | 'delivered_confirmed'
  | 'delivered_unconfirmed'
  | 'not_delivered'
  | 'unknown';

export type CustomerCommunication =
  | 'acknowledged_receipt'
  | 'complained_before'
  | 'no_contact';

export type RefundStatus =
  | 'no_refund'
  | 'partial_refund'
  | 'full_refund';

export type Decision = 'STRONG' | 'BORDERLINE' | 'WEAK';

export interface EvidenceData {
  order_exists: boolean;
  invoice_exists: boolean;
  payment_confirmed: boolean;
  delivery_status: DeliveryStatus;
  tracking_number_present: boolean;
  customer_communication: CustomerCommunication;
  refund_status: RefundStatus;
  customer_prior_dispute_count: number;
}

export interface PredictionData {
  win_probability: number;
  decision: Decision;
  model_name: string;
  model_version: string;
  created_at: string;
}

export interface DefenseResponseData {
  response_text: string;
  generated_by: string;
  created_at: string;
}

export interface AuditLogData {
  id?: string | number;
  action: string;
  details: string;
  actor: string;
  created_at: string;
}

export interface DisputeCase {
  id?: number;
  case_id: string;
  dispute_amount: number;
  dispute_reason: DisputeReason;
  days_since_order: number;
  created_at: string;
  updated_at?: string;
  evidence: EvidenceData;
  prediction?: PredictionData | null;
  defense_response?: DefenseResponseData | null;
  audit_logs: AuditLogData[];
}

export interface ModelMetricsData {
  model_name: string;
  model_version: string;
  test_cases_count: number;
  dataset_total_cases: number;
  train_split_pct: number;
  test_split_pct: number;
  accuracy: number;
  precision_binary_50: number;
  recall_binary_50: number;
  roc_auc: number;
  confusion_matrix: {
    true_negative: number;
    false_positive: number;
    false_negative: number;
    true_positive: number;
  };
  decision_thresholds: {
    weak_threshold: number;
    strong_threshold: number;
  };
  routing_breakdown: {
    strong_count: number;
    borderline_count: number;
    weak_count: number;
    strong_pct: number;
    borderline_pct: number;
    weak_pct: number;
  };
  defense_metrics: {
    defense_precision: number;
    correctly_defended_count: number;
    money_defended_inr: number;
    false_positive_count: number;
    false_positive_cost_inr: number;
    borderline_amount_inr: number;
    weak_refund_amount_inr: number;
    total_disputed_amount_inr: number;
  };
}

export interface ThresholdCandidate {
  weak_threshold: number;
  strong_threshold: number;
  cases_defended: number;
  cases_review: number;
  cases_refund: number;
  correctly_defended: number;
  wrongly_defended: number;
  defense_precision: number;
  money_defended_inr: number;
  false_positive_cost_inr: number;
  net_recovered_inr: number;
  is_recommended: boolean;
}

export interface SystemStats {
  total_cases: number;
  strong_count: number;
  borderline_count: number;
  weak_count: number;
  unclassified_count: number;
  money_defended_inr: number;
  total_disputed_inr: number;
}

export type DashboardStats = SystemStats;

