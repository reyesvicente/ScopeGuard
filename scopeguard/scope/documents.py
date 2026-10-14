"""Turn an uploaded contract or SOW file into plain text.

Uploads are parsed and discarded; only the extracted text is returned.
"""

import re
import zipfile
from pathlib import Path
from typing import IO
from typing import TYPE_CHECKING

import docx
from pypdf import PdfReader
from pypdf.errors import PdfReadError

if TYPE_CHECKING:
    from docx.document import Document as DocxDocument

MAX_UPLOAD_BYTES = 10 * 1024 * 1024
MAX_PDF_PAGES = 100
SUPPORTED_EXTENSIONS = {".pdf", ".docx", ".txt", ".md"}


class DocumentError(Exception):
    """Raised when a file can't be turned into usable text."""


def extract_text(file: IO[bytes], filename: str) -> str:
    """Extract readable text from a PDF, DOCX, TXT or Markdown file."""
    extension = Path(filename).suffix.lower()
    if extension == ".pdf":
        text = _pdf_text(file)
    elif extension == ".docx":
        text = _docx_text(file)
    elif extension in {".txt", ".md"}:
        text = _plain_text(file.read())
    else:
        msg = "Upload a PDF, Word (.docx), text or Markdown file."
        raise DocumentError(msg)

    text = _tidy(text)
    if not text:
        msg = (
            "No text found in this file. Scanned PDFs aren't supported yet, "
            "so paste the text instead."
        )
        raise DocumentError(msg)
    return text


def _pdf_text(file: IO[bytes]) -> str:
    try:
        reader = PdfReader(file)
        if reader.is_encrypted:
            msg = "This PDF is password-protected. Remove the password and try again."
            raise DocumentError(msg)
        if len(reader.pages) > MAX_PDF_PAGES:
            msg = f"PDFs are limited to {MAX_PDF_PAGES} pages."
            raise DocumentError(msg)
        return "\n\n".join(page.extract_text() or "" for page in reader.pages)
    except (PdfReadError, ValueError, KeyError) as exc:
        msg = "This PDF couldn't be read. It may be damaged."
        raise DocumentError(msg) from exc


def _docx_text(file: IO[bytes]) -> str:
    try:
        document = docx.Document(file)
    except (zipfile.BadZipFile, KeyError, ValueError) as exc:
        msg = "This Word file couldn't be read. Save it as .docx and try again."
        raise DocumentError(msg) from exc
    return _docx_body(document)


def _docx_body(document: DocxDocument) -> str:
    """Paragraphs and table cells in document order; SOWs often put scope in tables."""
    lines: list[str] = []
    for block in document.iter_inner_content():
        if hasattr(block, "rows"):
            for row in block.rows:
                cells = [cell.text.strip() for cell in row.cells]
                lines.append(" | ".join(dict.fromkeys(c for c in cells if c)))
        else:
            lines.append(block.text)
    return "\n".join(lines)


def _plain_text(data: bytes) -> str:
    for encoding in ("utf-8-sig", "cp1252"):
        try:
            return data.decode(encoding)
        except UnicodeDecodeError:
            continue
    return data.decode("latin-1")


def _tidy(text: str) -> str:
    text = text.replace("\r\n", "\n").replace("\r", "\n").replace("\x00", "")
    text = re.sub(r"[ \t]+\n", "\n", text)
    text = re.sub(r"\n{3,}", "\n\n", text)
    return text.strip()
