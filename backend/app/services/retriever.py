from typing import List, Tuple, Optional
from langchain_core.documents import Document

from app.config import settings
from app.services.vector_store import get_vectorstore
from app.services.hybrid_search import bm25_search
from app.services.reranker import rerank


def retrieve_relevant_chunks(
    query: str,
    document_filter: Optional[List[str]] = None,
) -> List[Tuple[Document, float]]:
    """
    Hybrid retrieval pipeline with optional metadata filtering:
      1. FAISS embedding search  -> semantic/paraphrased matches
      2. BM25 keyword search     -> exact terms, codes, names, acronyms
      3. If document_filter is set, restrict candidates to those filenames
      4. Union + de-duplicate the two candidate pools
      5. Cross-encoder reranks the combined pool and picks the genuine top-K
    """
    vectorstore = get_vectorstore()
    if vectorstore is None:
        return []

    fetch_k = max(settings.TOP_K * 3, settings.TOP_K)

    vector_results = vectorstore.similarity_search_with_score(query, k=fetch_k)
    vector_candidates = [doc for doc, _ in vector_results]

    keyword_candidates = bm25_search(query, top_k=fetch_k)

    all_candidates = vector_candidates + keyword_candidates

    if document_filter:
        allowed = set(document_filter)
        all_candidates = [
            doc for doc in all_candidates
            if doc.metadata.get("filename") in allowed
        ]

    seen_snippets = set()
    combined_candidates: List[Document] = []
    for doc in all_candidates:
        snippet_key = " ".join(doc.page_content.split())[:150].lower()
        if snippet_key in seen_snippets:
            continue
        seen_snippets.add(snippet_key)
        combined_candidates.append(doc)

    return rerank(query, combined_candidates, top_k=settings.TOP_K)


def distance_to_similarity(confidence_percentage: float) -> float:
    """Pass-through: the reranker already returns a 0-100 confidence score."""
    return round(max(0.0, min(100.0, confidence_percentage)), 1)