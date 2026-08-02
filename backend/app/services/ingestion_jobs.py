import json
import os
import uuid
from datetime import datetime
from typing import Dict, Optional

from app.config import settings

_JOBS_PATH = os.path.join(settings.VECTORSTORE_DIR, "jobs.json")


def _load_jobs() -> Dict[str, dict]:
    if not os.path.exists(_JOBS_PATH):
        return {}
    try:
        with open(_JOBS_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return {}


def _save_jobs(jobs: Dict[str, dict]) -> None:
    os.makedirs(settings.VECTORSTORE_DIR, exist_ok=True)
    with open(_JOBS_PATH, "w", encoding="utf-8") as f:
        json.dump(jobs, f, indent=2)


def create_job(filename: str) -> str:
    job_id = str(uuid.uuid4())
    jobs = _load_jobs()
    jobs[job_id] = {
        "job_id": job_id,
        "filename": filename,
        "status": "processing",
        "chunks_indexed": None,
        "error": None,
        "created_at": datetime.utcnow().isoformat() + "Z",
    }
    _save_jobs(jobs)
    return job_id


def mark_done(job_id: str, chunks_indexed: int) -> None:
    jobs = _load_jobs()
    if job_id in jobs:
        jobs[job_id]["status"] = "done"
        jobs[job_id]["chunks_indexed"] = chunks_indexed
        _save_jobs(jobs)


def mark_failed(job_id: str, error: str) -> None:
    jobs = _load_jobs()
    if job_id in jobs:
        jobs[job_id]["status"] = "failed"
        jobs[job_id]["error"] = error
        _save_jobs(jobs)


def get_job(job_id: str) -> Optional[dict]:
    return _load_jobs().get(job_id)