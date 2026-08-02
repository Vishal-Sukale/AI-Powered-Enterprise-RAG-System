from pydantic import BaseModel
from typing import List, Optional


class SourceItem(BaseModel):
    content: str
    page: int
    chunk_index: Optional[int] = None
    filename: str
    similarity: float
    highlight: Optional[str] = None


class ChatResponse(BaseModel):
    answer: str
    sources: List[SourceItem]
    confidence: float
    history_id: Optional[int] = None
    related_questions: List[str] = []
    conversation_id: Optional[int] = None


class UploadResponse(BaseModel):
    filename: str
    chunks_indexed: int
    message: str


class HealthResponse(BaseModel):
    status: str
    vectorstore_loaded: bool