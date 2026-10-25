import uuid
import logging
from typing import Optional, List, Tuple, Any
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.models import Summary, SummaryType

logger = logging.getLogger(__name__)


class SummaryService:
    @staticmethod
    async def create_summary(
        db: AsyncSession,
        owner_id: uuid.UUID,
        document_id: uuid.UUID,
        summary_type: SummaryType,
        content: str,
        citations_json: Optional[Any] = None
    ) -> Summary:
        summary = Summary(
            id=uuid.uuid4(),
            owner_id=owner_id,
            document_id=document_id,
            summary_type=summary_type,
            content=content,
            citations_json=citations_json,
        )
        db.add(summary)
        await db.commit()
        await db.refresh(summary)
        return summary

    @staticmethod
    async def get_summary_by_id(
        db: AsyncSession,
        summary_id: uuid.UUID,
        owner_id: uuid.UUID
    ) -> Optional[Summary]:
        stmt = select(Summary).where(
            Summary.id == summary_id,
            Summary.owner_id == owner_id
        )
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def get_by_document(
        db: AsyncSession,
        document_id: uuid.UUID,
        owner_id: uuid.UUID,
        summary_type: Optional[SummaryType] = None
    ) -> Optional[Summary]:
        stmt = select(Summary).where(
            Summary.document_id == document_id,
            Summary.owner_id == owner_id
        )
        if summary_type:
            stmt = stmt.where(Summary.summary_type == summary_type)
        stmt = stmt.order_by(Summary.created_at.desc()).limit(1)
        result = await db.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def list_summaries(
        db: AsyncSession,
        owner_id: uuid.UUID,
        document_id: Optional[uuid.UUID] = None,
        page: int = 1,
        page_size: int = 20
    ) -> Tuple[List[Summary], int]:
        count_stmt = select(func.count(Summary.id)).where(Summary.owner_id == owner_id)
        if document_id:
            count_stmt = count_stmt.where(Summary.document_id == document_id)
        total_count = (await db.execute(count_stmt)).scalar() or 0

        offset = (page - 1) * page_size
        stmt = select(Summary).where(Summary.owner_id == owner_id)
        if document_id:
            stmt = stmt.where(Summary.document_id == document_id)
        stmt = stmt.order_by(Summary.created_at.desc()).offset(offset).limit(page_size)

        result = await db.execute(stmt)
        return list(result.scalars().all()), total_count


async def create_summary_record(
    db: AsyncSession,
    owner_id: uuid.UUID,
    document_id: str,
    summary_type: str,
    content: str,
    citations_json: Optional[Any] = None,
) -> Summary:
    doc_uuid = uuid.UUID(document_id) if isinstance(document_id, str) else document_id
    st = SummaryType(summary_type) if isinstance(summary_type, str) else summary_type
    summary = Summary(
        id=uuid.uuid4(),
        owner_id=owner_id,
        document_id=doc_uuid,
        summary_type=st,
        content=content,
        citations_json=citations_json,
    )
    db.add(summary)
    await db.flush()
    return summary


async def get_summary_by_id(db: AsyncSession, summary_id: str) -> Optional[Summary]:
    sum_uuid = uuid.UUID(summary_id) if isinstance(summary_id, str) else summary_id
    result = await db.execute(select(Summary).where(Summary.id == sum_uuid))
    return result.scalar_one_or_none()


async def get_document_summaries(db: AsyncSession, document_id: str, owner_id: uuid.UUID) -> List[Summary]:
    doc_uuid = uuid.UUID(document_id) if isinstance(document_id, str) else document_id
    result = await db.execute(
        select(Summary).where(Summary.document_id == doc_uuid, Summary.owner_id == owner_id).order_by(Summary.created_at.desc())
    )
    return list(result.scalars().all())


async def delete_summary_record(db: AsyncSession, summary_id: str) -> None:
    sum_uuid = uuid.UUID(summary_id) if isinstance(summary_id, str) else summary_id
    summary = await get_summary_by_id(db, summary_id)
    if summary:
        await db.delete(summary)
        await db.flush()
