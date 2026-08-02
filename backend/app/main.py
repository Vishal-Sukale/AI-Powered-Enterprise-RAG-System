import logging
import os
import time
import uuid
from logging.handlers import RotatingFileHandler
from datetime import datetime

from fastapi import FastAPI, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
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
    logger.info(
        f"[{request_id}] {request.method} {request.url.path} "
        f"-> {response.status_code} ({duration_ms}ms)"
    )
    return response


app.include_router(auth.router, tags=["Auth"])
app.include_router(health.router, tags=["Health"])
app.include_router(upload.router, tags=["Upload"], dependencies=[Depends(get_current_user)])
app.include_router(chat.router, tags=["Chat"], dependencies=[Depends(get_current_user)])
app.include_router(admin.router)


def _bootstrap_default_admin():
    with get_db() as conn:
        existing = conn.execute("SELECT id FROM users LIMIT 1").fetchone()
        if existing:
            return
        conn.execute(
            "INSERT INTO users (username, password_hash, role, created_at) VALUES (?, ?, ?, ?)",
            ("admin", hash_password("admin123"), "admin", datetime.utcnow().isoformat()),
        )
        logger.warning(
            "No users existed — created default account admin/admin123. "
            "Change this password immediately in production."
        )


@app.on_event("startup")
def startup_event():
    logger.info("Starting up...")
    init_db()
    _bootstrap_default_admin()
    load_index()
    logger.info("Startup complete.")