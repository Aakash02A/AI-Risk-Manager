"""
FastAPI Microservice for Chargeback Evidence ML Classifier.
Serves:
GET /health
POST /predict
"""

import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Literal
from predict import load_model, predict_case_probability

app = FastAPI(
    title="Chargeback Evidence Responder ML Service",
    description="Trained ML classifier predicting dispute win probabilities from case evidence.",
    version="1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class DisputePredictionRequest(BaseModel):
    dispute_amount: float = Field(..., description="Transaction amount in INR")
    dispute_reason: Literal[
        'item_not_received',
        'not_as_described',
        'unauthorized_transaction',
        'duplicate_charge'
    ]
    days_since_order: int = Field(..., ge=1, le=365)
    order_exists: bool
    invoice_exists: bool
    payment_confirmed: bool
    delivery_status: Literal[
        'delivered_confirmed',
        'delivered_unconfirmed',
        'not_delivered',
        'unknown'
    ]
    tracking_number_present: bool
    customer_communication: Literal[
        'acknowledged_receipt',
        'complained_before',
        'no_contact'
    ]
    refund_status: Literal[
        'no_refund',
        'partial_refund',
        'full_refund'
    ]
    customer_prior_dispute_count: int = Field(0, ge=0)

class DisputePredictionResponse(BaseModel):
    win_probability: float
    model_name: str
    model_version: str

@app.on_event("startup")
def startup_event():
    try:
        load_model()
        print("ML Service successfully initialized with trained model.")
    except Exception as e:
        print(f"Warning: Model not pre-loaded on startup ({e}). Will load on first request or after training.")

@app.get("/health")
def health_check():
    try:
        artifact = load_model()
        return {
            "status": "UP",
            "model_loaded": True,
            "model_name": artifact.get("model_name"),
            "model_version": artifact.get("model_version")
        }
    except Exception:
        return {
            "status": "UP",
            "model_loaded": False
        }

@app.get("/evaluate")
def evaluate_endpoint():
    import json
    metrics_path = os.path.join(os.path.dirname(__file__), 'model', 'evaluation_metrics.json')
    if os.path.exists(metrics_path):
        with open(metrics_path, 'r') as f:
            return json.load(f)
    raise HTTPException(status_code=404, detail="Evaluation metrics not found. Run evaluate_model.py first.")

@app.post("/predict", response_model=DisputePredictionResponse)
def predict_endpoint(payload: DisputePredictionRequest):
    try:
        result = predict_case_probability(payload.dict())
        return result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000, reload=False)
