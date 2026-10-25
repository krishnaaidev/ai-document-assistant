import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.api.deps import get_current_user
from app.models.models import User
from app.schemas.schemas import (
    CollectionCreate,
    CollectionUpdate,
    CollectionResponse,
    CollectionDetailResponse,
    CollectionDocumentOperation,
    DocumentResponse,
    PaginatedResponse,
    PaginationMetadata,
)
from app.services.collection_service import CollectionService

router = APIRouter(prefix="/collections", tags=["Collections"])


@router.post("", response_model=CollectionResponse, status_code=status.HTTP_201_CREATED)
async def create_collection(
    data: CollectionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Create a new document collection."""
    collection = await CollectionService.create_collection(db, current_user.id, data)
    resp = CollectionResponse.model_validate(collection)
    resp.document_count = 0
    return resp


@router.get("", response_model=PaginatedResponse[CollectionResponse])
async def list_collections(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all collections owned by current user."""
    collections, total_count = await CollectionService.list_collections(
        db, current_user.id, page=page, page_size=page_size
    )

    items = []
    for c in collections:
        resp = CollectionResponse.model_validate(c)
        docs = c.__dict__.get("documents")
        resp.document_count = len(docs) if docs is not None else 0
        items.append(resp)

    total_pages = (total_count + page_size - 1) // page_size if page_size > 0 else 0

    return PaginatedResponse[CollectionResponse](
        items=items,
        pagination=PaginationMetadata(
            page=page,
            page_size=page_size,
            total_count=total_count,
            total_pages=total_pages,
        ),
    )


@router.get("/{collection_id}", response_model=CollectionDetailResponse)
async def get_collection(
    collection_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get collection details along with associated documents."""
    collection = await CollectionService.get_collection(
        db, collection_id, current_user.id, load_documents=True
    )
    if not collection:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Collection not found")

    docs = [DocumentResponse.model_validate(d) for d in (collection.documents or [])]
    resp = CollectionDetailResponse(
        id=collection.id,
        owner_id=collection.owner_id,
        name=collection.name,
        description=collection.description,
        created_at=collection.created_at,
        updated_at=collection.updated_at,
        document_count=len(docs),
        documents=docs,
    )
    return resp


@router.put("/{collection_id}", response_model=CollectionResponse)
async def update_collection(
    collection_id: uuid.UUID,
    data: CollectionUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update a collection name or description."""
    collection = await CollectionService.update_collection(db, collection_id, current_user.id, data)
    if not collection:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Collection not found")

    resp = CollectionResponse.model_validate(collection)
    docs = collection.__dict__.get("documents")
    resp.document_count = len(docs) if docs is not None else 0
    return resp


@router.delete("/{collection_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_collection(
    collection_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete a collection (documents are unlinked, not deleted)."""
    success = await CollectionService.delete_collection(db, collection_id, current_user.id)
    if not success:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Collection not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.post("/{collection_id}/documents", status_code=status.HTTP_200_OK)
async def add_documents_to_collection(
    collection_id: uuid.UUID,
    operation: CollectionDocumentOperation,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add existing documents to this collection."""
    updated_count = await CollectionService.add_documents(
        db, collection_id, current_user.id, operation.document_ids
    )
    return {"message": f"Added {updated_count} documents to collection", "updated_count": updated_count}


@router.delete("/{collection_id}/documents", status_code=status.HTTP_200_OK)
async def remove_documents_from_collection(
    collection_id: uuid.UUID,
    operation: CollectionDocumentOperation,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Remove documents from this collection."""
    removed_count = await CollectionService.remove_documents(
        db, collection_id, current_user.id, operation.document_ids
    )
    return {"message": f"Removed {removed_count} documents from collection", "removed_count": removed_count}
