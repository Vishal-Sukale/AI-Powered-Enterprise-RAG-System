from typing import List, Tuple, Dict, Optional
from app.services import file_loader, text_splitter, vector_store, retriever, llm, document_registry
from app.services.citation_highlighter import find_best_sentence


def process_and_index_pdf(file_path: str, filename: str) -> int:
    pages = file_loader.load_document(file_path, filename)
    chunks = text_splitter.split_documents(pages)
    vector_store.add_documents(chunks)
    document_registry.add_document(filename, len(chunks), file_path)
    return len(chunks)


def _build_context(results: List[Tuple]) -> str:
    parts = []
    for doc, _ in results:
        page = doc.metadata.get("page", 0) + 1
        filename = doc.metadata.get("filename", "unknown")
        parts.append(f"[Source: {filename}, page {page}]\n{doc.page_content}")
    return "\n\n".join(parts)


def _build_sources(results: List[Tuple], query: str) -> List[Dict]:
    sources = []
    for doc, distance in results:
        best_sentence = find_best_sentence(doc.page_content, query)
        sources.append({
            "content": doc.page_content[:300] + ("..." if len(doc.page_content) > 300 else ""),
            "page": doc.metadata.get("page", 0) + 1,
            "chunk_index": doc.metadata.get("chunk_index"),
            "filename": doc.metadata.get("filename", "unknown"),
            "similarity": retriever.distance_to_similarity(distance),
            "highlight": best_sentence,
        })
    sources.sort(key=lambda s: s["similarity"], reverse=True)
    return sources


def _overall_confidence(results: List[Tuple]) -> float:
    if not results:
        return 0.0
    similarities = [retriever.distance_to_similarity(d) for _, d in results]
    best = max(similarities)
    average = sum(similarities) / len(similarities)
    confidence = (0.65 * best) + (0.35 * average)
    return round(confidence, 1)


def answer_query(
    question: str,
    history: List[Dict] = None,
    document_filter: Optional[List[str]] = None,
) -> Tuple[str, List[Dict], float, List[str]]:
    results = retriever.retrieve_relevant_chunks(question, document_filter)

    if not results:
        return (
            "No relevant documents found. Please upload a file first or try a different question.",
            [], 0.0, [],
        )

    context = _build_context(results)
    answer = llm.generate_answer(question, context, history)
    sources = _build_sources(results, question)
    confidence = _overall_confidence(results)

    try:
        related_questions = llm.generate_related_questions(question, answer)
    except Exception:
        related_questions = []

    return answer, sources, confidence, related_questions


def stream_answer_query(
    question: str,
    history: List[Dict] = None,
    document_filter: Optional[List[str]] = None,
):
    results = retriever.retrieve_relevant_chunks(question, document_filter)

    if not results:
        yield {"type": "token", "content": "No relevant documents found. Please upload a file first or try a different question."}
        yield {"type": "done", "sources": [], "confidence": 0.0, "related_questions": []}
        return

    context = _build_context(results)
    accumulated_answer = ""

    for chunk in llm.stream_answer(question, context, history):
        accumulated_answer += chunk
        yield {"type": "token", "content": chunk}

    sources = _build_sources(results, question)
    confidence = _overall_confidence(results)

    try:
        related_questions = llm.generate_related_questions(question, accumulated_answer)
    except Exception:
        related_questions = []

    yield {
        "type": "done",
        "sources": sources,
        "confidence": confidence,
        "related_questions": related_questions,
    }


def suggested_questions_for_document(filename: str) -> List[str]:
    from app.services.vector_store import get_vectorstore

    vectorstore = get_vectorstore()
    if vectorstore is None:
        return []

    matching_docs = [
        doc for doc in vectorstore.docstore._dict.values()
        if doc.metadata.get("filename") == filename
    ]

    if not matching_docs:
        return []

    matching_docs.sort(key=lambda d: d.metadata.get("chunk_index", 0))
    sample_text = "\n\n".join(doc.page_content for doc in matching_docs[:3])

    try:
        return llm.generate_suggested_questions(sample_text, filename)
    except Exception:
        return []