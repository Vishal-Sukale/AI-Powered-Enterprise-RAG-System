import logging
import os
import time
import uuid
from logging.handlers import RotatingFileHandler
from datetime import datetime

from fastapi import FastAPI, Request, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.config import settings
from app.api import upload, chat, health, auth, admin
from app.services.vector_store import load_index
from app.core.auth import get_current_user, hash_password
from app.core.limiter import limiter
from app.core.database import init_db, get_db

os.makedirs("app/logs", exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(message)s",
    handlers=[
        logging.StreamHandler(),
        RotatingFileHandler("app/logs/app.log", maxBytes=2_000_000, backupCount=3),
    ],
)
logger = logging.getLogger("rag_system")

app = FastAPI(title="RAG System API", version="3.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Only needed for local dev (Vite on :5173 calling the API on :8000).
# In the single-service deployment everything is same-origin.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_logging_middleware(request: Request, call_next):
    request_id = str(uuid.uuid4())[:8]
    start_time = time.perf_counter()
    response = await call_next(request)
    duration_ms = round((time.perf_counter() - start_time) * 1000, 1)
    response.headers["X-Request-ID"] = request_id
    logger.info(f"[{request_id}] {request.method} {request.url.path} -> {response.status_code} ({duration_ms}ms)")
    return response


# --- API routes (registered first so they always win over the frontend catch-all) ---
app.include_router(auth.router, tags=["Auth"])
app.include_router(health.router, tags=["Health"])
app.include_router(upload.router, tags=["Upload"], dependencies=[Depends(get_current_user)])
app.include_router(chat.router, tags=["Chat"], dependencies=[Depends(get_current_user)])
app.include_router(admin.router)


# --- Serve the built React app (present only in the Docker image) ---
STATIC_ROOT = os.path.realpath(os.getenv("STATIC_DIR", "static"))

if os.path.isfile(os.path.join(STATIC_ROOT, "index.html")):
    assets_dir = os.path.join(STATIC_ROOT, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}", include_in_schema=False)
    async def serve_frontend(full_path: str):
        requested = os.path.realpath(os.path.join(STATIC_ROOT, full_path))
        # Serve a real file if it exists inside the static folder (blocks ../ tricks)
        if full_path and requested.startswith(STATIC_ROOT + os.sep) and os.path.isfile(requested):
            return FileResponse(requested)
        # Missing file with an extension (e.g. /favicon.ico) -> real 404, not HTML
        if "." in os.path.basename(full_path):
            raise HTTPException(status_code=404, detail="Not found")
        return FileResponse(os.path.join(STATIC_ROOT, "index.html"))


def _bootstrap_default_admin():
    with get_db() as conn:
        existing = conn.execute("SELECT id FROM users LIMIT 1").fetchone()
        if existing:
            return
        conn.execute(
            "INSERT INTO users (username, password_hash, role, created_at) VALUES (?, ?, ?, ?)",
            ("admin", hash_password(os.getenv("ADMIN_PASSWORD", "admin123")), "admin", datetime.utcnow().isoformat()),
        )
        logger.warning("No users existed — created the default 'admin' account.")


@app.on_event("startup")
def startup_event():
    logger.info("Starting up...")
    init_db()
    _bootstrap_default_admin()
    load_index()
    logger.info("Startup complete.")