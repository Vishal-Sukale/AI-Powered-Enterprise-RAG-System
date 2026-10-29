# ---------- Stage 1: build the React frontend ----------
FROM node:20-alpine AS frontend-build
WORKDIR /frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
# Make sure no local .env (e.g. localhost API URL) gets baked into the build
RUN rm -f .env .env.*
RUN npm run build

# ---------- Stage 2: Python backend + built frontend ----------
FROM python:3.11-slim
WORKDIR /app
ENV PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

# CPU-only PyTorch first (avoids ~2 GB of unused CUDA libraries)
RUN pip install torch --index-url https://download.pytorch.org/whl/cpu

COPY backend/app/requirements.txt ./requirements.txt
RUN pip install -r requirements.txt

# Bake the two ML models into the image so cold starts don't download them
RUN python -c "from sentence_transformers import SentenceTransformer, CrossEncoder; SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2'); CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')"

COPY backend/app ./app
COPY --from=frontend-build /frontend/dist ./static

EXPOSE 8000
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]