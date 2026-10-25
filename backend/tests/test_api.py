import io
import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check_endpoint(client: AsyncClient):
    response = await client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "environment" in data


@pytest.mark.asyncio
async def test_readiness_probe_endpoint(client: AsyncClient):
    response = await client.get("/api/ready")
    assert response.status_code in (200, 503)
    data = response.json()
    assert "ready" in data
    assert "database" in data


@pytest.mark.asyncio
async def test_auth_me_endpoint(client: AsyncClient):
    response = await client.get("/api/auth/me")
    assert response.status_code == 200
    data = response.json()
    assert "email" in data
    assert "firebase_uid" in data


@pytest.mark.asyncio
async def test_collections_crud(client: AsyncClient):
    # Create collection
    create_payload = {"name": "Test Science Collection", "description": "Physics and Chemistry"}
    create_resp = await client.post("/api/collections", json=create_payload)
    assert create_resp.status_code == 201
    created_col = create_resp.json()
    col_id = created_col["id"]
    assert created_col["name"] == "Test Science Collection"

    # List collections
    list_resp = await client.get("/api/collections")
    assert list_resp.status_code == 200
    list_data = list_resp.json()
    assert len(list_data["items"]) >= 1

    # Get single collection
    get_resp = await client.get(f"/api/collections/{col_id}")
    assert get_resp.status_code == 200
    assert get_resp.json()["id"] == col_id

    # Update collection
    update_resp = await client.put(f"/api/collections/{col_id}", json={"name": "Updated Collection Name"})
    assert update_resp.status_code == 200
    assert update_resp.json()["name"] == "Updated Collection Name"

    # Delete collection
    del_resp = await client.delete(f"/api/collections/{col_id}")
    assert del_resp.status_code == 204


@pytest.mark.asyncio
async def test_document_upload_and_listing(client: AsyncClient):
    # Upload sample text file
    file_content = b"FastAPI and PostgreSQL form the robust core of this architecture."
    files = {"file": ("architecture.txt", io.BytesIO(file_content), "text/plain")}

    upload_resp = await client.post("/api/documents/upload", files=files)
    assert upload_resp.status_code == 201
    doc_data = upload_resp.json()
    doc_id = doc_data["id"]
    assert doc_data["filename"] == "architecture.txt"

    # List documents
    list_resp = await client.get("/api/documents")
    assert list_resp.status_code == 200
    docs = list_resp.json()
    assert any(d["id"] == doc_id for d in docs["items"])

    # Get document detail
    detail_resp = await client.get(f"/api/documents/{doc_id}")
    assert detail_resp.status_code == 200
    assert detail_resp.json()["id"] == doc_id

    # Get document content
    content_resp = await client.get(f"/api/documents/{doc_id}/content")
    assert content_resp.status_code == 200
    assert "FastAPI" in content_resp.json()["content"]

    # Delete document
    del_resp = await client.delete(f"/api/documents/{doc_id}")
    assert del_resp.status_code == 204


@pytest.mark.asyncio
async def test_conversations_and_chat(client: AsyncClient):
    # Create conversation
    conv_resp = await client.post("/api/conversations", json={"title": "Q&A Session", "retrieval_scope": "all"})
    assert conv_resp.status_code == 201
    conv = conv_resp.json()
    conv_id = conv["id"]

    # Post query to chat endpoint
    chat_resp = await client.post(
        "/api/chat",
        json={
            "question": "What is the primary role of the FastAPI framework?",
            "conversation_id": conv_id,
            "retrieval_scope": "all",
        },
    )
    assert chat_resp.status_code == 200
    chat_data = chat_resp.json()
    assert "answer" in chat_data
    assert "citations" in chat_data
    assert chat_data["conversation_id"] == conv_id

    # Check conversation messages
    msgs_resp = await client.get(f"/api/conversations/{conv_id}/messages")
    assert msgs_resp.status_code == 200
    msgs = msgs_resp.json()
    assert len(msgs) == 2  # user and assistant messages


@pytest.mark.asyncio
async def test_search_endpoints(client: AsyncClient):
    # Semantic search
    search_resp = await client.post(
        "/api/search",
        json={"query": "database connection pooling", "retrieval_scope": "all", "top_k": 3},
    )
    assert search_resp.status_code == 200
    res = search_resp.json()
    assert res["query"] == "database connection pooling"
    assert "results" in res

    # Keyword search
    kw_resp = await client.get("/api/search/keyword?q=FastAPI")
    assert kw_resp.status_code == 200
    assert isinstance(kw_resp.json(), list)
