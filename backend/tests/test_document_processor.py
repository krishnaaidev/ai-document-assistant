import io
import pytest
from app.rag.document_processor import document_processor, DocumentChunk


def create_in_memory_pdf(pages_text: list[str]) -> bytes:
    """Helper to synthesize a valid multi-page PDF in memory."""
    from pypdf import PdfWriter
    from pypdf.generic import DictionaryObject, NameObject, ArrayObject, DecodedStreamObject

    writer = PdfWriter()
    for text in pages_text:
        # Create a simple page
        page = writer.add_blank_page(width=612, height=792)
    # Write to buffer
    buf = io.BytesIO()
    writer.write(buf)
    return buf.getvalue()


def create_in_memory_docx(paragraphs: list[str]) -> bytes:
    """Helper to synthesize a valid DOCX file in memory."""
    import docx

    doc = docx.Document()
    for p in paragraphs:
        doc.add_paragraph(p)
    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()


def test_extract_text_from_txt():
    content = "Hello, this is a plain text file for testing."
    data = content.encode("utf-8")
    pages = document_processor.extract_text_from_txt(data)
    assert len(pages) >= 1
    assert pages[0][0] == 1
    assert "plain text file" in pages[0][1]


def test_extract_empty_txt_raises_error():
    with pytest.raises(ValueError, match="empty"):
        document_processor.extract_text_from_txt(b"   ")


def test_extract_text_from_docx():
    paragraphs = ["First section overview.", "Second paragraph with detailed facts."]
    docx_bytes = create_in_memory_docx(paragraphs)
    pages = document_processor.extract_text_from_docx(docx_bytes)
    assert len(pages) >= 1
    assert "First section overview." in pages[0][1]
    assert "Second paragraph with detailed facts." in pages[0][1]


def test_chunking_short_text():
    pages_data = [(1, "Short document text.")]
    chunks = document_processor.chunk_text(pages_data, document_id="doc_123", chunk_size=500, chunk_overlap=50)
    assert len(chunks) == 1
    assert chunks[0].chunk_id == "doc_123_chunk_0"
    assert chunks[0].text == "Short document text."
    assert chunks[0].page_num == 1
    assert chunks[0].chunk_index == 0


def test_chunking_overlapping_windows():
    # Long text with repeated sentences
    sentence = "This is an important piece of document context. "
    long_text = sentence * 30  # ~1440 characters
    pages_data = [(1, long_text)]

    chunks = document_processor.chunk_text(pages_data, document_id="doc_long", chunk_size=400, chunk_overlap=100)
    assert len(chunks) > 1

    # Verify indices and page preservation
    for i, c in enumerate(chunks):
        assert c.chunk_index == i
        assert c.page_num == 1
        assert len(c.text) <= 450  # account for word boundary adjustment


def test_metadata_preservation_across_pages():
    pages_data = [
        (1, "Page 1 intro content."),
        (2, "Page 2 methodology content."),
        (3, "Page 3 conclusions and analysis."),
    ]
    chunks = document_processor.chunk_text(pages_data, document_id="multi_page_doc", chunk_size=500)
    assert len(chunks) == 3
    assert chunks[0].page_num == 1
    assert chunks[1].page_num == 2
    assert chunks[2].page_num == 3
    assert "Page 1 intro" in chunks[0].text
    assert "Page 2 methodology" in chunks[1].text
    assert "Page 3 conclusions" in chunks[2].text


@pytest.mark.asyncio
async def test_process_document_end_to_end():
    text = "RAG systems combine vector retrieval with generative models."
    chunks, page_count = await document_processor.process_document(
        document_id="test_doc_id",
        file_bytes=text.encode("utf-8"),
        content_type="text/plain",
        filename="rag_guide.txt",
    )
    assert page_count == 1
    assert len(chunks) >= 1
    assert chunks[0].document_id == "test_doc_id"
