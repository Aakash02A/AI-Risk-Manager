"""
Model Evaluation script on the held-out test set for Chargeback Evidence Responder.
Calculates:
- Precision, Recall, Accuracy, ROC-AUC
- Confusion Matrix (TP, FP, FN, TN)
- False-Positive Count & False-Positive Cost (₹ value of wrongly defended cases)
- Money Defended (₹ value of cases won and correctly defended)
- Saves actual evaluation metrics to JSON for frontend and backend consumption.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from sklearn.metrics import (
    precision_score,
    recall_score,
    accuracy_score,
    roc_auc_score,
    confusion_matrix,
    classification_report
)

DEFAULT_STRONG_THRESHOLD = 0.70
DEFAULT_WEAK_THRESHOLD = 0.40

def evaluate_test_set(
    test_csv_path: str = None,
    model_path: str = None,
    strong_threshold: float = DEFAULT_STRONG_THRESHOLD,
    weak_threshold: float = DEFAULT_WEAK_THRESHOLD
) -> dict:
    base_dir = os.path.dirname(os.path.abspath(__file__))
    if not test_csv_path:
        test_csv_path = os.path.join(base_dir, 'data', 'test.csv')
    if not model_path:
        model_path = os.path.join(base_dir, 'model', 'chargeback_model.joblib')

    if not os.path.exists(test_csv_path) or not os.path.exists(model_path):
        raise FileNotFoundError(f"Missing test data or model artifact. Run train_model.py first.")

    print(f"Loading held-out test set from {test_csv_path}...")
    df_test = pd.read_csv(test_csv_path)
    
    print(f"Loading model artifact from {model_path}...")
    artifact = joblib.load(model_path)
    pipeline = artifact['pipeline']
    feature_columns = artifact['feature_columns']

    X_test = df_test[feature_columns].copy()
    for col in artifact.get('boolean_features', []):
        X_test[col] = X_test[col].astype(int)
        
    y_test = (df_test['outcome'] == 'won').astype(int).values
    amounts = df_test['dispute_amount'].values

    # Compute probability of winning (class 1)
    probabilities = pipeline.predict_proba(X_test)[:, 1]

    # Standard binary classification at 0.5 for baseline comparison
    y_pred_binary = (probabilities >= 0.5).astype(int)
    
    acc = float(accuracy_score(y_test, y_pred_binary))
    prec = float(precision_score(y_test, y_pred_binary, zero_division=0))
    rec = float(recall_score(y_test, y_pred_binary, zero_division=0))
    auc = float(roc_auc_score(y_test, probabilities))
    
    cm = confusion_matrix(y_test, y_pred_binary)
    # cm: [[TN, FP], [FN, TP]]
    tn, fp, fn, tp = [int(v) for v in cm.ravel()]

    # Three-zone business decision metrics
    # STRONG: defend (p >= strong_threshold)
    # BORDERLINE: human review (weak_threshold <= p < strong_threshold)
    # WEAK: recommend refund (p < weak_threshold)
    
    is_strong = probabilities >= strong_threshold
    is_borderline = (probabilities >= weak_threshold) & (probabilities < strong_threshold)
    is_weak = probabilities < weak_threshold

    strong_count = int(np.sum(is_strong))
    borderline_count = int(np.sum(is_borderline))
    weak_count = int(np.sum(is_weak))

    # Defense outcomes
    # Case defended = is_strong
    # True Positive Defended: is_strong AND actual outcome == 1 (won)
    correctly_defended_mask = is_strong & (y_test == 1)
    correctly_defended_count = int(np.sum(correctly_defended_mask))
    money_defended = float(np.sum(amounts[correctly_defended_mask]))

    # False Positive Defended: is_strong AND actual outcome == 0 (lost)
    # Merchant spends effort/fees defending a case that was actually lost
    wrongly_defended_mask = is_strong & (y_test == 0)
    false_positive_count = int(np.sum(wrongly_defended_mask))
    false_positive_cost = float(np.sum(amounts[wrongly_defended_mask]))

    # Money reviewed (borderline)
    borderline_money = float(np.sum(amounts[is_borderline]))
    
    # Money refunded (weak)
    weak_money = float(np.sum(amounts[is_weak]))
    
    total_disputed_amount = float(np.sum(amounts))
    total_test_cases = int(len(df_test))

    # Precision specifically among cases chosen for defense (STRONG)
    defense_precision = float(correctly_defended_count / strong_count) if strong_count > 0 else 0.0

    metrics = {
        'model_name': artifact.get('model_name', 'RandomForestClassifier'),
        'model_version': artifact.get('model_version', '1.0'),
        'test_cases_count': total_test_cases,
        'dataset_total_cases': 10000,
        'train_split_pct': 80,
        'test_split_pct': 20,
        'accuracy': round(acc, 4),
        'precision_binary_50': round(prec, 4),
        'recall_binary_50': round(rec, 4),
        'roc_auc': round(auc, 4),
        'confusion_matrix': {
            'true_negative': tn,
            'false_positive': fp,
            'false_negative': fn,
            'true_positive': tp
        },
        'decision_thresholds': {
            'weak_threshold': weak_threshold,
            'strong_threshold': strong_threshold
        },
        'routing_breakdown': {
            'strong_count': strong_count,
            'borderline_count': borderline_count,
            'weak_count': weak_count,
            'strong_pct': round((strong_count / total_test_cases) * 100, 1),
            'borderline_pct': round((borderline_count / total_test_cases) * 100, 1),
            'weak_pct': round((weak_count / total_test_cases) * 100, 1)
        },
        'defense_metrics': {
            'defense_precision': round(defense_precision, 4),
            'correctly_defended_count': correctly_defended_count,
            'money_defended_inr': round(money_defended, 2),
            'false_positive_count': false_positive_count,
            'false_positive_cost_inr': round(false_positive_cost, 2),
            'borderline_amount_inr': round(borderline_money, 2),
            'weak_refund_amount_inr': round(weak_money, 2),
            'total_disputed_amount_inr': round(total_disputed_amount, 2)
        }
    }

    # Calibration Check across 5 Confidence Bins
    bins_def = [(0.50, 0.60), (0.60, 0.70), (0.70, 0.80), (0.80, 0.90), (0.90, 1.00)]
    calibration_bins = []
    for low, high in bins_def:
        mask = (probabilities >= low) & (probabilities < high if high < 1.0 else probabilities <= high)
        count = int(np.sum(mask))
        if count > 0:
            avg_pred = float(np.mean(probabilities[mask]))
            actual_win = float(np.mean(y_test[mask]))
            calib_err = float(abs(actual_win - avg_pred))
        else:
            avg_pred, actual_win, calib_err = low + 0.05, low + 0.05, 0.0

        calibration_bins.append({
            'bin_range': f"{low:.2f}-{high:.2f}",
            'count': count,
            'avg_predicted_prob': round(avg_pred, 4),
            'actual_win_rate': round(actual_win, 4),
            'calibration_error': round(calib_err, 4)
        })
    metrics['calibration_bins'] = calibration_bins

    # Save metrics JSON
    metrics_path = os.path.join(base_dir, 'model', 'evaluation_metrics.json')
    with open(metrics_path, 'w') as f:
        json.dump(metrics, f, indent=2)
    print(f"Metrics saved to {metrics_path}")

    # Display Report
    print("=" * 60)
    print("HELD-OUT TEST SET EVALUATION REPORT (2,000 Cases)")
    print("=" * 60)
    print(f"Model: {metrics['model_name']} v{metrics['model_version']}")
    print(f"Test Accuracy:          {acc * 100:.2f}%")
    print(f"Test Precision:         {prec * 100:.2f}%")
    print(f"Test Recall:            {rec * 100:.2f}%")
    print(f"Test ROC-AUC:           {auc:.4f}")
    print(f"Defense Precision (p>={strong_threshold}): {defense_precision * 100:.2f}%")
    print(f"Money Defended (Won):   INR {money_defended:,.2f}")
    print(f"False-Positive Cost:    INR {false_positive_cost:,.2f} ({false_positive_count} cases)")
    print(f"Routing Breakdown:      Strong={strong_count}, Review={borderline_count}, Weak={weak_count}")
    print("=" * 60)

    return metrics

if __name__ == '__main__':
    evaluate_test_set()
