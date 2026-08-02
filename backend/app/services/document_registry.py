import json
import os
from datetime import datetime
from typing import List, Dict

from app.config import settings

_REGISTRY_PATH = os.path.join(settings.VECTORSTORE_DIR, "documents.json")


def _load_registry() -> List[Dict]:
    if not os.path.exists(_REGISTRY_PATH):
        return []
    try:
        with open(_REGISTRY_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except (json.JSONDecodeError, OSError):
        return []


def _save_registry(entries: List[Dict]) -> None:
    os.makedirs(settings.VECTORSTORE_DIR, exist_ok=True)
    with open(_REGISTRY_PATH, "w", encoding="utf-8") as f:
        json.dump(entries, f, indent=2)


def add_document(filename: str, chunks_indexed: int, file_path: str = None) -> None:
    entries = _load_registry()
    entries.append({
        "filename": filename,
        "chunks_indexed": chunks_indexed,
        "file_path": file_path,
        "uploaded_at": datetime.utcnow().isoformat() + "Z",
    })
    _save_registry(entries)


def list_documents() -> List[Dict]:
    return _load_registry()


def remove_document(filename: str) -> bool:
    entries = _load_registry()
    remaining = [e for e in entries if e["filename"] != filename]
    removed = len(remaining) != len(entries)
    _save_registry(remaining)
    return removed


def clear_registry() -> None:
    _save_registry([])