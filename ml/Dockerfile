FROM python:3.11-slim

WORKDIR /app

# Install curl for container health check
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*

# Install python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy microservice source code and trained model assets
COPY . .

# Pre-warm model verification
RUN python -c "from predict import load_model; load_model()" || true

EXPOSE 8000

ENV PORT=8000

CMD ["python", "app.py"]
