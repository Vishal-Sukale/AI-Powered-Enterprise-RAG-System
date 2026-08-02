"""
Universal document loader.

Supports: PDF, DOCX, TXT, MD, CSV, XLSX, PPTX, JSON, HTML.

Each format-specific loader below returns a list of langchain Document
objects with consistent metadata: {filename, page}. "page" means the
literal PDF page for PDFs, the slide number for PPTX, the sheet name for
XLSX, and simply 0 for flat text formats — this keeps the rest of the
pipeline (chunking, citations, etc.) format-agnostic.
"""

import json
import os
from typing import List

from langchain_core.documents import Document

SUPPORTED_EXTENSIONS = {
    ".pdf", ".docx", ".txt", ".md", ".csv", ".xlsx", ".pptx", ".json", ".html", ".htm",
}


def is_supported(filename: str) -> bool:
    ext = os.path.splitext(filename)[1].lower()
    return ext in SUPPORTED_EXTENSIONS


def load_document(file_path: str, filename: str) -> List[Document]:
    """Dispatch to the correct parser based on file extension."""
    ext = os.path.splitext(filename)[1].lower()

    loaders = {
        ".pdf": _load_pdf,
        ".docx": _load_docx,
        ".txt": _load_text,
        ".md": _load_text,
        ".csv": _load_csv,
        ".xlsx": _load_xlsx,
        ".pptx": _load_pptx,
        ".json": _load_json,
        ".html": _load_html,
        ".htm": _load_html,
    }

    loader_fn = loaders.get(ext)
    if loader_fn is None:
        raise ValueError(f"Unsupported file type: '{ext}'")

    return loader_fn(file_path, filename)


def _load_pdf(file_path: str, filename: str) -> List[Document]:
    from langchain_community.document_loaders import PyPDFLoader

    loader = PyPDFLoader(file_path)
    pages = loader.load()
    for page in pages:
        page.metadata["filename"] = filename
    return pages


def _load_docx(file_path: str, filename: str) -> List[Document]:
    import docx

    doc = docx.Document(file_path)
    full_text = "\n".join(p.text for p in doc.paragraphs if p.text.strip())

    return [Document(
        page_content=full_text,
        metadata={"filename": filename, "page": 0},
    )]


def _load_text(file_path: str, filename: str) -> List[Document]:
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()

    return [Document(
        page_content=content,
        metadata={"filename": filename, "page": 0},
    )]


def _load_csv(file_path: str, filename: str) -> List[Document]:
    import pandas as pd

    df = pd.read_csv(file_path)
    lines = [f"Columns: {', '.join(df.columns.astype(str))}"]
    for i, row in df.iterrows():
        row_text = ", ".join(f"{col}: {val}" for col, val in row.items())
        lines.append(f"Row {i + 1}: {row_text}")

    return [Document(
        page_content="\n".join(lines),
        metadata={"filename": filename, "page": 0},
    )]


def _load_xlsx(file_path: str, filename: str) -> List[Document]:
    import openpyxl

    workbook = openpyxl.load_workbook(file_path, data_only=True)
    documents = []

    for sheet_index, sheet_name in enumerate(workbook.sheetnames):
        sheet = workbook[sheet_name]
        lines = [f"Sheet: {sheet_name}"]
        for row in sheet.iter_rows(values_only=True):
            if any(cell is not None for cell in row):
                lines.append(" | ".join(str(cell) if cell is not None else "" for cell in row))

        documents.append(Document(
            page_content="\n".join(lines),
            metadata={"filename": filename, "page": sheet_index},
        ))

    return documents


def _load_pptx(file_path: str, filename: str) -> List[Document]:
    from pptx import Presentation

    presentation = Presentation(file_path)
    documents = []

    for slide_index, slide in enumerate(presentation.slides):
        texts = []
        for shape in slide.shapes:
            if shape.has_text_frame:
                for paragraph in shape.text_frame.paragraphs:
                    text = "".join(run.text for run in paragraph.runs)
                    if text.strip():
                        texts.append(text)

        if texts:
            documents.append(Document(
                page_content="\n".join(texts),
                metadata={"filename": filename, "page": slide_index},
            ))

    return documents


def _load_json(file_path: str, filename: str) -> List[Document]:
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)

    pretty_text = json.dumps(data, indent=2, ensure_ascii=False)

    return [Document(
        page_content=pretty_text,
        metadata={"filename": filename, "page": 0},
    )]


def _load_html(file_path: str, filename: str) -> List[Document]:
    from bs4 import BeautifulSoup

    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        soup = BeautifulSoup(f.read(), "html.parser")

    for tag in soup(["script", "style"]):
        tag.decompose()

    text = soup.get_text(separator="\n")
    clean_lines = [line.strip() for line in text.splitlines() if line.strip()]

    return [Document(
        page_content="\n".join(clean_lines),
        metadata={"filename": filename, "page": 0},
    )]