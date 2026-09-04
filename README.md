# 🛡️ Chargeback Evidence Responder

> **An enterprise-grade, ML-driven SaaS platform for merchant payment dispute adjudication and evidence-grounded defense generation.**

---

## 1. Executive Summary & Problem Context

Payment chargebacks represent a major operational vulnerability for modern digital merchants. When cardholders dispute a transaction through their issuing bank (under Visa, Mastercard, or American Express dispute rules), merchants face a dilemma:
- **Blindly contesting every dispute** causes high operational overhead, scheme arbitration penalty fees ($\approx ₹1,500$ per failed representation), and spikes in dispute loss ratios.
- **Blindly conceding every dispute** leaks substantial legitimate revenue on fraudulent "friendly fraud" or false claims.
- **Exceeding the 1.50% loss ratio ceiling** triggers Card Scheme Acquirer Monitoring Program fines ($\ge ₹500,000$) or total payment processing revocation.

The **Chargeback Evidence Responder** replaces manual guesswork with a calibrated machine learning classifier (`RandomForestClassifier`), an automated dynamic ratio-aware decision engine, and an evidence-grounded Large Language Model (Google Gemini) for drafting formal merchant defense rebuttal packages.

---

## 2. Core Architecture

```
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                                   React 19 Frontend (:3000)                              │
│  - Dispute Operations Cockpit & Real-Time Filters                                         │
│  - Case Evidentiary Dossier & Decision Inspector                                          │
│  - Interactive ML Model Performance & Held-Out Test Evaluation Visualizers                │
│  - Dynamic Three-Zone Threshold Policy Tuner                                              │
└────────────────────────────────────────┬─────────────────────────────────────────────────┘
                                         │ JSON REST APIs (Vite Proxy)
                                         ▼
┌──────────────────────────────────────────────────────────────────────────────────────────┐
│                         Java 21 / Spring Boot 3.2 Backend (:8080)                         │
│  - Primary API Gateway, Spring Data JPA Ledger & Audit Logger                            │
│  - Three-Zone Threshold Policy Router (STRONG, BORDERLINE, WEAK)                          │
│  - Non-Linear Ratio Penalty Engine: T_eff = min(T_cap, T_base + α * (R_loss / R_ceil)^2)  │
│  - Grounded Defense Responder (Gemini 3.8 Flash REST API / Offline Java Engine)          │
└───────────────────┬──────────────────────────────────────────────────┬───────────────────┘
                    │ WebClient HTTP                                   │ Grounded Generator
                    ▼                                                  ▼
┌───────────────────────────────────────┐          ┌───────────────────────────────────────┐
│     FastAPI ML Microservice (:5000)   │          │     Google Gemini AI / Offline Engine   │
│  - Model: RandomForestClassifier v1.0 │          │  - Strict Evidence Grounding Prompt   │
│  - Trained on 10,000 dispute cases    │          │  - 8-Part Formal Rebuttal Structure   │
│  - Calibrated Win Probability (p)     │          │  - Guaranteed Zero Fabrication        │
└───────────────────────────────────────┘          └───────────────────────────────────────┘
```

---

## 3. Technology Stack

- **Frontend**: React 19, Vite 6, Tailwind CSS, Lucide Icons (`http://localhost:3000`)
- **Primary Backend**: Java 21 LTS, Spring Boot 3.2, Spring Data JPA, WebFlux WebClient (`http://localhost:8080`)
- **ML Microservice**: Python 3.11, FastAPI, Scikit-Learn `RandomForestClassifier`, Joblib (`http://localhost:5000`)
- **Database Ledger**: MySQL 8.0 DDL Schema with automatic zero-config H2 in-memory fallback
- **AI Generator**: Google Gemini 3.8 Flash API with offline evidence-grounded Java engine fallback

---

## 4. Machine Learning Pipeline & Dataset

### Dataset Specifications
- **Total Records:** 10,000 synthetic chargeback dispute cases.
- **Partition:** 80% Train set (8,000 disputes) / 20% Held-Out Test set (2,000 disputes).
- **Inference Features (11 Variables):**
  - `dispute_amount` (Transaction value in INR)
  - `dispute_reason` (`item_not_received`, `not_as_described`, `unauthorized_transaction`, `duplicate_charge`)
  - `days_since_order` (Days elapsed since order purchase)
  - `order_exists` (Boolean OMS verification)
  - `invoice_exists` (Boolean Tax Invoice attached)
  - `payment_confirmed` (Boolean 3DS authorization status)
  - `delivery_status` (`delivered_confirmed`, `delivered_unconfirmed`, `not_delivered`, `unknown`)
  - `tracking_number_present` (Boolean carrier waybill attached)
  - `customer_communication` (`acknowledged_receipt`, `complained_before`, `no_contact`)
  - `refund_status` (`no_refund`, `partial_refund`, `full_refund`)
  - `customer_prior_dispute_count` (Historical dispute count)

### Held-Out Test Evaluation (2,000 Test Cases)

| Metric | Score | Operational Significance |
| :--- | :--- | :--- |
| **Test Accuracy** | **85.80%** | Overall correct discrimination across dispute reasons |
| **Precision (p &ge; 0.50)** | **88.55%** | Base binary precision before thresholding |
| **Recall (p &ge; 0.50)** | **95.09%** | Captures 95% of all winnable merchant disputes |
| **ROC-AUC** | **0.8477** | Strong ranking ability across probabilistic spectrum |
| **Auto Defense Win Rate (p &ge; 0.70)** | **92.49%** | **92.5% win rate on cases submitted for automated defense** |

---

## 5. The Dynamic Ratio-Aware Decision Engine

### Non-Linear Threshold Math
The decision engine calculates an effective threshold $T_{\text{eff}}$ to protect the merchant from exceeding the Card Network 1.50% monitoring ceiling:

$$T_{\text{eff}} = \min\left(T_{\text{cap}},\ T_{\text{base}} + \alpha \cdot \left(\frac{R_{\text{loss}}}{R_{\text{ceiling}}}\right)^2\right)$$

- **Base Threshold ($T_{\text{base}}$):** `0.70`
- **Network Ceiling ($R_{\text{ceiling}}$):** `0.015` (1.50% Visa VAMP ceiling)
- **Penalty Multiplier ($\alpha$):** `0.10`
- **Max Cap ($T_{\text{cap}}$):** `0.95` (95%)

---

## 6. Three-Zone Routing & Auditing

1. 🟢 **STRONG Zone ($p \ge T_{\text{eff}}$):** Auto-Response Authorized. Drafts formal 8-part rebuttal package.
2. 🟡 **BORDERLINE Zone ($0.40 \le p < T_{\text{eff}}$):** Human Review Required. Locks auto-defense to prevent arbitration penalties.
3. 🔴 **WEAK Zone ($p < 0.40$):** Recommend Refund. Yields dispute to protect merchant loss ratio.

---

## 7. Canonical Test Cases Demonstration

The system pre-seeds three evaluation cases on startup:

| Case ID | Claimed Reason | Evidence Highlights | ML Win Prob | Decision Zone | System Action |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **CB-1024 (Case A)** | Item Not Received | 3DS confirmed, Carrier delivery confirmed, 0 prior disputes | **94%** | 🟢 **STRONG** | Auto-Rebuttal Drafted |
| **CB-1025 (Case B)** | Item Not Received | Delivery unknown, No tracking, 2 prior disputes | **18%** | 🔴 **WEAK** | Recommend Refund |
| **CB-1026 (Case C)** | Not As Described | Delivery unconfirmed, Customer complained before | **56%** | 🟡 **BORDERLINE** | Human Review Required |

---

## 8. Running the System

### 1-Click Launch Steps
1. **Start Python ML Service (Port 5000):**
   ```cmd
   python ml/app.py
   ```
2. **Start Java Spring Boot Backend (Port 8080):**
   ```cmd
   cd backend
   mvn spring-boot:run
   ```
3. **Start React Frontend (Port 3000):**
   ```cmd
   run.bat
   ```
   *Access dashboard at 👉 **`http://localhost:3000`***
