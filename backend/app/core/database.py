import os
import sqlite3
from contextlib import contextmanager

from app.config import settings

os.makedirs(os.path.dirname(settings.APP_DB_PATH), exist_ok=True)


@contextmanager
def get_db():
    conn = sqlite3.connect(settings.APP_DB_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    finally:
        conn.close()


def _column_exists(conn, table: str, column: str) -> bool:
    rows = conn.execute(f"PRAGMA table_info({table})").fetchall()
    return any(row["name"] == column for row in rows)


def init_db():
    with get_db() as conn:
        conn.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'employee',
                created_at TEXT NOT NULL
            )
        """)

        conn.execute("""
            CREATE TABLE IF NOT EXISTS conversations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                created_at TEXT NOT NULL,
                updated_at TEXT NOT NULL
            )
        """)

        conn.execute("""
            CREATE TABLE IF NOT EXISTS query_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                username TEXT NOT NULL,
                conversation_id INTEGER,
                query TEXT NOT NULL,
                answer TEXT NOT NULL,
                confidence REAL,
                created_at TEXT NOT NULL
            )
        """)
        if not _column_exists(conn, "query_history", "conversation_id"):
            conn.execute("ALTER TABLE query_history ADD COLUMN conversation_id INTEGER")

        conn.execute("""
            CREATE TABLE IF NOT EXISTS feedback (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                history_id INTEGER NOT NULL,
                helpful INTEGER NOT NULL,
                created_at TEXT NOT NULL
            )
        """)