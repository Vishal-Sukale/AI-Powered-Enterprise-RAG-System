import os
from pathlib import Path
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import FileResponse

from app.core.auth import require_role
from app.services.document_registry import list_documents
from app.services.vector_store import reset_index
from app.services.rag_pipeline import process_and_index_pdf
from app.services.feedback_service import feedback_stats
from app.services.query_history import list_history

router = APIRouter(prefix="/admin", tags=["Admin"], dependencies=[Depends(require_role("admin"))])

LOG_FILE_PATH = "app/logs/app.log"


@router.get("/documents")
async def admin_list_documents():
    return {"documents": list_documents()}


@router.post("/rebuild-index")
async def rebuild_index():
    """Re-embeds every currently registered document from scratch."""
    docs = list_documents()
    reset_index()

    rebuilt, failed = [], []
    for doc in docs:
        file_path = doc.get("file_path")
        if not file_path or not os.path.exists(file_path):
            failed.append(doc["filename"])
            continue
        try:
            process_and_index_pdf(file_path, doc["filename"])
            rebuilt.append(doc["filename"])
        except Exception:
            failed.append(doc["filename"])

    return {"rebuilt": rebuilt, "failed": failed}


@router.get("/logs")
async def get_logs(lines: int = 200):
    path = Path(LOG_FILE_PATH)
    if not path.exists():
        return {"logs": []}
    with open(path, "r", encoding="utf-8", errors="ignore") as f:
        all_lines = f.readlines()
    return {"logs": [line.rstrip() for line in all_lines[-lines:]]}


@router.get("/logs/download")
async def download_logs():
    path = Path(LOG_FILE_PATH)
    if not path.exists():
        raise HTTPException(status_code=404, detail="No log file found yet.")
    return FileResponse(path, filename="app.log", media_type="text/plain")


@router.get("/feedback-stats")
async def get_feedback_stats():
    return feedback_stats()


@router.get("/query-history")
async def admin_query_history(limit: int = 100):
    return {"history": list_history(user_id=None, limit=limit)}


@router.delete("/cache")
async def clear_cache():
    """Clears in-memory caches (currently the BM25 keyword index cache)."""
    from app.services import hybrid_search
    hybrid_search._bm25_index = None
    hybrid_search._bm25_documents = []
    hybrid_search._indexed_doc_count = -1
    return {"message": "In-memory caches cleared."}