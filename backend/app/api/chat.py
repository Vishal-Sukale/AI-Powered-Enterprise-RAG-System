import json
from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.responses import StreamingResponse

from app.models.request import ChatRequest, FeedbackRequest
from app.models.response import ChatResponse
from app.services.rag_pipeline import answer_query, stream_answer_query, suggested_questions_for_document
from app.services.vector_store import reset_index, delete_document
from app.services.document_registry import list_documents, remove_document, clear_registry
from app.services import query_history, feedback_service, conversations
from app.core.limiter import limiter
from app.core.auth import get_current_user, require_role

router = APIRouter()


def _ensure_conversation(user: dict, chat_request: ChatRequest) -> int:
    if chat_request.conversation_id is not None:
        conversations.touch_conversation(chat_request.conversation_id)
        return chat_request.conversation_id
    return conversations.create_conversation(user["id"], chat_request.query)


@router.post("/chat", response_model=ChatResponse)
@limiter.limit("20/minute")
async def chat(request: Request, chat_request: ChatRequest, user: dict = Depends(get_current_user)):
    try:
        conversation_id = _ensure_conversation(user, chat_request)
        history = [turn.model_dump() for turn in chat_request.history] if chat_request.history else None
        answer, sources, confidence, related_questions = answer_query(
            chat_request.query, history, chat_request.document_filter
        )
        history_id = query_history.save_query(
            user["id"], user["username"], chat_request.query, answer, confidence, conversation_id
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Query failed: {e}")

    return ChatResponse(
        answer=answer, sources=sources, confidence=confidence,
        history_id=history_id, related_questions=related_questions,
        conversation_id=conversation_id,
    )


@router.post("/chat/stream")
@limiter.limit("20/minute")
async def chat_stream(request: Request, chat_request: ChatRequest, user: dict = Depends(get_current_user)):
    history = [turn.model_dump() for turn in chat_request.history] if chat_request.history else None
    conversation_id = _ensure_conversation(user, chat_request)

    def event_generator():
        accumulated_answer = ""
        try:
            yield f"data: {json.dumps({'type': 'conversation', 'conversation_id': conversation_id})}\n\n"

            for event in stream_answer_query(
                chat_request.query, history, chat_request.document_filter
            ):
                if event["type"] == "token":
                    accumulated_answer += event["content"]
                elif event["type"] == "done":
                    history_id = query_history.save_query(
                        user["id"], user["username"], chat_request.query,
                        accumulated_answer, event.get("confidence", 0.0), conversation_id,
                    )
                    event["history_id"] = history_id
                    event["conversation_id"] = conversation_id
                yield f"data: {json.dumps(event)}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")


@router.get("/conversations")
async def get_conversations(user: dict = Depends(get_current_user)):
    return {"conversations": conversations.list_conversations(user["id"])}


@router.get("/conversations/{conversation_id}/messages")
async def get_conversation_messages_route(conversation_id: int, user: dict = Depends(get_current_user)):
    return {"messages": conversations.get_conversation_messages(conversation_id, user["id"])}


@router.delete("/conversations/{conversation_id}")
async def delete_conversation_route(conversation_id: int, user: dict = Depends(get_current_user)):
    deleted = conversations.delete_conversation(conversation_id, user["id"])
    if not deleted:
        raise HTTPException(status_code=404, detail="Conversation not found.")
    return {"message": "Conversation deleted."}


@router.get("/history")
async def get_my_history(limit: int = 100, user: dict = Depends(get_current_user)):
    return {"history": query_history.list_history(user_id=user["id"], limit=limit)}


@router.get("/documents/{filename}/suggested-questions")
async def get_suggested_questions(filename: str, user: dict = Depends(get_current_user)):
    questions = suggested_questions_for_document(filename)
    return {"questions": questions}


@router.post("/feedback")
async def submit_feedback(request: FeedbackRequest, user: dict = Depends(get_current_user)):
    feedback_service.save_feedback(request.history_id, request.helpful)
    return {"message": "Feedback recorded. Thank you!"}


@router.delete("/reset")
async def reset(user: dict = Depends(require_role("admin", "employee"))):
    reset_index()
    clear_registry()
    return {"message": "Vectorstore reset successfully."}


@router.get("/documents")
async def get_documents(user: dict = Depends(get_current_user)):
    return {"documents": list_documents()}


@router.delete("/documents/{filename}")
async def delete_document_route(filename: str, user: dict = Depends(require_role("admin", "employee"))):
    chunks_removed = delete_document(filename)
    existed_in_registry = remove_document(filename)

    if chunks_removed == 0 and not existed_in_registry:
        raise HTTPException(status_code=404, detail=f"Document '{filename}' not found.")

    return {
        "message": f"Document '{filename}' removed successfully.",
        "chunks_removed": chunks_removed,
    }