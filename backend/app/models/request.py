from pydantic import BaseModel, Field
from typing import List, Optional


class ChatMessage(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    query: str = Field(..., min_length=1, description="User question")
    history: Optional[List[ChatMessage]] = Field(
        default=None,
        description="Recent conversation turns, oldest first, for follow-up context",
    )
    document_filter: Optional[List[str]] = Field(
        default=None,
        description="If set, only search within these filenames instead of all indexed documents",
    )
    conversation_id: Optional[int] = Field(
        default=None,
        description="Existing conversation to continue. If omitted, a new conversation is created.",
    )


class FeedbackRequest(BaseModel):
    history_id: int
    helpful: bool