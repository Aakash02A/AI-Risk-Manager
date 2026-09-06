# 🚀 Enterprise Deployment & Go-Live Guide
### Razorpay Dispute Shield (`AI-Risk-Manager`)

This document provides end-to-end instructions for deploying **Razorpay Dispute Shield** into live production environments, cloud container runtimes, or local staging instances.

---

## 🏗️ Architecture Summary

```
                       ┌──────────────────────────────────────────────┐
                       │          Razorpay Payment Gateway            │
                       │     (Webhooks: dispute.created/action_req)   │
                       └──────────────────────┬───────────────────────┘
                                              │ POST /api/webhooks/razorpay
                                              ▼
┌───────────────────────────┐     ┌──────────────────────┐     ┌───────────────────────────┐
│     React 19 Frontend     │     │  Spring Boot Backend │     │    FastAPI ML Service     │
│   Razorpay Merchant UI    │────▶│    (Java 17 JRE)     │────▶│      (Python 3.11)        │
│   Webhook Simulator Modal │     │   Decision Router    │     │  RandomForest Classifier  │
└───────────────────────────┘     └───────────┬──────────┘     └───────────────────────────┘
                                              │
                                              │  JPA / Hibernate
                                              ▼
                                  ┌──────────────────────┐
                                  │   MySQL 8.0 / AWS    │
                                  │   Dossier Registry   │
                                  └──────────────────────┘
```


---

## ⚡ Option 1: Docker Compose (Recommended for Staging & Cloud VMs)

Every microservice includes an optimized multi-stage Docker build. You can launch the entire stack with a single command.

### 1. Prerequisites
- Docker Engine 24.0+ & Docker Compose v2+
- Git

### 2. Configure Environment
Create a `.env` file in the root directory:
```bash
cp .env.example .env
```
Ensure your `.env` contains:
```env
# Google Gemini API Key for dynamic rebuttal generation
GEMINI_API_KEY=your_actual_gemini_api_key_here

# Database Configuration
MYSQL_ROOT_PASSWORD=secret
MYSQL_DATABASE=chargeback_responder
MYSQL_USER=root
MYSQL_PASSWORD=secret

# ML & Threshold Settings
WEAK_THRESHOLD=0.40
STRONG_THRESHOLD=0.70
LLM_MODEL=gemini-3.8-flash
```

### 3. Launch Stack
```bash
docker compose up --build -d
```

### 4. Verify Running Containers
```bash
docker compose ps
```
Services exposed:
- **Application & API**: `http://<your-server-ip>:8080` (Spring Boot serves the UI + REST API)
- **ML Classifier**: `http://<your-server-ip>:8000/health`
- **MySQL Database**: `3306`

---

## ☁️ Option 2: Cloud PaaS (Railway / Render / Fly.io)

### Deploying to Render / Railway
The project consists of two lightweight backend services and a managed database:

1. **MySQL Database**:
   - Create a managed MySQL 8 database service on Railway, AWS RDS, or Render.
   - Note the connection URL (`jdbc:mysql://<host>:<port>/<dbname>`), username, and password.

2. **Python ML Microservice**:
   - **Root Directory**: `ml`
   - **Runtime**: Docker or Python 3.11
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python app.py` (reads `$PORT` dynamically)
   - **Health Check Path**: `/health`

3. **Spring Boot Backend**:
   - **Root Directory**: `backend`
   - **Runtime**: Docker (using `backend/Dockerfile`) or Java 17
   - **Environment Variables**:
     - `MYSQL_URL`: `jdbc:mysql://<db-host>:<db-port>/<db-name>`
     - `MYSQL_USERNAME`: `<db-user>`
     - `MYSQL_PASSWORD`: `<db-password>`
     - `ML_SERVICE_URL`: `http://<ml-internal-host>:8000` (or the public URL of the ML service)
     - `GEMINI_API_KEY`: `<your-gemini-api-key>`
     - `LLM_MODEL`: `gemini-3.8-flash`
   - **Port**: 8080 (or PaaS `$PORT`)

---

## 🖥️ Option 3: Bare Metal / Linux VPS (Ubuntu 22.04 / Debian 12 / AWS EC2)

### 1. Install System Dependencies
```bash
sudo apt update && sudo apt install -y openjdk-17-jdk python3 python3-pip nodejs npm mysql-server curl
```

### 2. Configure MySQL
```bash
sudo mysql -e "CREATE DATABASE IF NOT EXISTS chargeback_responder;"
sudo mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_mysql_password'; FLUSH PRIVILEGES;"
```

### 3. Clone and Setup Environment
```bash
git clone https://github.com/Aakash02A/AI-Risk-Manager.git
cd AI-Risk-Manager
cp .env.example .env
```

### 4. Install ML Microservice Dependencies
```bash
cd ml
pip3 install -r requirements.txt
python3 -c "from predict import load_model; load_model()"
cd ..
```

### 5. Start All Services with 1 Command
```bash
chmod +x run.sh
./run.sh
```

---

## 💻 Option 4: Local Windows Development

Simply double-click or run from PowerShell:
```cmd
.\run.bat
```
This automatically:
- Checks and starts the Python ML Microservice on port `5000`.
- Checks and starts the Java Spring Boot Backend on port `8080`.
- Launches the Vite React 19 Frontend on `http://localhost:3000`.

---

## 🛡️ Production Verification Checklist

Run these health checks once deployed to confirm system integrity:

| Endpoint | Method | Expected Output | Purpose |
|---|---|---|---|
| `/health` | `GET` | `{"status":"UP","model_loaded":true}` | Verifies ML classifier status |
| `/api/model/metrics` | `GET` | `{"model_name":"RandomForestClassifier","accuracy":0.858,...}` | Model ROC-AUC & test metrics |
| `/api/model/thresholds` | `GET` | Array of 20 threshold evaluations | VAMP policy candidate grid |
| `/api/cases` | `GET` | Array of 11 enterprise dispute dossiers | Database persistence check |
| `/api/cases/{caseId}/predict` | `POST` | `{"win_probability":0.98,"decision":"STRONG"}` | Real-time ML inference |
| `/api/cases/{caseId}/generate-response` | `POST` | `{"defense_response":"..."}` | Gemini LLM Rebuttal generator |

---

## 🔒 Security & Compliance Notes
1. **No Mock Fallacies**: All win probabilities and precision stats are evaluated from real held-out test splits.
2. **Defensive LLM Guardrails**: Evidence generator explicitly incorporates only verified merchant facts; zero proactive cardholder debits or speculative claims are made.
3. **Audit Trail**: Every state transition (ML prediction, policy decision, rebuttal generation) records an immutable entry in the `audit_logs` table.
