import os
import uuid
import shutil

from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Depends

from app.config import settings
from app.services.rag_pipeline import process_and_index_pdf
from app.services import ingestion_jobs
from app.services.file_loader import is_supported, SUPPORTED_EXTENSIONS
from app.core.auth import get_current_user

router = APIRouter()


def _process_job(job_id: str, file_path: str, filename: str):
    try:
        chunk_count = process_and_index_pdf(file_path, filename)
        ingestion_jobs.mark_done(job_id, chunk_count)
    except Exception as e:
        ingestion_jobs.mark_failed(job_id, str(e))


@router.post("/upload")
async def upload_file(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    user: dict = Depends(get_current_user),
):
    if user["role"] not in ("admin", "employee"):
        raise HTTPException(status_code=403, detail="Guests are not permitted to upload documents.")

    if not is_supported(file.filename):
        allowed = ", ".join(sorted(SUPPORTED_EXTENSIONS))
        raise HTTPException(status_code=400, detail=f"Unsupported file type. Supported formats: {allowed}")

    safe_name = f"{uuid.uuid4().hex}_{file.filename}"
    file_path = os.path.join(settings.UPLOAD_DIR, safe_name)

    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {e}")

    job_id = ingestion_jobs.create_job(file.filename)
    background_tasks.add_task(_process_job, job_id, file_path, file.filename)

    return {
        "job_id": job_id,
        "filename": file.filename,
        "status": "processing",
        "message": "Upload received. Processing in the background — poll /jobs/{job_id} for status.",
    }


@router.get("/jobs/{job_id}")
async def get_job_status(job_id: str):
    job = ingestion_jobs.get_job(job_id)
    if job is None:
        raise HTTPException(status_code=404, detail="Job not found.")
    return job


@router.get("/supported-formats")
async def get_supported_formats():
    return {"formats": sorted(SUPPORTED_EXTENSIONS)}