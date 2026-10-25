import uuid
import logging
from typing import Optional, List, Tuple
from sqlalchemy import select, func, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.models.models import Collection, Document
from app.schemas.schemas import CollectionCreate, CollectionUpdate

logger = logging.getLogger(__name__)


class CollectionService:
    @staticmethod
    async def create_collection(
        db: AsyncSession,
        owner_id: uuid.UUID,
        data: CollectionCreate
    ) -> Collection:
        collection = Collection(
            id=uuid.uuid4(),
            owner_id=owner_id,
            name=data.name,
            description=data.description,
        )
        db.add(collection)
        await db.commit()
        await db.refresh(collection)
        return collection

    @staticmethod
    async def get_collection(
        db: AsyncSession,
        collection_id: uuid.UUID,
        owner_id: uuid.UUID,
        load_documents: bool = False
    ) -> Optional[Collection]:
        query = select(Collection).where(Collection.id == collection_id, Collection.owner_id == owner_id)
        if load_documents:
            query = query.options(selectinload(Collection.documents))
        result = await db.execute(query)
        return result.scalar_one_or_none()

    @staticmethod
    async def list_collections(
        db: AsyncSession,
        owner_id: uuid.UUID,
        page: int = 1,
        page_size: int = 20
    ) -> Tuple[List[Collection], int]:
        count_stmt = select(func.count(Collection.id)).where(Collection.owner_id == owner_id)
        total_count = (await db.execute(count_stmt)).scalar() or 0

        offset = (page - 1) * page_size
        stmt = (
            select(Collection)
            .where(Collection.owner_id == owner_id)
            .order_by(Collection.created_at.desc())
            .offset(offset)
            .limit(page_size)
            .options(selectinload(Collection.documents))
        )
        result = await db.execute(stmt)
        collections = list(result.scalars().all())
        return collections, total_count

    @staticmethod
    async def update_collection(
        db: AsyncSession,
        collection_id: uuid.UUID,
        owner_id: uuid.UUID,
        data: CollectionUpdate
    ) -> Optional[Collection]:
        collection = await CollectionService.get_collection(db, collection_id, owner_id)
        if not collection:
            return None

        if data.name is not None:
            collection.name = data.name
        if data.description is not None:
            collection.description = data.description

        await db.commit()
        await db.refresh(collection)
        return collection

    @staticmethod
    async def delete_collection(
        db: AsyncSession,
        collection_id: uuid.UUID,
        owner_id: uuid.UUID
    ) -> bool:
        collection = await CollectionService.get_collection(db, collection_id, owner_id)
        if not collection:
            return False

        # Disassociate documents
        await db.execute(
            update(Document)
            .where(Document.collection_id == collection_id)
            .values(collection_id=None)
        )

        await db.delete(collection)
        await db.commit()
        return True

    @staticmethod
    async def add_documents(
        db: AsyncSession,
        collection_id: uuid.UUID,
        owner_id: uuid.UUID,
        document_ids: List[uuid.UUID]
    ) -> int:
        collection = await CollectionService.get_collection(db, collection_id, owner_id)
        if not collection:
            return 0

        stmt = (
            update(Document)
            .where(Document.id.in_(document_ids), Document.owner_id == owner_id)
            .values(collection_id=collection_id)
        )
        result = await db.execute(stmt)
        await db.commit()
        return result.rowcount

    @staticmethod
    async def remove_documents(
        db: AsyncSession,
        collection_id: uuid.UUID,
        owner_id: uuid.UUID,
        document_ids: List[uuid.UUID]
    ) -> int:
        stmt = (
            update(Document)
            .where(
                Document.id.in_(document_ids),
                Document.collection_id == collection_id,
                Document.owner_id == owner_id,
            )
            .values(collection_id=None)
        )
        result = await db.execute(stmt)
        await db.commit()
        return result.rowcount
