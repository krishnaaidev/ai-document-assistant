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
