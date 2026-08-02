from typing import List
from langchain_community.document_loaders import PyPDFLoader
from langchain_core.documents import Document


def load_pdf(file_path: str, filename: str) -> List[Document]:
    """Load a PDF file and tag each page with its source filename."""
    loader = PyPDFLoader(file_path)
    pages = loader.load()

    for page in pages:
        page.metadata["filename"] = filename

    return pages
