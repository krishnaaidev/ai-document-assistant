import uuid
import logging
from datetime import datetime, timezone
from typing import Optional, List, Tuple
from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.models import Document, ProcessingJob, ProcessingStatus

logger = logging.getLogger(__name__)


class DocumentService:
    @staticmethod
    async def create_document(
        db: AsyncSession,
        owner_id: uuid.UUID,
        filename: str,
        content_type: str,
        file_size: int,
        file_hash: str,
        storage_path: str,
        collection_id: Optional[uuid.UUID] = None,
    ) -> Document:
        document = Document(
            id=uuid.uuid4(),
            owner_id=owner_id,
            collection_id=collection_id,
            filename=filename,
            content_type=content_type,
            file_size=file_size,
            file_hash=file_hash,
            storage_path=storage_path,
            processing_status=ProcessingStatus.UPLOADED,
        )
        db.add(document)
        await db.commit()
        await db.refresh(document)
        return document

    @staticmethod
    async def get_document(
        db: AsyncSession,
        document_id: uuid.UUID,
        owner_id: uuid.UUID
    ) -> Optional[Document]:
        stmt = select(Document).where(Document.id == document_id, Document.owner_id == owner_id)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def list_documents(
        db: AsyncSession,
        owner_id: uuid.UUID,
        collection_id: Optional[uuid.UUID] = None,
        processing_status: Optional[ProcessingStatus] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 20,
        sort_by: str = "created_at",
        sort_desc: bool = True,
    ) -> Tuple[List[Document], int]:
        filters = [Document.owner_id == owner_id]

        if collection_id is not None:
            filters.append(Document.collection_id == collection_id)
        if processing_status is not None:
            filters.append(Document.processing_status == processing_status)
        if search:
            search_pattern = f"%{search}%"
            filters.append(Document.filename.ilike(search_pattern))

        # Total count query
        count_stmt = select(func.count(Document.id)).where(*filters)
        total_count = (await db.execute(count_stmt)).scalar() or 0

        # Sort order
        sort_column = getattr(Document, sort_by, Document.created_at)
        order_clause = sort_column.desc() if sort_desc else sort_column.asc()

        offset = (page - 1) * page_size
        stmt = (
            select(Document)
            .where(*filters)
            .order_by(order_clause)
            .offset(offset)
            .limit(page_size)
        )
        result = await db.execute(stmt)
        documents = list(result.scalars().all())
        return documents, total_count

    @staticmethod
    async def update_status(
        db: AsyncSession,
        document_id: uuid.UUID,
        status: ProcessingStatus,
        error: Optional[str] = None,
        page_count: Optional[int] = None,
        chunk_count: Optional[int] = None,
    ) -> Optional[Document]:
        stmt = select(Document).where(Document.id == document_id)
        result = await db.execute(stmt)
        doc = result.scalar_one_or_none()
        if not doc:
            return None

        doc.processing_status = status
        if error is not None:
            doc.processing_error = error
        if page_count is not None:
            doc.page_count = page_count
        if chunk_count is not None:
            doc.chunk_count = chunk_count

        await db.commit()
        await db.refresh(doc)
        return doc

    @staticmethod
    async def delete_document(
        db: AsyncSession,
        document_id: uuid.UUID,
        owner_id: uuid.UUID
    ) -> bool:
        doc = await DocumentService.get_document(db, document_id, owner_id)
        if not doc:
            return False

        await db.delete(doc)
        await db.commit()
        return True

    @staticmethod
    async def create_processing_job(
        db: AsyncSession,
        document_id: uuid.UUID,
        owner_id: uuid.UUID
    ) -> ProcessingJob:
        job = ProcessingJob(
            id=uuid.uuid4(),
            document_id=document_id,
            owner_id=owner_id,
            status=ProcessingStatus.UPLOADED,
            started_at=datetime.now(timezone.utc),
        )
        db.add(job)
        await db.commit()
        await db.refresh(job)
        return job

    @staticmethod
    async def update_processing_job(
        db: AsyncSession,
        job_id: uuid.UUID,
        status: ProcessingStatus,
        error_message: Optional[str] = None,
        started_at: Optional[datetime] = None,
        completed_at: Optional[datetime] = None,
    ) -> Optional[ProcessingJob]:
        stmt = select(ProcessingJob).where(ProcessingJob.id == job_id)
        result = await db.execute(stmt)
        job = result.scalar_one_or_none()
        if not job:
            return None

        job.status = status
        if error_message is not None:
            job.error_message = error_message
        if started_at is not None:
            job.started_at = started_at
        if completed_at is not None:
            job.completed_at = completed_at

        await db.commit()
        await db.refresh(job)
        return job


async def create_document_record(
    db: AsyncSession,
    document_id: str,
    owner_id: uuid.UUID,
    filename: str,
    content_type: str,
    file_size: int,
    storage_path: str,
    collection_id: Optional[str] = None,
) -> Document:
    doc_uuid = uuid.UUID(document_id) if isinstance(document_id, str) else document_id
    coll_uuid = uuid.UUID(collection_id) if collection_id else None
    doc = Document(
        id=doc_uuid,
        owner_id=owner_id,
        filename=filename,
        content_type=content_type,
        file_size=file_size,
        file_hash="",
        storage_path=storage_path,
        collection_id=coll_uuid,
        processing_status=ProcessingStatus.UPLOADED,
    )
    db.add(doc)
    await db.flush()
    return doc


async def get_document_by_id(db: AsyncSession, document_id: str) -> Optional[Document]:
    doc_uuid = uuid.UUID(document_id) if isinstance(document_id, str) else document_id
    result = await db.execute(select(Document).where(Document.id == doc_uuid))
    return result.scalar_one_or_none()


async def delete_document_record(db: AsyncSession, document_id: str) -> None:
    doc_uuid = uuid.UUID(document_id) if isinstance(document_id, str) else document_id
    doc = await get_document_by_id(db, document_id)
    if doc:
        await db.delete(doc)
        await db.flush()


async def update_document_status(
    db: AsyncSession,
    document_id: str,
    status: ProcessingStatus,
    clear_error: bool = False,
) -> Optional[Document]:
    doc = await get_document_by_id(db, document_id)
    if doc:
        doc.processing_status = status
        if clear_error:
            doc.processing_error = None
        await db.flush()
    return doc


async def list_user_documents(
    db: AsyncSession,
    owner_id: uuid.UUID,
    page: int = 1,
    page_size: int = 20,
    search: Optional[str] = None,
    sort_by: str = "created_at",
    sort_order: str = "desc",
    content_type: Optional[str] = None,
    collection_id: Optional[str] = None,
    status_filter: Optional[str] = None,
) -> dict:
    from app.schemas.schemas import PaginationMetadata, PaginatedResponse, DocumentDetailResponse
    coll_uuid = uuid.UUID(collection_id) if collection_id else None
    proc_status = ProcessingStatus(status_filter) if status_filter else None
    sort_desc = sort_order.lower() == "desc"

    items, total_count = await DocumentService.list_documents(
        db=db,
        owner_id=owner_id,
        collection_id=coll_uuid,
        processing_status=proc_status,
        search=search,
        page=page,
        page_size=page_size,
        sort_by=sort_by,
        sort_desc=sort_desc,
    )
    total_pages = (total_count + page_size - 1) // page_size if total_count > 0 else 0
    return {
        "items": items,
        "pagination": {
            "page": page,
            "page_size": page_size,
            "total_count": total_count,
            "total_pages": total_pages,
        },
    }
