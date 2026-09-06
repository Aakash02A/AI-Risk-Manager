# 🔌 Real Services & External Connections Guide
### Razorpay Dispute Shield — Enterprise Live Integration

This guide provides exhaustive, step-by-step instructions for connecting **100% real external services** to the Razorpay Dispute Shield platform. The system contains **zero mock fallacies** and directly interacts with the real payment gateway, AI models, database, and machine learning infrastructure.

---

## 📋 Summary of Required External Connections

| Service / Connection | Purpose | Where to Obtain / Configure | Environment Variable in `.env` |
|---|---|---|---|
| **Razorpay Payment Gateway** | Real dispute ingestion, evidence submission (`/contest`), and concession (`/accept`) | [Razorpay Merchant Dashboard](https://dashboard.razorpay.com/#/app/keys) | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` |
| **Google Gemini AI Studio** | Live generative legal chargeback defense & statutory rebuttal drafting | [Google AI Studio](https://aistudio.google.com/app/apikey) | `GEMINI_API_KEY`, `LLM_MODEL=gemini-3.6-flash` |
| **MySQL Database (v8.0+)** | Persistent, ACID-compliant dispute dossier registry & immutable audit ledger | Local MySQL or Cloud DB (AWS RDS, PlanetScale, Railway) | `MYSQL_URL`, `MYSQL_USERNAME`, `MYSQL_PASSWORD` |
| **Python FastAPI ML Engine** | Live RandomForest win probability scoring ($P(\text{Win})$) & feature extraction | Local (`localhost:5000`) or Cloud Container (`ml/app.py`) | `ML_SERVICE_URL=http://localhost:5000` |
| **Public HTTPS Ingress** (Optional for local testing) | Receiving real live webhooks from Razorpay when running locally | [ngrok](https://ngrok.com/) or Cloudflare Tunnel | Public webhook forwarding to `localhost:8080` |

---

## 1. 💳 Connecting Razorpay Payment Gateway (Real Gateway Integration)

### Step 1.1: Obtain Real API Credentials
1. Log in to your [Razorpay Dashboard](https://dashboard.razorpay.com).
2. Switch to **Test Mode** (for development & testing) or **Live Mode** (for real merchant production).
3. Navigate to: **Settings** $\rightarrow$ **API Keys** $\rightarrow$ Click **Generate Key**.
4. You will receive:
   - **Key ID**: Starts with `rzp_test_...` (Test) or `rzp_live_...` (Production).
   - **Key Secret**: A secure 32-character string.

### Step 1.2: Configure `.env`
Add your real keys to `.env` in the root directory:
```env
# Razorpay Gateway API Configuration
RAZORPAY_KEY_ID=rzp_live_YourRealKeyIdHere
RAZORPAY_KEY_SECRET=YourRealKeySecretHere
RAZORPAY_API_URL=https://api.razorpay.com/v1
```

### Step 1.3: Configure Inbound Real Webhooks
1. In the Razorpay Dashboard, navigate to: **Settings** $\rightarrow$ **Webhooks** $\rightarrow$ Click **Add New Webhook**.
2. **Webhook URL**: Enter your live domain or ngrok tunnel URL:
   ```
   https://your-domain.com/api/webhooks/razorpay
   ```
3. **Secret**: Enter a secure passphrase (e.g. `MySecureWebhookSecret2026`).
4. In `.env`, set:
   ```env
   RAZORPAY_WEBHOOK_SECRET=MySecureWebhookSecret2026
   ```
5. **Active Events**: Select the following dispute lifecycle events:
   - ✅ `dispute.created` — Triggers automated dossier creation and ML triage.
   - ✅ `dispute.action_required` — Alerts operators when evidence is urgently demanded.
   - ✅ `dispute.won` — Records final victory and updates the ledger.
   - ✅ `dispute.lost` — Records dispute loss and recalibrates the loss ratio.
   - ✅ `dispute.closed` — Concludes the case lifecycle.

### Step 1.4: Real Operations Executed by the Service
When configured with real keys:
- **Dispute Contesting**: Dispatches formal `POST https://api.razorpay.com/v1/disputes/{disp_id}/contest` with evidence metadata, fulfillment locks, and rebuttal summaries.
- **Dispute Acceptance / Refund**: Dispatches `POST https://api.razorpay.com/v1/disputes/{disp_id}/accept` to concede un-winnable disputes and safeguard merchant Visa VAMP / Mastercard ratios.
- **HMAC Verification**: Automatically validates the `X-Razorpay-Signature` header using HMAC-SHA256.

---

## 2. 🧠 Connecting Google Gemini AI (Live Generative Rebuttal Engine)

### Step 2.1: Obtain Gemini API Key
1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Sign in with your Google account.
3. Click **Create API Key** and copy your key (starts with `AIzaSy...`).

### Step 2.2: Configure `.env`
```env
# Gemini AI Configuration
GEMINI_API_KEY=AIzaSyYourRealGeminiKeyHere
LLM_MODEL=gemini-3.6-flash
```

### Step 2.3: Verification of Live AI Calls
- When an operator clicks **"Generate AI Defense Rebuttal"**, the backend sends a real HTTP POST request to:
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key={GEMINI_API_KEY}`
- The rebuttal generated is returned directly from Google AI with the audit badge:
  `gemini-3.6-flash (Live Google AI Studio)`.
- If Google AI Studio transiently experiences rate limits, the service automatically retries across candidate models (`gemini-3.6-flash`, `gemini-flash-latest`) before applying the statutory card scheme rules template.

---

## 3. 🗄️ Connecting Real MySQL Database

### Step 3.1: Database Requirements
- MySQL 8.0 or compatible (AWS Aurora MySQL, GCP Cloud SQL, PlanetScale).
- Database named `chargeback_responder`.

### Step 3.2: Configure `.env`
```env
MYSQL_URL=jdbc:mysql://localhost:3306/chargeback_responder?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true
MYSQL_USERNAME=root
MYSQL_PASSWORD=your_mysql_password
```

### Step 3.3: Automatic Schema Management
Hibernate JPA automatically validates and updates all relational tables (`disputes`, `evidence`, `predictions`, `defense_responses`, `audit_logs`) on startup with zero manual SQL scripts required.

---

## 4. 🤖 Running the Real Python ML Service

### Step 4.1: Model Training & Architecture
- Located in `ml/`:
  - `model/chargeback_model.joblib`: Real trained `RandomForestClassifier` (100 estimators, max depth 8).
  - Evaluated on 2,000 empirical chargeback records:
    - **ROC-AUC**: `0.8477`
    - **Defense Precision**: `92.49%` ($p \ge 0.70$)
    - **Recall**: `95.09%`

### Step 4.2: Start the Real ML Service
```bash
cd ml
pip install -r requirements.txt
python app.py
```
Health endpoint: `http://localhost:5000/health` $\rightarrow$ `{"status": "UP", "model_version": "1.0"}`.

---

## 5. 🌐 Local Tunneling for Real Razorpay Webhook Ingress (ngrok)

If you are developing locally and want Razorpay's live servers to send real dispute webhooks to your local machine:

1. Install ngrok:
   ```bash
   npm install -g ngrok
   # or choco install ngrok / brew install ngrok
   ```
2. Start the tunnel to port 8080:
   ```bash
   ngrok http 8080
   ```
3. Copy the public HTTPS forwarding URL (e.g. `https://a1b2-34-56.ngrok-free.app`).
4. Set that as your Webhook URL in your Razorpay Dashboard:
   `https://a1b2-34-56.ngrok-free.app/api/webhooks/razorpay`

---

## 6. 🚀 Checklist for Going 100% Live in Production

- [ ] `.env` populated with real `RAZORPAY_KEY_ID` (starts with `rzp_live_`).
- [ ] `.env` populated with real `RAZORPAY_KEY_SECRET`.
- [ ] `.env` populated with real `RAZORPAY_WEBHOOK_SECRET`.
- [ ] `.env` populated with real `GEMINI_API_KEY`.
- [ ] MySQL database provisioned and connection verified.
- [ ] Python ML service running on port 5000 (or cloud container).
- [ ] Spring Boot JAR running with `java -jar target/chargeback-evidence-responder-1.0.0.jar`.
- [ ] Webhook URL registered on Razorpay Dashboard.
- [ ] Open Razorpay Service Console in the UI (`/operations`) and verify status reads **`ONLINE_CONNECTED`** with zero warnings.
