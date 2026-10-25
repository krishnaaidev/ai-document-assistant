import asyncio
import logging
from datetime import datetime, timezone
from typing import Optional

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


async def process_document_background(
    document_id: str,
    file_bytes: bytes,
    content_type: str,
    filename: str,
    owner_uid: str,
    collection_id: Optional[str] = None,
) -> None:
    """
    Background task for document processing:
    1. Update status to 'processing'
    2. Extract text (PDF/DOCX/TXT)
    3. Chunk text with page metadata
    4. Generate embeddings (batch)
    5. Upsert to Pinecone with user namespace
    6. Update document record with results
    7. Handle errors with status updates and cleanup

    This task runs after the upload response is returned to the user.
    """
    from app.db.database import AsyncSessionLocal
    from app.models.models import Document, ProcessingJob, ProcessingStatus
    from app.rag.document_processor import DocumentProcessor
    from app.rag.embeddings import get_embedding_service
    from app.rag.pinecone_service import get_pinecone_service
    from sqlalchemy import select

    start_time = datetime.now(timezone.utc)
    job_id = None

    async with AsyncSessionLocal() as db:
        try:
            # Create processing job record
            job = ProcessingJob(
                document_id=document_id,
                owner_id=(await db.execute(
                    select(Document.owner_id).where(Document.id == document_id)
                )).scalar_one(),
                status="running",
                started_at=start_time,
            )
            db.add(job)
            await db.flush()
            job_id = str(job.id)

            # Update document status to 'processing'
            result = await db.execute(select(Document).where(Document.id == document_id))
            document = result.scalar_one_or_none()
            if not document:
                logger.error(f"Document {document_id} not found during background processing.")
                return

            document.processing_status = ProcessingStatus.PROCESSING
            document.processing_error = None
            await db.flush()

            logger.info(f"Processing document {document_id} ({filename}) for user {owner_uid}")

            # ── Text Extraction & Chunking ─────────────────────────────────
            processor = DocumentProcessor()
            extraction_result = await processor.process(
                file_bytes=file_bytes,
                content_type=content_type,
                filename=filename,
                document_id=document_id,
            )

            logger.info(
                f"Extracted {len(extraction_result.text)} chars, "
                f"{extraction_result.page_count} pages, "
                f"{len(extraction_result.chunks)} chunks from {filename}"
            )

            # ── Embedding & Pinecone Upsert ────────────────────────────────
            pinecone = get_pinecone_service()
            upserted_count = pinecone.upsert_chunks(
                chunks=extraction_result.chunks,
                owner_uid=owner_uid,
                document_id=document_id,
                filename=filename,
                collection_id=collection_id,
            )

            # ── Update document record as completed ────────────────────────
            document.processing_status = ProcessingStatus.COMPLETED
            document.processing_error = None
            document.file_hash = extraction_result.file_hash
            document.page_count = extraction_result.page_count
            document.chunk_count = upserted_count

            if extraction_result.warnings:
                # Store warnings in the error field with a prefix so UI can distinguish
                document.processing_error = "WARNINGS: " + "; ".join(extraction_result.warnings)

            job.status = "completed"
            job.completed_at = datetime.now(timezone.utc)
            await db.commit()

            logger.info(
                f"Document {document_id} processed successfully. "
                f"{upserted_count} vectors upserted to Pinecone."
            )

        except Exception as e:
            logger.error(f"Document {document_id} processing failed: {e}", exc_info=True)

            try:
                async with AsyncSessionLocal() as error_db:
                    error_result = await error_db.execute(select(Document).where(Document.id == document_id))
                    error_doc = error_result.scalar_one_or_none()
                    if error_doc:
                        error_doc.processing_status = ProcessingStatus.FAILED
                        error_doc.processing_error = str(e)[:1000]
                    await error_db.commit()
            except Exception as inner_e:
                logger.error(f"Failed to update document status after processing error: {inner_e}")
