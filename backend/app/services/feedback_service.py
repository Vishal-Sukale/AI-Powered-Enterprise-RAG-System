from datetime import datetime
from typing import Dict
from app.core.database import get_db


def save_feedback(history_id: int, helpful: bool) -> None:
    with get_db() as conn:
        conn.execute(
            "INSERT INTO feedback (history_id, helpful, created_at) VALUES (?, ?, ?)",
            (history_id, int(helpful), datetime.utcnow().isoformat()),
        )


def feedback_stats() -> Dict:
    with get_db() as conn:
        total = conn.execute("SELECT COUNT(*) as c FROM feedback").fetchone()["c"]
        helpful = conn.execute(
            "SELECT COUNT(*) as c FROM feedback WHERE helpful = 1"
        ).fetchone()["c"]

    return {
        "total_feedback": total,
        "helpful": helpful,
        "not_helpful": total - helpful,
        "helpful_rate": round((helpful / total * 100), 1) if total else 0.0,
    }