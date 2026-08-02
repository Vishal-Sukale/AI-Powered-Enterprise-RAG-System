from typing import List
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document

from app.config import settings


def split_documents(documents: List[Document]) -> List[Document]:
    """Split documents into overlapping chunks for embedding."""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=settings.CHUNK_SIZE,
        chunk_overlap=settings.CHUNK_OVERLAP,
        separators=["\n\n", "\n", ". ", " ", ""],
    )
    chunks = splitter.split_documents(documents)

    # Tag each chunk with its position within its own document, so citations
    # can show "Chunk 3 of Policy.pdf" instead of just a bare page number.
    per_filename_counter: dict = {}
    for chunk in chunks:
        filename = chunk.metadata.get("filename", "unknown")
        per_filename_counter[filename] = per_filename_counter.get(filename, 0) + 1
        chunk.metadata["chunk_index"] = per_filename_counter[filename]

    return chunks