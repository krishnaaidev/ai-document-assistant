import logging
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.routing import APIRouter
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.database import get_db
from app.models.models import Document, ProcessingStatus, User
from app.rag.llm_service import get_llm_service
from app.schemas.schemas import SummaryCreate, SummarySchema
from app.services.document_service import get_document_by_id
from app.services.summary_service import (
    create_summary_record,
    delete_summary_record,
    get_document_summaries,
    get_summary_by_id,
)
from app.storage.firebase_storage import get_file_bytes

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/documents/{document_id}/summarize", response_model=SummarySchema)
async def generate_summary(
    document_id: str,
    request: SummaryCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Generate a new summary for a document."""
    doc = await get_document_by_id(db, document_id)
    if not doc or doc.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    if doc.processing_status != ProcessingStatus.COMPLETED:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Document must be fully processed before summarization.",
        )

    # Download document text
    try:
        file_bytes = await get_file_bytes(doc.storage_path)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Could not retrieve document from storage: {e}",
        )

    # Re-extract text for summarization
    from app.rag.document_processor import DocumentProcessor
    processor = DocumentProcessor()
    try:
        extraction = await processor.process(
            file_bytes=file_bytes,
            content_type=doc.content_type,
            filename=doc.filename,
            document_id=str(doc.id),
        )
        text = extraction.text
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Text extraction failed: {e}",
        )

    # Generate summary via LLM
    try:
        llm = get_llm_service()
        summary_content = llm.generate_summary(
            text=text,
            summary_type=request.summary_type,
            filename=doc.filename,
        )
    except Exception as e:
        logger.error(f"Summarization failed for document {document_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Summarization failed. Please try again later.",
        )

    # Save to database
    summary = await create_summary_record(
        db=db,
        owner_id=current_user.id,
        document_id=document_id,
        summary_type=request.summary_type,
        content=summary_content,
    )

    return summary


@router.get("/documents/{document_id}/summaries", response_model=list[SummarySchema])
async def list_document_summaries(
    document_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List all summaries for a document."""
    doc = await get_document_by_id(db, document_id)
    if not doc or doc.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")

    summaries = await get_document_summaries(db, document_id, current_user.id)
    return summaries


@router.delete("/summaries/{summary_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_summary(
    summary_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a summary."""
    summary = await get_summary_by_id(db, summary_id)
    if not summary or summary.owner_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Summary not found.")

    await delete_summary_record(db, summary_id)
