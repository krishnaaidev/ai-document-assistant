import io
import re
import uuid
import logging
from dataclasses import dataclass
from typing import List, Optional, Tuple
from app.core.config import get_settings

logger = logging.getLogger(__name__)


@dataclass
class DocumentChunk:
    chunk_id: str
    document_id: str
    text: str
    page_num: int
    chunk_index: int


class DocumentProcessor:
    def __init__(self):
        self.settings = get_settings()

    def extract_text_from_pdf(self, file_bytes: bytes) -> List[Tuple[int, str]]:
        """
        Extract text page by page from PDF using pypdf.
        Returns list of (page_num, page_text) tuples (1-indexed).
        """
        import pypdf

        pages_data: List[Tuple[int, str]] = []
        try:
            reader = pypdf.PdfReader(io.BytesIO(file_bytes))
            for idx, page in enumerate(reader.pages):
                page_text = page.extract_text() or ""
                # Normalize whitespace
                cleaned_text = re.sub(r"[ \t]+", " ", page_text).strip()
                pages_data.append((idx + 1, cleaned_text))
        except Exception as e:
            logger.error("Error reading PDF: %s", e)
            raise ValueError(f"Failed to extract text from PDF: {str(e)}")

        # Check if scanned or empty
        total_text = "".join(text for _, text in pages_data).strip()
        if not total_text:
            raise ValueError("The PDF appears to be empty or contains only scanned images without extractable text.")

        return pages_data

    def extract_text_from_docx(self, file_bytes: bytes) -> List[Tuple[int, str]]:
        """
        Extract text from DOCX using python-docx.
        Returns list of (approx_page_num, text) tuples.
        """
        import docx

        try:
            doc = docx.Document(io.BytesIO(file_bytes))
            full_text_list: List[str] = []

            for para in doc.paragraphs:
                text = para.text.strip()
                if text:
                    full_text_list.append(text)

            for table in doc.tables:
                for row in table.rows:
                    row_text = " | ".join(cell.text.strip() for cell in row.cells if cell.text.strip())
                    if row_text:
                        full_text_list.append(row_text)

            combined_text = "\n\n".join(full_text_list)
            if not combined_text.strip():
                raise ValueError("The Word document does not contain extractable text.")

            # Approximate pagination for docx (~3000 chars per page)
            approx_page_size = 3000
            pages_data: List[Tuple[int, str]] = []
            if len(combined_text) <= approx_page_size:
                pages_data.append((1, combined_text))
            else:
                paragraphs = combined_text.split("\n\n")
                current_page = 1
                current_buffer: List[str] = []
                current_len = 0

                for p in paragraphs:
                    current_buffer.append(p)
                    current_len += len(p)
                    if current_len >= approx_page_size:
                        pages_data.append((current_page, "\n\n".join(current_buffer)))
                        current_buffer = []
                        current_len = 0
                        current_page += 1

                if current_buffer:
                    pages_data.append((current_page, "\n\n".join(current_buffer)))

            return pages_data
        except Exception as e:
            logger.error("Error reading DOCX: %s", e)
            raise ValueError(f"Failed to extract text from DOCX: {str(e)}")

    def extract_text_from_txt(self, file_bytes: bytes) -> List[Tuple[int, str]]:
        """Extract text from plain text or markdown files."""
        encodings = ["utf-8", "latin-1", "cp1252", "iso-8859-1"]
        decoded_text = None
        for enc in encodings:
            try:
                decoded_text = file_bytes.decode(enc)
                break
            except (UnicodeDecodeError, LookupError):
                continue

        if decoded_text is None:
            decoded_text = file_bytes.decode("utf-8", errors="ignore")

        cleaned_text = decoded_text.strip()
        if not cleaned_text:
            raise ValueError("The text file is empty.")

        # Approximate pagination
        approx_page_size = 3000
        pages_data: List[Tuple[int, str]] = []
        if len(cleaned_text) <= approx_page_size:
            pages_data.append((1, cleaned_text))
        else:
            chunks = [cleaned_text[i:i + approx_page_size] for i in range(0, len(cleaned_text), approx_page_size)]
            for idx, c in enumerate(chunks):
                pages_data.append((idx + 1, c))

        return pages_data

    def extract_text(self, file_bytes: bytes, content_type: str, filename: str) -> List[Tuple[int, str]]:
        """Extract text page by page based on file MIME type or filename extension."""
        lower_name = filename.lower()
        if content_type == "application/pdf" or lower_name.endswith(".pdf"):
            return self.extract_text_from_pdf(file_bytes)
        elif (
            content_type in (
                "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "application/msword",
            )
            or lower_name.endswith(".docx")
        ):
            return self.extract_text_from_docx(file_bytes)
        elif (
            content_type.startswith("text/")
            or lower_name.endswith(".txt")
            or lower_name.endswith(".md")
            or lower_name.endswith(".csv")
            or lower_name.endswith(".json")
        ):
            return self.extract_text_from_txt(file_bytes)
        else:
            # Fallback to plain text decoding
            return self.extract_text_from_txt(file_bytes)

    def chunk_text(
        self,
        pages_data: List[Tuple[int, str]],
        document_id: str,
        chunk_size: Optional[int] = None,
        chunk_overlap: Optional[int] = None,
    ) -> List[DocumentChunk]:
        """
        Split page-separated text into overlapping chunks while preserving page numbers.
        """
        c_size = chunk_size or self.settings.CHUNK_SIZE
        c_overlap = chunk_overlap or self.settings.CHUNK_OVERLAP
        step = max(1, c_size - c_overlap)

        chunks: List[DocumentChunk] = []
        global_chunk_idx = 0

        for page_num, text in pages_data:
            text = text.strip()
            if not text:
                continue

            if len(text) <= c_size:
                chunks.append(
                    DocumentChunk(
                        chunk_id=f"{document_id}_chunk_{global_chunk_idx}",
                        document_id=document_id,
                        text=text,
                        page_num=page_num,
                        chunk_index=global_chunk_idx,
                    )
                )
                global_chunk_idx += 1
            else:
                # Sliding window chunking
                start = 0
                while start < len(text):
                    end = min(start + c_size, len(text))

                    # Try to break at newline or space to avoid splitting words
                    if end < len(text):
                        boundary = text.rfind(" ", start + step, end)
                        if boundary != -1:
                            end = boundary

                    chunk_str = text[start:end].strip()
                    if chunk_str:
                        chunks.append(
                            DocumentChunk(
                                chunk_id=f"{document_id}_chunk_{global_chunk_idx}",
                                document_id=document_id,
                                text=chunk_str,
                                page_num=page_num,
                                chunk_index=global_chunk_idx,
                            )
                        )
                        global_chunk_idx += 1

                    if end >= len(text):
                        break
                    start = start + step

        return chunks

    async def process_document(
        self,
        document_id: str,
        file_bytes: bytes,
        content_type: str,
        filename: str,
    ) -> Tuple[List[DocumentChunk], int]:
        """
        Extract text, generate chunks, and return chunk list with page count.
        """
        pages_data = self.extract_text(file_bytes, content_type, filename)
        page_count = len(pages_data)
        chunks = self.chunk_text(pages_data, document_id=str(document_id))
        return chunks, page_count


document_processor = DocumentProcessor()
