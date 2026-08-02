import math
from typing import List, Tuple
from sentence_transformers import CrossEncoder
from langchain_core.documents import Document

_reranker_instance: CrossEncoder | None = None
_MODEL_NAME = "cross-encoder/ms-marco-MiniLM-L-6-v2"


def get_reranker() -> CrossEncoder:
    global _reranker_instance
    if _reranker_instance is None:
        _reranker_instance = CrossEncoder(_MODEL_NAME)
    return _reranker_instance


def _sigmoid(x: float) -> float:
    return 1.0 / (1.0 + math.exp(-x))


def rerank(query: str, documents: List[Document], top_k: int) -> List[Tuple[Document, float]]:
    if not documents:
        return []

    model = get_reranker()
    pairs = [[query, doc.page_content] for doc in documents]
    raw_scores = model.predict(pairs)

    scored = [
        (doc, round(_sigmoid(float(score)) * 100.0, 1))
        for doc, score in zip(documents, raw_scores)
    ]

    scored.sort(key=lambda pair: pair[1], reverse=True)
    return scored[:top_k]