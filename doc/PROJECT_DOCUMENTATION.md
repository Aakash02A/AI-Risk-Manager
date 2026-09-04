# 🛡️ Chargeback Evidence Responder — Comprehensive Build & Architecture Documentation

> **Official Master Project Submission Document**  
> **Project Title:** Chargeback Evidence Responder — Automated Merchant Payment Dispute Adjudication & Evidence-Grounded Rebuttal Platform  
> **Git Repository:** `https://github.com/Aakash02A/AI-Risk-Manager.git`  
> **Target Commit Hash:** `f96bec914d82b3b54e3bd9eb009e43077c62d978` (Branch: `main`)  
> **Date of Submission:** September 5, 2026  

---

## 📄 Table of Contents
1. [Executive Summary & Problem Statement](#1-executive-summary--problem-statement)
2. [Current Build Specifications & Environment](#2-current-build-specifications--environment)
3. [System Architecture & End-to-End Data Flow](#3-system-architecture--end-to-end-data-flow)
4. [Technology Stack & Dependency Matrix](#4-technology-stack--dependency-matrix)
5. [Database Schema & JPA Entity Mapping](#5-database-schema--jpa-entity-mapping)
6. [Machine Learning Pipeline & Model Performance](#6-machine-learning-pipeline--model-performance)
7. [The Dynamic Ratio-Aware Decision Engine](#7-the-dynamic-ratio-aware-decision-engine)
8. [3-Zone Triage & Routing Matrix](#8-3-zone-triage--routing-matrix)
9. [AI & Offline Grounded Defense Generator](#9-ai--offline-grounded-defense-generator)
10. [UI Column Mapping & Data Formatting Dictionary](#10-ui-column-mapping--data-formatting-dictionary)
11. [Ground Truth Audit: Real vs. Fallback Features](#11-ground-truth-audit-real-vs-fallback-features)
12. [Complete Repository File Inventory](#12-complete-repository-file-inventory)
13. [Verified REST API Endpoint Matrix & Schemas](#13-verified-rest-api-endpoint-matrix--schemas)
14. [1-Click Startup & Evaluator Demo Guide](#14-1-click-startup--evaluator-demo-guide)

---

## 1. Executive Summary & Problem Statement

### The Business Challenge
Payment chargebacks represent a critical financial leakage point for e-commerce and digital merchants. When a cardholder files a transaction dispute through Visa, Mastercard, or American Express:
1. **Contesting unwinnable disputes** burns operational resources and incurs scheme arbitration penalty fees ($\approx ₹1,500$ per failed representation).
2. **Conceding legitimately winnable disputes** leaks revenue on false claims or "friendly fraud".
3. **Excessive chargeback loss ratios** ($\ge 1.50\%$) trigger Card Scheme Acquirer Monitoring Program fines ($\ge ₹500,000$) or total credit card processing revocation.

### The Solution
The **Chargeback Evidence Responder** is an enterprise AI/ML platform that automates payment dispute triage. It combines:
- A **calibrated Machine Learning model** (`RandomForestClassifier`) trained on 10,000 dispute records.
- A **dynamic ratio-aware decision engine** that protects merchants from card scheme penalty ceilings.
- An **evidence-grounded rebuttal generator** drafting formal 8-part merchant defense packages for winnable disputes.

---

## 2. Current Build Specifications & Environment

| Property | Value | Notes |
| :--- | :--- | :--- |
| **Git Commit Hash** | `f96bec914d82b3b54e3bd9eb009e43077c62d978` | Branch `main` up to date with `origin/main` |
| **Primary Backend** | Java 21 LTS / Spring Boot 3.2.0 | Runs on port `8080` (`cd backend && mvn spring-boot:run`) |
| **ML Microservice** | Python 3.11 / FastAPI 0.109 | Runs on port `5000` (`python ml/app.py`) |
| **Frontend UI** | React 19.0 / Vite 6.4 | Runs on port `3000` (`npm run dev` / `start.bat`) |
| **Database Engine** | MySQL 8.0 / H2 Dialect | MySQL default with automatic H2 in-memory fallback |
| **JSON Naming** | `SNAKE_CASE` | Configured via Spring Jackson Jackson2ObjectMapperBuilder |
| **Old Backend** | Node Express (`server/`) | **100% Removed** — clean migration to Spring Boot |

---

## 3. System Architecture & End-to-End Data Flow

```mermaid
graph TD
    UI["React 19 Frontend (Vite :3000)<br>Dispute Operations Cockpit"] -->|REST / JSON Proxy| SB["Java 21 / Spring Boot Backend (:8080)<br>API Gateway & Decision Engine"]
    SB -->|Spring Data JPA| DB[("MySQL 8.0 Ledger (:3306)<br>chargeback_responder")]
    SB -->|WebClient HTTP| PyML["Python FastAPI ML Service (:5000)<br>RandomForestClassifier v1.0"]
    SB -->|Grounded Generator| AI["Google Gemini / Offline Template Engine<br>8-Part Formal Package Generator"]

    subgraph "3-Zone Decision Routing Engine"
        PyML -->|Calibrated Win Prob (p)| SB
        SB -->|p >= T_eff (0.70-0.95)| Strong["STRONG Zone<br>Auto-Respond Authorized"]
        SB -->|0.40 <= p < T_eff| Borderline["BORDERLINE Zone<br>Human Review Required"]
        SB -->|p < 0.40| Weak["WEAK Zone<br>Recommend Refund"]
    end
```

---

## 4. Technology Stack & Dependency Matrix

### 1. Java Backend (`backend/pom.xml`)
- `org.springframework.boot:spring-boot-starter-web` (REST controllers)
- `org.springframework.boot:spring-boot-starter-data-jpa` (ORM & database access)
- `org.springframework.boot:spring-boot-starter-webflux` (Non-blocking WebClient for ML microservice HTTP communication)
- `com.mysql:mysql-connector-j` (MySQL 8.0 Driver)
- `com.h2database:h2` (In-memory zero-config fallback)
- `org.projectlombok:lombok` (Boilerplate reduction)

### 2. Python ML Service (`ml/requirements.txt`)
- `fastapi==0.109.0` (Asynchronous ASGI Web Server)
- `uvicorn==0.27.0` (HTTP Server Engine)
- `scikit-learn==1.4.0` (`RandomForestClassifier`, 100 trees, max depth 12)
- `pandas==2.2.0` & `numpy==1.26.3` (Data processing)
- `joblib==1.3.2` (Model serialization binary `chargeback_model.joblib`)

### 3. React Frontend (`frontend/package.json`)
- `react@19.0.0` & `react-dom@19.0.0` (UI framework)
- `vite@6.4.3` (Next-generation dev server & bundle pipeline)
- `lucide-react@0.475.0` (Icon library)
- Vanilla Tailwind / CSS tokens (Dark theme styling)

---

## 5. Database Schema & JPA Entity Mapping

Defined in `database/schema.sql` and mapped via Spring Data JPA entities under `backend/src/main/java/com/chargeback/responder/entity/`:

```sql
-- 1. Disputes Table
CREATE TABLE disputes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    case_id VARCHAR(64) NOT NULL UNIQUE,
    merchant_id VARCHAR(64) NOT NULL,
    dispute_amount DECIMAL(12,2) NOT NULL,
    dispute_reason VARCHAR(64) NOT NULL,
    days_since_order INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Evidence Table
CREATE TABLE evidence (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    case_id VARCHAR(64) NOT NULL UNIQUE,
    order_exists BOOLEAN NOT NULL,
    invoice_exists BOOLEAN NOT NULL,
    payment_confirmed BOOLEAN NOT NULL,
    delivery_status VARCHAR(64) NOT NULL,
    tracking_number_present BOOLEAN NOT NULL,
    customer_communication VARCHAR(64) NOT NULL,
    refund_status VARCHAR(64) NOT NULL,
    customer_prior_dispute_count INT NOT NULL,
    FOREIGN KEY (case_id) REFERENCES disputes(case_id)
);

-- 3. Predictions Table
CREATE TABLE predictions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    case_id VARCHAR(64) NOT NULL,
    win_probability DOUBLE NOT NULL,
    decision VARCHAR(32) NOT NULL,
    effective_threshold DOUBLE NOT NULL,
    model_name VARCHAR(64) NOT NULL,
    model_version VARCHAR(32) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Defense Responses Table
CREATE TABLE defense_responses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    case_id VARCHAR(64) NOT NULL UNIQUE,
    response_text TEXT NOT NULL,
    generated_by VARCHAR(64) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Audit Logs Table
CREATE TABLE audit_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    case_id VARCHAR(64) NOT NULL,
    action VARCHAR(64) NOT NULL,
    details TEXT NOT NULL,
    performed_by VARCHAR(64) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 6. Machine Learning Pipeline & Model Performance

### Dataset Specifications
- **Total Dataset Size:** 10,000 dispute records.
- **Data Partition:** 80% Train set (8,000 records) / 20% Held-Out Test set (2,000 records).
- **Features Used for Inference (11 Features):**
  1. `dispute_amount` (Transaction amount in INR)
  2. `dispute_reason` (`item_not_received`, `not_as_described`, `unauthorized_transaction`, `duplicate_charge`)
  3. `days_since_order` (Days elapsed since order purchase)
  4. `order_exists` (Boolean: Order verified in merchant OMS)
  5. `invoice_exists` (Boolean: Generated tax invoice present)
  6. `payment_confirmed` (Boolean: 3DS bank authorization confirmed)
  7. `delivery_status` (`delivered_confirmed`, `delivered_unconfirmed`, `not_delivered`, `unknown`)
  8. `tracking_number_present` (Boolean: Carrier tracking waybill attached)
  9. `customer_communication` (`acknowledged_receipt`, `complained_before`, `no_contact`)
  10. `refund_status` (`no_refund`, `partial_refund`, `full_refund`)
  11. `customer_prior_dispute_count` (Integer: Previous dispute history count)

### Evaluation Metrics (Held-Out 2,000 Test Set)
- **Algorithm:** `RandomForestClassifier` (100 estimators, max depth 12).
- **Test Accuracy:** **85.80%**
- **Precision ($p \ge 0.50$):** **88.55%**
- **Recall ($p \ge 0.50$):** **95.09%**
- **ROC-AUC Score:** **0.8477**
- **Automated Win Rate ($p \ge 0.70$):** **92.49%**

---

## 7. The Dynamic Ratio-Aware Decision Engine

### Why Fixed Cutoffs Fail Economically
A flat cutoff (e.g., 0.70) ignores merchant account health. If a merchant's trailing chargeback ratio approaches the card network threshold (1.50% Visa VAMP ceiling), contesting risky cases can cause account termination or severe acquirer fines ($\ge ₹500,000$).

### Non-Linear Penalty Formula
The decision engine (`RatioDecisionEngine.java`) calculates a dynamic effective threshold $T_{\text{eff}}$:

$$T_{\text{eff}} = \min\left(T_{\text{cap}},\ T_{\text{base}} + \alpha \cdot \left(\frac{R_{\text{loss}}}{R_{\text{ceiling}}}\right)^2\right)$$

- **Base Threshold ($T_{\text{base}}$):** `0.70`
- **Network Ceiling ($R_{\text{ceiling}}$):** `0.015` (1.50%)
- **Penalty Multiplier ($\alpha$):** `0.10`
- **Max Cap ($T_{\text{cap}}$):** `0.95` (95%)
- **Dynamic Behavior:** As the loss ratio increases towards 1.5%, the threshold ramps up non-linearly, requiring higher win confidence before authorizing automated defense.

---

## 8. 3-Zone Triage & Routing Matrix

| Zone | Condition | System Action | Operational Impact |
| :--- | :--- | :--- | :--- |
| 🟢 **STRONG** | $p \ge T_{\text{eff}}$ | **Auto-Response Authorized** | Drafts formal 8-part rebuttal letter for immediate submission. |
| 🟡 **BORDERLINE** | $0.40 \le p < T_{\text{eff}}$ | **Human Review Required** | Locks auto-defense to prevent arbitration penalties; flags for operator review. |
| 🔴 **WEAK** | $p < 0.40$ | **Recommend Refund** | Concedes dispute to preserve merchant loss ratio and eliminate fees. |

---

## 9. AI & Offline Grounded Defense Generator

For all `STRONG` winnable disputes, the platform generates a formal **8-Part Merchant Defense Package**:

1. **Executive Summary**: Core claim summary and authentication overview.
2. **Transaction Integrity**: Verified 3DS Token and Bank Authorization code.
3. **Proof of Fulfillment**: Carrier tracking waybill and delivery confirmation status.
4. **Cardholder Communication Log**: Customer contact and agreement history.
5. **Refund Disclosure**: Previous refund check protecting against double-dipping.
6. **Historical Account Reputation**: Prior dispute count and account tenure.
7. **Scheme Rule Alignment**: Cites Visa Core Rules (Section 11.1) / Mastercard Rules (Rule 4.2).
8. **Formal Recovery Demand**: Demand for full credit reversal.

*Note: The platform works **100% offline** via an evidence-grounded Java template engine when no external Gemini LLM API key is attached.*

---

## 10. UI Column Mapping & Data Formatting Dictionary

To avoid confusion during evaluation, the table below maps frontend dashboard columns to backend entity properties:

| UI Column Header | Data Source Property | Formatting Rule | Example Output |
| :--- | :--- | :--- | :--- |
| **DISPUTE ID** | `dispute.caseId` | Case ID string | `CB-1024` |
| **AMOUNT** | `dispute.disputeAmount` | INR Currency | `₹50,000.00` |
| **REASON** | `dispute.disputeReason` | Reason String | `Item Not Received` |
| **AGE** | `dispute.daysSinceOrder` | **Relative Time String** | `7d ago` / `14d ago` |
| **WIN CONFIDENCE** | `prediction.winProbability` | Percentage | `94%` |
| **DECISION / ZONE** | `prediction.decision` | Colored Badge | `STRONG` / `WEAK` / `BORDERLINE` |

---

## 11. Ground Truth Audit: Real vs. Fallback Features

| Feature | Status | Actual Mechanism & Truth |
| :--- | :--- | :--- |
| **Java Spring Boot Backend** | 🟢 **100% Real** | Sole primary backend running REST controllers, JPA entities, and WebClient (`:8080`). |
| **Python ML Microservice** | 🟢 **100% Real** | FastAPI microservice serving `RandomForestClassifier` (`:5000`). |
| **Ratio-Aware Math Engine** | 🟢 **100% Real** | Dynamic non-linear threshold penalty formula active in Java. |
| **React 19 Frontend UI** | 🟢 **100% Real** | SPA with live filtering, dossier modals, ML performance views, and policy tuners (`:3000`). |
| **MySQL Database Ledger** | 🟢 **100% Real** | Spring Data JPA persistence mapped to MySQL 8.0 (with automatic H2 fallback). |
| **Offline Response Engine** | 🟡 **Real + Fallback** | Connects to Gemini API when key is set; automatically uses offline grounded Java engine when key is absent. |
| **ML Resilience Fallback** | 🟡 **Real + Fallback** | Local Java evidence scoring fallback activates if Python service is offline. |
| **Pre-Seeded Test Cases** | 🟡 **Canonical Cases** | Pre-populates evaluation cases (`CB-1024`, `CB-1025`, `CB-1026`) for immediate demo capability. |

---

## 12. Complete Repository File Inventory

```
AI-Risk-Manager/
├── PROJECT_DOCUMENTATION.md                   # Formal Master Build & Architecture Documentation
├── README.md                                  # Repository Readme & Quickstart Guide
├── Project audit.md                           # Technical Audit Report
├── run.bat                                    # 1-Click Windows Dev Launcher Script
├── docker-compose.yml                         # Container Orchestration Configuration
├── .env.example                               # Environment Variables Specification
│
├── backend/                                   # Java 21 / Spring Boot 3.2 Service (:8080)
│   ├── pom.xml                                # Maven dependencies (Spring Web, Data JPA, WebFlux, MySQL, H2)
│   └── src/main/
│       ├── java/com/chargeback/responder/
│       │   ├── ChargebackResponderApplication.java # Spring Boot Entry Point
│       │   ├── controller/                    # CaseController, HealthController, MetricsController, etc.
│       │   ├── dto/                           # Data Transfer Objects (Jackson Snake Case)
│       │   ├── entity/                        # Dispute, Evidence, Prediction, DefenseResponse JPA Entities
│       │   ├── repository/                    # JPA Data Access Interfaces
│       │   ├── service/                       # CaseService, RatioDecisionEngine, LlmOrchestrationService
│       │   └── exception/                     # GlobalExceptionHandler
│       └── resources/
│           └── application.yml                # Spring Boot Configuration
│
├── frontend/                                  # React 19 / Vite Single-Page Application (:3000)
│   ├── index.html                             # HTML Shell
│   ├── vite.config.ts                         # Vite Proxy Setup (Proxying /api to :8080)
│   └── src/
│       ├── App.tsx                            # Primary Application Shell
│       ├── components/                        # CaseDetailModal, DisputeTable, ModelEvaluationView, etc.
│       ├── types.ts                           # TypeScript Interfaces
│       └── utils/                             # Formatters (Currency INR, Date relative age)
│
├── ml/                                        # Python ML Microservice (:5000)
│   ├── app.py                                 # FastAPI REST Server
│   ├── train_model.py                         # Model Training Script (RandomForestClassifier)
│   ├── evaluate_model.py                      # Held-Out Test Evaluation Script
│   ├── generate_dataset.py                    # 10,000 Dispute Dataset Generator
│   ├── requirements.txt                       # Dependencies (FastAPI, Scikit-Learn, Joblib)
│   └── model/                                 # chargeback_model.joblib & evaluation_metrics.json
│
└── database/                                  # Database Ledger Definitions
    └── schema.sql                             # MySQL 8.0 DDL Schema Script
```

---

## 13. Verified REST API Endpoint Matrix & Schemas

All REST endpoints reside on **Java Spring Boot (`http://localhost:8080`)**:

| Path | Method | Target Controller | Functionality & Verified Response |
| :--- | :--- | :--- | :--- |
| `/health` | `GET` | `HealthController` | System status (`{"status":"UP","model_loaded":true}`) |
| `/api/health/full` | `GET` | `HealthController` | Diagnostics for Java, ML, DB, and LLM services |
| `/api/stats` | `GET` | `StatsController` | Summary KPI metrics for dashboard header |
| `/api/cases` | `GET` | `CaseController` | Lists dispute cases with search and zone filtering |
| `/api/cases` | `POST` | `CaseController` | Ingests new dispute case & evidence payload (HTTP 201) |
| `/api/cases/{id}` | `GET` | `CaseController` | Fetches full evidentiary dossier & prediction history |
| `/api/cases/{id}/analyze` | `POST` | `CaseController` | Triggers ML inference & calculates dynamic ratio decision |
| `/api/cases/{id}/generate-response` | `POST` | `CaseController` | Generates 8-part formal rebuttal package (`STRONG` cases only) |
| `/api/cases/reset-demo` | `POST` | `CaseController` | Resets canonical evaluation dispute cases (`CB-1024`, `CB-1025`, `CB-1026`) |
| `/api/risk/ratio-status` | `GET` | `RiskController` | Computes dynamic threshold based on trailing loss ratio |
| `/api/model/metrics` | `GET` | `MetricsController` | Returns model test accuracy ($85.8\%$), ROC-AUC ($0.8477$) |
| `/predict` | `POST` | `PredictController` | Direct ML inference endpoint proxying payload to Python service |

---

## 14. 1-Click Startup & Evaluator Demo Guide

### 1-Click Launch Steps

1. **Launch Python ML Microservice (Port 5000):**
   ```cmd
   python ml/app.py
   ```
2. **Launch Java Backend (Port 8080):**
   ```cmd
   cd backend
   mvn spring-boot:run
   ```
3. **Launch React Frontend (Port 3000):**
   ```cmd
   run.bat
   ```
   *Open browser at 👉 **`http://localhost:3000`***

---

### Evaluator Presentation Script

1. **Case A (`CB-1024` — STRONG Win Confidence)**:
   - Click **Dossier**. Highlight verified 3DS token, delivery confirmation, and **94% win probability**.
   - Click **Draft Formal Rebuttal Letter**. Display the generated 8-part merchant rebuttal package.
2. **Case C (`CB-1026` — BORDERLINE Win Confidence)**:
   - Show win probability **56%** in Borderline zone ($0.40 \le p < 0.70$).
   - Point out policy guard: Automated response generation is disabled to require manual human review.
3. **Case B (`CB-1025` — WEAK Win Confidence)**:
   - Show win probability **18%** in Weak zone ($p < 0.40$).
   - Action: Recommend refund to preserve merchant loss ratio and avoid arbitration penalty fees.
4. **ML Performance Visualizer**:
   - Open **ML Evaluation** tab. Show held-out test split ROC-AUC ($0.8477$) and calibration bins.
5. **Network Loss Ratio Tuner**:
   - Open **Risk Config** modal. Demonstrate how increasing merchant loss ratio automatically ramps up $T_{\text{eff}}$ to protect the merchant account.

---
*Document compiled and verified for official project submission.*
