import logging
from datetime import datetime, timezone
from typing import Optional

from fastapi import BackgroundTasks, Depends, File, Form, HTTPException, UploadFile, status
from fastapi.routing import APIRouter
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.config import get_settings
from app.db.database import get_db
from app.models.models import Document, ProcessingStatus, User
from app.rag.background_tasks import process_document_background
from app.schemas.schemas import (
    DocumentDetail,
    DocumentList,
    PaginatedResponse,
)
from app.services.document_service import (
    create_document_record,
    delete_document_record,
    get_document_by_id,
    list_user_documents,
    update_document_status,
)
from app.storage.firebase_storage import delete_file, upload_file

logger = logging.getLogger(__name__)
settings = get_settings()
router = APIRouter(prefix="/documents", tags=["documents"])

ALLOWED_CONTENT_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
}


def _check_ownership(document: Optional[Document], user: User) -> Document:
    """Raise 404 if not found or 403 if not owned by user."""
    if document is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Document not found.")
    if document.owner_id != user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
    return document


@router.post("/upload", response_model=DocumentDetail, status_code=status.HTTP_201_CREATED)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    collection_id: Optional[str] = Form(default=None),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Upload a document and trigger background processing."""
    # ── Validate content type ──────────────────────────────────────────────
    content_type = file.content_type or ""
    if content_type not in ALLOWED_CONTENT_TYPES:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Unsupported file type '{content_type}'. Allowed: PDF, DOCX, TXT.",
        )

    # ── Read and validate file size ────────────────────────────────────────
    file_bytes = await file.read()
    file_size = len(file_bytes)
    max_bytes = settings.max_upload_size_bytes

    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="The uploaded file is empty.",
        )

    if file_size > max_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds the {settings.MAX_UPLOAD_SIZE_MB} MB limit.",
        )

    # ── Sanitize filename ──────────────────────────────────────────────────
    import re
    safe_filename = re.sub(r"[^\w\-. ]", "_", file.filename or "document")
    safe_filename = safe_filename[:255]

    # ── Upload to Firebase Storage ─────────────────────────────────────────
    import uuid
    doc_id = str(uuid.uuid4())
    storage_path = f"users/{current_user.firebase_uid}/documents/{doc_id}/{safe_filename}"

    try:
        await upload_file(file_bytes, storage_path, content_type)
    except Exception as e:
        logger.error(f"Firebase Storage upload failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to upload document to storage. Please try again.",
        )

    # ── Create database record ─────────────────────────────────────────────
    document = await create_document_record(
        db=db,
        document_id=doc_id,
        owner_id=current_user.id,
        filename=safe_filename,
        content_type=content_type,
        file_size=file_size,
        storage_path=storage_path,
        collection_id=collection_id,
    )

    # ── Trigger background processing ──────────────────────────────────────
    background_tasks.add_task(
        process_document_background,
        document_id=doc_id,
        file_bytes=file_bytes,
        content_type=content_type,
        filename=safe_filename,
        owner_uid=current_user.firebase_uid,
        collection_id=collection_id,
    )

    logger.info(f"Document {doc_id} uploaded by user {current_user.firebase_uid}. Processing queued.")
    return document


@router.get("", response_model=PaginatedResponse[DocumentDetail])
async def list_documents(
    page: int = 1,
    page_size: int = 20,
    search: Optional[str] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    content_type: Optional[str] = None,
    collection_id: Optional[str] = None,
    status_filter: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List the current user's documents with pagination and filtering."""
    result = await list_user_documents(
        db=db,
        owner_id=current_user.id,
        page=page,
        page_size=min(page_size, 100),
        search=search,
        sort_by=sort_by,
        sort_order=sort_order,
        content_type=content_type,
        collection_id=collection_id,
        status_filter=status_filter,
    )
    return result


@router.get("/{document_id}", response_model=DocumentDetail)
async def get_document(
    document_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get a single document by ID (ownership enforced)."""
    doc = await get_document_by_id(db, document_id)
    return _check_ownership(doc, current_user)


@router.delete("/{document_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_document(
    document_id: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Safe document deletion:
    1. Verify ownership
    2. Mark as deleting
    3. Remove Pinecone vectors
    4. Remove Firebase Storage object
    5. Remove DB records
    """
    doc = await get_document_by_id(db, document_id)
    _check_ownership(doc, current_user)

    if doc.processing_status == ProcessingStatus.DELETING:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Document is already being deleted.")

    # Mark as deleting immediately
    await update_document_status(db, document_id, ProcessingStatus.DELETING)

    # Perform cleanup in background
    background_tasks.add_task(
        _complete_document_deletion,
        document_id=document_id,
        storage_path=doc.storage_path,
        owner_uid=current_user.firebase_uid,
    )


async def _complete_document_deletion(document_id: str, storage_path: str, owner_uid: str):
    """Background task to clean up Pinecone vectors and Firebase Storage after deletion."""
    from app.db.database import AsyncSessionLocal
    from app.rag.pinecone_service import get_pinecone_service

    try:
        # Delete Pinecone vectors first
        try:
            pinecone = get_pinecone_service()
            pinecone.delete_document_vectors(document_id, owner_uid)
        except Exception as e:
            logger.error(f"Failed to delete Pinecone vectors for {document_id}: {e}")

        # Delete Firebase Storage file
        try:
            await delete_file(storage_path)
        except Exception as e:
            logger.error(f"Failed to delete Firebase Storage file {storage_path}: {e}")

        # Delete database records
        async with AsyncSessionLocal() as db:
            await delete_document_record(db, document_id)
            await db.commit()

        logger.info(f"Document {document_id} fully deleted.")

    except Exception as e:
        logger.error(f"Document deletion failed for {document_id}: {e}")


@router.post("/{document_id}/retry", response_model=DocumentDetail)
async def retry_document_processing(
    document_id: str,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Retry processing for a failed document."""
    doc = await get_document_by_id(db, document_id)
    _check_ownership(doc, current_user)

    if doc.processing_status not in (ProcessingStatus.FAILED,):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Can only retry documents with 'failed' status. Current status: {doc.processing_status}",
        )

    # Re-download from Firebase Storage for reprocessing
    from app.storage.firebase_storage import get_file_bytes

    try:
        file_bytes = await get_file_bytes(doc.storage_path)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Could not retrieve document from storage: {e}",
        )

    await update_document_status(db, document_id, ProcessingStatus.UPLOADED, clear_error=True)

    background_tasks.add_task(
        process_document_background,
        document_id=document_id,
        file_bytes=file_bytes,
        content_type=doc.content_type,
        filename=doc.filename,
        owner_uid=current_user.firebase_uid,
        collection_id=str(doc.collection_id) if doc.collection_id else None,
    )

    return doc


@router.get("/{document_id}/content")
async def get_document_content(
    document_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    doc = await get_document_by_id(db, document_id)
    _check_ownership(doc, current_user)

    content_text = ""
    try:
        from app.storage.firebase_storage import get_file_bytes
        file_bytes = await get_file_bytes(doc.storage_path)
        if doc.content_type == "text/plain":
            content_text = file_bytes.decode("utf-8", errors="replace")
        elif doc.content_type == "application/pdf":
            from app.rag.document_processor import DocumentProcessor
            processor = DocumentProcessor()
            pages = processor.extract_text_from_pdf(file_bytes)
            content_text = "\n\n".join(p[1] for p in pages)
        else:
            content_text = file_bytes.decode("utf-8", errors="replace")
    except Exception as e:
        logger.warning(f"Could not load document text for {doc.id}: {e}")

    from app.storage.firebase_storage import get_signed_url

    try:
        signed_url = await get_signed_url(doc.storage_path, expiration_minutes=60)
    except Exception as e:
        logger.error(f"Failed to generate signed URL for {doc.storage_path}: {e}")
        signed_url = None

    return {
        "id": str(document_id),
        "document_id": str(document_id),
        "filename": doc.filename,
        "signed_url": signed_url,
        "content_type": doc.content_type,
        "content": content_text,
        "page_count": doc.page_count or 1,
        "chunk_count": doc.chunk_count or 1,
    }
