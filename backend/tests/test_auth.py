import pytest
from fastapi import HTTPException
from app.core.security import verify_firebase_token
from app.models.models import User, Document, Collection
from app.services.document_service import DocumentService
from app.services.collection_service import CollectionService
from app.schemas.schemas import CollectionCreate


def test_verify_valid_test_token():
    token = "test-token-user_12345"
    claims = verify_firebase_token(token)
    assert claims["uid"] == "user_12345"
    assert "email" in claims


def test_verify_bearer_prefix_parsing():
    token = "Bearer test-token-user_abc"
    claims = verify_firebase_token(token)
    assert claims["uid"] == "user_abc"


def test_verify_empty_token_raises_401():
    with pytest.raises(HTTPException) as exc_info:
        verify_firebase_token("")
    assert exc_info.value.status_code == 401


@pytest.mark.asyncio
async def test_cross_user_document_isolation(db_session, test_user: User, other_user: User):
    # Create document owned by test_user
    doc = await DocumentService.create_document(
        db=db_session,
        owner_id=test_user.id,
        filename="confidential_test_user.pdf",
        content_type="application/pdf",
        file_size=1024,
        file_hash="hash123",
        storage_path="path/to/doc.pdf",
    )

    # other_user must NOT be able to access test_user's document
    doc_access_by_other = await DocumentService.get_document(db_session, doc.id, other_user.id)
    assert doc_access_by_other is None

    # test_user can access their own document
    doc_access_by_owner = await DocumentService.get_document(db_session, doc.id, test_user.id)
    assert doc_access_by_owner is not None
    assert doc_access_by_owner.id == doc.id


@pytest.mark.asyncio
async def test_cross_user_collection_isolation(db_session, test_user: User, other_user: User):
    col = await CollectionService.create_collection(
        db=db_session,
        owner_id=test_user.id,
        data=CollectionCreate(name="Private Research", description="Restricted collection")
    )

    # other_user cannot retrieve collection
    col_by_other = await CollectionService.get_collection(db_session, col.id, other_user.id)
    assert col_by_other is None

    # test_user can retrieve it
    col_by_owner = await CollectionService.get_collection(db_session, col.id, test_user.id)
    assert col_by_owner is not None
    assert col_by_owner.name == "Private Research"
