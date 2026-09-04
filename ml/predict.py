"""
Inference Module for Chargeback Evidence Classifier.
Loads trained pipeline and evaluates win probability for single cases.
"""

import os
import joblib
import pandas as pd
from typing import Dict, Any

_MODEL_ARTIFACT = None

def load_model(model_path: str = None) -> Dict[str, Any]:
    global _MODEL_ARTIFACT
    if _MODEL_ARTIFACT is not None:
        return _MODEL_ARTIFACT

    if not model_path:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        model_path = os.environ.get('MODEL_PATH', os.path.join(base_dir, 'model', 'chargeback_model.joblib'))

    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found at {model_path}. Train model first.")

    _MODEL_ARTIFACT = joblib.load(model_path)
    print(f"Loaded ML model: {_MODEL_ARTIFACT.get('model_name')} v{_MODEL_ARTIFACT.get('model_version')}")
    return _MODEL_ARTIFACT

def predict_case_probability(case_data: Dict[str, Any], model_path: str = None) -> Dict[str, Any]:
    artifact = load_model(model_path)
    pipeline = artifact['pipeline']
    feature_cols = artifact['feature_columns']

    # Convert incoming dict into a 1-row DataFrame matching the trained schema
    row = {}
    for col in feature_cols:
        val = case_data.get(col)
        if val is None:
            raise ValueError(f"Missing required feature: {col}")
        
        # Convert boolean features
        if col in artifact.get('boolean_features', []):
            row[col] = int(bool(val))
        else:
            row[col] = val

    df_sample = pd.DataFrame([row], columns=feature_cols)

    # Predict probability for class 1 ('won')
    probs = pipeline.predict_proba(df_sample)
    win_prob = float(probs[0, 1])

    return {
        'win_probability': round(win_prob, 4),
        'model_name': artifact.get('model_name', 'RandomForestClassifier'),
        'model_version': artifact.get('model_version', '1.0')
    }
