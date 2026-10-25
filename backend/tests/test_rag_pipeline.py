import uuid
import pytest
from app.rag.embeddings import embedding_service
from app.rag.pinecone_service import pinecone_service, SearchResult
from app.rag.llm_service import llm_service
from app.rag.pipeline import rag_pipeline
from app.rag.document_processor import DocumentChunk
from app.models.models import User, SummaryType


def test_embedding_dimensions():
    text = "Query about artificial intelligence."
    emb = embedding_service.embed_text(text)
    assert isinstance(emb, list)
    assert len(emb) == embedding_service.dimension
    assert len(emb) == 384


def test_pinecone_user_namespace_isolation():
    owner_1 = "user_alpha"
    owner_2 = "user_beta"

    chunk_1 = DocumentChunk("c1", "doc1", "Alpha private financial figures", 1, 0)
    chunk_2 = DocumentChunk("c2", "doc2", "Beta confidential roadmap", 1, 0)

    pinecone_service.upsert_chunks([chunk_1], owner_uid=owner_1, document_id="doc1", filename="alpha.txt")
    pinecone_service.upsert_chunks([chunk_2], owner_uid=owner_2, document_id="doc2", filename="beta.txt")

    # Search as owner_1
    emb = embedding_service.embed_text("financial roadmap")
    results_alpha = pinecone_service.search_similar(emb, owner_uid=owner_1, top_k=5)
    doc_ids_alpha = [r.document_id for r in results_alpha]

    assert "doc1" in doc_ids_alpha
    assert "doc2" not in doc_ids_alpha  # User 2 data MUST NOT leak to User 1


def test_pinecone_scope_filtering():
    owner = "user_scoped"
    doc_a = "doc_alpha"
    doc_b = "doc_beta"

    c_a = DocumentChunk("ca", doc_a, "Contract provisions for Alpha", 1, 0)
    c_b = DocumentChunk("cb", doc_b, "Contract provisions for Beta", 1, 0)

    pinecone_service.upsert_chunks([c_a], owner_uid=owner, document_id=doc_a, filename="a.txt", collection_id="col_1")
    pinecone_service.upsert_chunks([c_b], owner_uid=owner, document_id=doc_b, filename="b.txt", collection_id="col_2")

    emb = embedding_service.embed_text("Contract provisions")

    # Filter by specific document
    doc_filter_results = pinecone_service.search_similar(emb, owner_uid=owner, document_id=doc_a)
    assert all(r.document_id == doc_a for r in doc_filter_results)

    # Filter by specific collection
    col_filter_results = pinecone_service.search_similar(emb, owner_uid=owner, collection_id="col_2")
    assert all(r.document_id == doc_b for r in col_filter_results)


def test_llm_no_evidence_response():
    result = llm_service.generate_answer(
        question="What were the Q3 profits?",
        context_chunks=[],  # No chunks retrieved
    )
    assert "could not find relevant information" in result.answer.lower()
    assert len(result.citations) == 0


def test_llm_citation_validation():
    chunk = SearchResult(
        chunk_id="chunk_1",
        document_id="doc_xyz",
        filename="report.pdf",
        text="The gross revenue for 2024 was $5.2 million.",
        score=0.92,
        page_num=3,
        chunk_index=0,
    )
    result = llm_service.generate_answer(
        question="What was the gross revenue for 2024?",
        context_chunks=[chunk],
    )
    assert len(result.citations) > 0
    assert result.citations[0].document_id == "doc_xyz"
    assert result.citations[0].filename == "report.pdf"
    assert result.citations[0].page_num == 3


@pytest.mark.asyncio
async def test_full_pipeline_ask_flow(db_session, test_user: User):
    # Upsert a chunk for test_user
    chunk = DocumentChunk("c_pipe", "doc_pipe", "Vector search uses high-dimensional embeddings.", 1, 0)
    pinecone_service.upsert_chunks([chunk], owner_uid=test_user.firebase_uid, document_id="doc_pipe", filename="guide.txt")

    response = await rag_pipeline.ask(
        db=db_session,
        user=test_user,
        question="How does vector search work?",
    )
    assert response.conversation_id is not None
    assert response.message_id is not None
    assert response.answer is not None
    assert len(response.citations) > 0
