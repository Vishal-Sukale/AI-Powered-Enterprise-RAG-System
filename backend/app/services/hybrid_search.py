import re
from typing import List
from rank_bm25 import BM25Okapi
from langchain_core.documents import Document

from app.services.vector_store import get_vectorstore

_bm25_index: BM25Okapi | None = None
_bm25_documents: List[Document] = []
_indexed_doc_count: int = -1


def _tokenize(text: str) -> List[str]:
    return re.findall(r"[a-z0-9]+", text.lower())


def _rebuild_if_needed() -> None:
    global _bm25_index, _bm25_documents, _indexed_doc_count

    vectorstore = get_vectorstore()
    if vectorstore is None:
        _bm25_index = None
        _bm25_documents = []
        _indexed_doc_count = -1
        return

    current_docs = list(vectorstore.docstore._dict.values())
    if len(current_docs) == _indexed_doc_count and _bm25_index is not None:
        return

    _bm25_documents = current_docs
    tokenized_corpus = [_tokenize(doc.page_content) for doc in current_docs]
    _bm25_index = BM25Okapi(tokenized_corpus) if tokenized_corpus else None
    _indexed_doc_count = len(current_docs)


def bm25_search(query: str, top_k: int) -> List[Document]:
    """Keyword-based search — strong for exact terms, codes, and names."""
    _rebuild_if_needed()

    if _bm25_index is None or not _bm25_documents:
        return []

    scores = _bm25_index.get_scores(_tokenize(query))
    ranked_indices = sorted(range(len(scores)), key=lambda i: scores[i], reverse=True)

    return [_bm25_documents[i] for i in ranked_indices[:top_k] if scores[i] > 0]