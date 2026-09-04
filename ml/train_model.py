"""
Training Pipeline for Chargeback Evidence Responder ML Model.
Uses scikit-learn Pipeline with ColumnTransformer, OneHotEncoder, and RandomForestClassifier.
Saves held-out test set (20%) and trained model joblib artifact.
"""

import os
import joblib
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression

RANDOM_SEED = 42

CATEGORICAL_FEATURES = [
    'dispute_reason',
    'delivery_status',
    'customer_communication',
    'refund_status'
]

NUMERICAL_FEATURES = [
    'dispute_amount',
    'days_since_order',
    'customer_prior_dispute_count'
]

BOOLEAN_FEATURES = [
    'order_exists',
    'invoice_exists',
    'payment_confirmed',
    'tracking_number_present'
]

FEATURE_COLUMNS = CATEGORICAL_FEATURES + NUMERICAL_FEATURES + BOOLEAN_FEATURES
TARGET_COLUMN = 'outcome'

def build_preprocessor() -> ColumnTransformer:
    """Builds scikit-learn ColumnTransformer for feature preprocessing."""
    preprocessor = ColumnTransformer(
        transformers=[
            ('cat', OneHotEncoder(handle_unknown='ignore', sparse_output=False), CATEGORICAL_FEATURES),
            ('num', StandardScaler(), NUMERICAL_FEATURES),
            ('bool', 'passthrough', BOOLEAN_FEATURES)
        ],
        remainder='drop'
    )
    return preprocessor

def train_chargeback_pipeline(data_path: str, model_type: str = 'random_forest') -> tuple:
    """
    Loads dataset, splits into 80% train / 20% test, trains model, and saves artifacts.
    """
    print(f"Loading data from {data_path}...")
    df = pd.read_csv(data_path)

    # Validate schema
    missing_cols = [c for c in FEATURE_COLUMNS + [TARGET_COLUMN] if c not in df.columns]
    if missing_cols:
        raise ValueError(f"Dataset missing required columns: {missing_cols}")

    X = df[FEATURE_COLUMNS].copy()
    y = (df[TARGET_COLUMN] == 'won').astype(int)  # 1 = won, 0 = lost

    # Convert booleans to float/int
    for col in BOOLEAN_FEATURES:
        X[col] = X[col].astype(int)

    # Stratified 80/20 train/test split
    X_train, X_test, y_train, y_test, df_train, df_test = train_test_split(
        X, y, df, test_size=0.20, random_state=RANDOM_SEED, stratify=y
    )

    print(f"Dataset split: Train={len(X_train)} cases, Test={len(X_test)} cases (Stratified).")

    # Save held-out test set
    base_dir = os.path.dirname(os.path.abspath(__file__))
    test_csv_path = os.path.join(base_dir, 'data', 'test.csv')
    df_test.to_csv(test_csv_path, index=False)
    print(f"Saved held-out test dataset to {test_csv_path}")

    # Build classifier
    if model_type == 'random_forest':
        classifier = RandomForestClassifier(
            n_estimators=150,
            max_depth=12,
            min_samples_split=8,
            min_samples_leaf=4,
            random_state=RANDOM_SEED,
            n_jobs=-1
        )
        model_name = "RandomForestClassifier"
    elif model_type == 'logistic_regression':
        classifier = LogisticRegression(
            max_iter=1000,
            random_state=RANDOM_SEED
        )
        model_name = "LogisticRegression"
    else:
        raise ValueError(f"Unsupported model type: {model_type}")

    pipeline = Pipeline(steps=[
        ('preprocessor', build_preprocessor()),
        ('classifier', classifier)
    ])

    print(f"Training {model_name}...")
    pipeline.fit(X_train, y_train)

    train_acc = pipeline.score(X_train, y_train)
    test_acc = pipeline.score(X_test, y_test)
    print(f"Training Complete! Train Accuracy: {train_acc:.4f} | Test Accuracy: {test_acc:.4f}")

    # Save model artifact
    model_dir = os.path.join(base_dir, 'model')
    os.makedirs(model_dir, exist_ok=True)
    model_path = os.path.join(model_dir, 'chargeback_model.joblib')
    
    # Store metadata alongside the model
    artifact = {
        'pipeline': pipeline,
        'model_name': model_name,
        'model_version': '1.0',
        'feature_columns': FEATURE_COLUMNS,
        'categorical_features': CATEGORICAL_FEATURES,
        'numerical_features': NUMERICAL_FEATURES,
        'boolean_features': BOOLEAN_FEATURES
    }
    
    joblib.dump(artifact, model_path)
    print(f"Model successfully saved to {model_path}")

    return pipeline, X_test, y_test, df_test

if __name__ == '__main__':
    base_dir = os.path.dirname(os.path.abspath(__file__))
    csv_file = os.path.join(base_dir, 'data', 'disputes.csv')
    
    if not os.path.exists(csv_file):
        print("Dataset not found. Generating first...")
        from generate_dataset import generate_dispute_dataset
        os.makedirs(os.path.join(base_dir, 'data'), exist_ok=True)
        df_gen = generate_dispute_dataset()
        df_gen.to_csv(csv_file, index=False)
        
    train_chargeback_pipeline(csv_file)
