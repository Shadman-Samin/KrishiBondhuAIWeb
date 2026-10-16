# KrishiBondhuVision — FastAPI + YOLO backend for 24/7 hosts
# (Hugging Face Spaces Docker, Render, Railway). Serves API only; the
# frontend deploys separately on Vercel pointing at this service.
FROM python:3.10-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

# System deps for opencv / pillow (slim-safe)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 libglib2.0-0 libsm6 libxext6 libxrender1 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --upgrade pip && pip install -r requirements.txt

# App code only (model downloads from HF on first request via
# HF_MODEL_REPO/HF_MODEL_FILE; models/*.pt is gitignored anyway)
COPY api/ ./api/

# Optional prebuilt web fallback (set WEB_DIST to match). Copy only if present:
# COPY web-dist/ ./web-dist/

EXPOSE 7860
CMD ["uvicorn", "api.server:app", "--host", "0.0.0.0", "--port", "7860"]
