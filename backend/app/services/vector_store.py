import os
import shutil
from typing import List, Optional
from langchain_community.vectorstores import FAISS
from langchain_core.documents import Document

from app.config import settings
from app.services.embeddings import get_embeddings

_vectorstore: Optional[FAISS] = None


def _index_path() -> str:
    return settings.VECTORSTORE_DIR


def load_index() -> Optional[FAISS]:
    global _vectorstore
    path = _index_path()
    if os.path.exists(os.path.join(path, "index.faiss")):
        _vectorstore = FAISS.load_local(
            path, get_embeddings(), allow_dangerous_deserialization=True
        )
    return _vectorstore


def get_vectorstore() -> Optional[FAISS]:
    global _vectorstore
    if _vectorstore is None:
        load_index()
    return _vectorstore


def add_documents(chunks: List[Document]) -> None:
    global _vectorstore
    if get_vectorstore() is None:
        _vectorstore = FAISS.from_documents(chunks, get_embeddings())
    else:
        _vectorstore.add_documents(chunks)
    _vectorstore.save_local(_index_path())


def delete_document(filename: str) -> int:
    global _vectorstore
    vectorstore = get_vectorstore()
    if vectorstore is None:
        return 0

    ids_to_delete = [
        doc_id for doc_id, doc in vectorstore.docstore._dict.items()
        if doc.metadata.get("filename") == filename
    ]

    if not ids_to_delete:
        return 0

    vectorstore.delete(ids_to_delete)
    vectorstore.save_local(_index_path())
    return len(ids_to_delete)


def reset_index() -> None:
    global _vectorstore
    _vectorstore = None
    if os.path.exists(settings.VECTORSTORE_DIR):
        shutil.rmtree(settings.VECTORSTORE_DIR)
    os.makedirs(settings.VECTORSTORE_DIR, exist_ok=True)