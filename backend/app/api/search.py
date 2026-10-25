import uuid
import logging
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from app.db.database import get_db
from app.api.deps import get_current_user
from app.models.models import User, Document
from app.schemas.schemas import (
    SearchRequest,
    SearchResponse,
    SearchResultItem,
    DocumentResponse,
)
from app.rag.embeddings import embedding_service
from app.rag.pinecone_service import pinecone_service, SearchResult

router = APIRouter(prefix="/search", tags=["Search"])
logger = logging.getLogger(__name__)


@router.post("", response_model=SearchResponse)
async def semantic_search(
    request: SearchRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Perform semantic vector search against user documents using Pinecone.
    Results are strictly scoped to the authenticated user's namespace.
    """
    if not request.query.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Query cannot be empty")

    query_embedding = embedding_service.embed_text(request.query)

    doc_id_str = str(request.document_id) if request.document_id else None
    col_id_str = str(request.collection_id) if request.collection_id else None

    raw_results = pinecone_service.search_similar(
        query_embedding=query_embedding,
        owner_uid=current_user.firebase_uid,
        top_k=request.top_k,
        document_id=doc_id_str,
        collection_id=col_id_str,
    )

    items = [
        SearchResultItem(
            chunk_id=r.chunk_id,
            document_id=r.document_id,
            filename=r.filename,
            text=r.text,
            score=r.score,
            page_num=r.page_num,
            chunk_index=r.chunk_index,
        )
        for r in raw_results
    ]

    return SearchResponse(
        query=request.query,
        results=items,
        total_results=len(items),
    )


@router.get("/keyword", response_model=List[DocumentResponse])
async def keyword_search_documents(
    q: str = Query(..., min_length=1),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Perform keyword match on document filenames and metadata."""
    pattern = f"%{q.strip()}%"
    stmt = (
        select(Document)
        .where(
            Document.owner_id == current_user.id,
            Document.filename.ilike(pattern)
        )
        .order_by(Document.created_at.desc())
        .limit(20)
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())
