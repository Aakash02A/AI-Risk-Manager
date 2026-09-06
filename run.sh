#!/usr/bin/env bash
# ============================================================
#   Chargeback Evidence Responder - Linux / macOS Launch Script
# ============================================================

set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

echo "============================================================"
echo "  Starting Chargeback Evidence Responder"
echo "  - Java Spring Boot Backend  : http://localhost:8080"
echo "  - Python ML Microservice    : http://localhost:5000"
echo "  - React 19 Frontend (Vite)  : http://localhost:3000"
echo "============================================================"
echo ""

# Ensure .env exists
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp ".env.example" ".env"
        echo "[OK] Created .env configuration from template."
    fi
fi

# Ensure Python ML Microservice is running
if ! lsof -i:5000 >/dev/null 2>&1; then
    echo "[INFO] Starting Python ML Microservice on port 5000..."
    cd "$DIR/ml"
    if command -v python3 >/dev/null 2>&1; then
        python3 app.py > /dev/null 2>&1 &
    else
        python app.py > /dev/null 2>&1 &
    fi
    cd "$DIR"
    echo "[OK] Python ML Microservice launched."
else
    echo "[OK] Python ML Microservice is already running on port 5000."
fi

# Ensure Java Spring Boot Backend is running
if ! lsof -i:8080 >/dev/null 2>&1; then
    echo "[INFO] Starting Java Spring Boot Backend on port 8080..."
    cd "$DIR/backend"
    chmod +x ./mvnw || true
    ./mvnw spring-boot:run > /dev/null 2>&1 &
    cd "$DIR"
    echo "[OK] Java Spring Boot Backend launched."
else
    echo "[OK] Java Spring Boot Backend is already running on port 8080."
fi

echo ""
echo "Open browser at: http://localhost:3000"
echo "Press Ctrl+C to stop the Vite dev server."
echo ""

npm run dev
