from fastapi import APIRouter
from app.models.response import HealthResponse
from app.services.vector_store import get_vectorstore

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
def health_check():
    return HealthResponse(
        status="ok",
        vectorstore_loaded=get_vectorstore() is not None,
    )
