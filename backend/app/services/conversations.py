from datetime import datetime
from typing import List, Dict
from app.core.database import get_db


def create_conversation(user_id: int, title: str) -> int:
    now = datetime.utcnow().isoformat()
    clean_title = title.strip()[:60] or "New chat"
    with get_db() as conn:
        cursor = conn.execute(
            "INSERT INTO conversations (user_id, title, created_at, updated_at) VALUES (?, ?, ?, ?)",
            (user_id, clean_title, now, now),
        )
        return cursor.lastrowid


def touch_conversation(conversation_id: int) -> None:
    with get_db() as conn:
        conn.execute(
            "UPDATE conversations SET updated_at = ? WHERE id = ?",
            (datetime.utcnow().isoformat(), conversation_id),
        )


def list_conversations(user_id: int) -> List[Dict]:
    with get_db() as conn:
        rows = conn.execute(
            "SELECT * FROM conversations WHERE user_id = ? ORDER BY updated_at DESC",
            (user_id,),
        ).fetchall()
        return [dict(row) for row in rows]


def get_conversation_messages(conversation_id: int, user_id: int) -> List[Dict]:
    with get_db() as conn:
        owner = conn.execute(
            "SELECT user_id FROM conversations WHERE id = ?", (conversation_id,)
        ).fetchone()
        if owner is None or owner["user_id"] != user_id:
            return []

        rows = conn.execute(
            "SELECT * FROM query_history WHERE conversation_id = ? ORDER BY id ASC",
            (conversation_id,),
        ).fetchall()
        return [dict(row) for row in rows]


def delete_conversation(conversation_id: int, user_id: int) -> bool:
    with get_db() as conn:
        owner = conn.execute(
            "SELECT user_id FROM conversations WHERE id = ?", (conversation_id,)
        ).fetchone()
        if owner is None or owner["user_id"] != user_id:
            return False

        conn.execute("DELETE FROM query_history WHERE conversation_id = ?", (conversation_id,))
        conn.execute("DELETE FROM conversations WHERE id = ?", (conversation_id,))
        return True