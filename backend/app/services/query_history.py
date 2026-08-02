from datetime import datetime
from typing import List, Dict, Optional
from app.core.database import get_db


def save_query(
    user_id: int, username: str, query: str, answer: str, confidence: float,
    conversation_id: Optional[int] = None,
) -> int:
    with get_db() as conn:
        cursor = conn.execute(
            "INSERT INTO query_history (user_id, username, conversation_id, query, answer, confidence, created_at) "
            "VALUES (?, ?, ?, ?, ?, ?, ?)",
            (user_id, username, conversation_id, query, answer, confidence, datetime.utcnow().isoformat()),
        )
        return cursor.lastrowid


def list_history(user_id: Optional[int] = None, limit: int = 100) -> List[Dict]:
    with get_db() as conn:
        if user_id is not None:
            rows = conn.execute(
                "SELECT * FROM query_history WHERE user_id = ? ORDER BY id DESC LIMIT ?",
                (user_id, limit),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM query_history ORDER BY id DESC LIMIT ?", (limit,)
            ).fetchall()
        return [dict(row) for row in rows]