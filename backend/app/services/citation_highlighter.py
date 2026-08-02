import re
from typing import Optional


def _split_sentences(text: str) -> list:
    # Simple, dependency-free sentence splitter — good enough for citation highlighting
    sentences = re.split(r"(?<=[.!?])\s+", text.strip())
    return [s.strip() for s in sentences if s.strip()]


def _tokenize(text: str) -> set:
    return set(re.findall(r"[a-z0-9]+", text.lower()))


def find_best_sentence(chunk_text: str, query: str) -> Optional[str]:
    """
    Returns the single sentence within a chunk that best matches the query,
    using simple token-overlap scoring. This powers "exact sentence used"
    citation highlighting — a lightweight, fast alternative to running the
    cross-encoder again at the sentence level.
    """
    sentences = _split_sentences(chunk_text)
    if not sentences:
        return None

    query_tokens = _tokenize(query)
    if not query_tokens:
        return sentences[0]

    best_sentence = None
    best_score = -1

    for sentence in sentences:
        sentence_tokens = _tokenize(sentence)
        overlap = len(query_tokens & sentence_tokens)
        if overlap > best_score:
            best_score = overlap
            best_sentence = sentence

    return best_sentence if best_score > 0 else sentences[0]