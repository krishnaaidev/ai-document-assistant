import uuid
import logging
from typing import Optional, List, Tuple, Any
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.models.models import Conversation, Message, MessageRole
from app.schemas.schemas import ConversationCreate, ConversationUpdate

logger = logging.getLogger(__name__)


class ConversationService:
    @staticmethod
    async def create_conversation(
        db: AsyncSession,
        owner_id: uuid.UUID,
        data: ConversationCreate
    ) -> Conversation:
        conversation = Conversation(
            id=uuid.uuid4(),
            owner_id=owner_id,
            title=data.title,
            retrieval_scope=data.retrieval_scope,
        )
        db.add(conversation)
        await db.commit()
        await db.refresh(conversation)
        return conversation

    @staticmethod
    async def get_conversation(
        db: AsyncSession,
        conversation_id: uuid.UUID,
        owner_id: uuid.UUID,
        load_messages: bool = False
    ) -> Optional[Conversation]:
        query = select(Conversation).where(
            Conversation.id == conversation_id,
            Conversation.owner_id == owner_id
        )
        if load_messages:
            query = query.options(selectinload(Conversation.messages))
        result = await db.execute(query)
        return result.scalar_one_or_none()

    @staticmethod
    async def list_conversations(
        db: AsyncSession,
        owner_id: uuid.UUID,
        page: int = 1,
        page_size: int = 20
    ) -> Tuple[List[Conversation], int]:
        count_stmt = select(func.count(Conversation.id)).where(Conversation.owner_id == owner_id)
        total_count = (await db.execute(count_stmt)).scalar() or 0

        offset = (page - 1) * page_size
        stmt = (
            select(Conversation)
            .where(Conversation.owner_id == owner_id)
            .order_by(Conversation.updated_at.desc())
            .offset(offset)
            .limit(page_size)
            .options(selectinload(Conversation.messages))
        )
        result = await db.execute(stmt)
        conversations = list(result.scalars().all())
        return conversations, total_count

    @staticmethod
    async def update_conversation(
        db: AsyncSession,
        conversation_id: uuid.UUID,
        owner_id: uuid.UUID,
        data: ConversationUpdate
    ) -> Optional[Conversation]:
        conversation = await ConversationService.get_conversation(db, conversation_id, owner_id)
        if not conversation:
            return None

        if data.title is not None:
            conversation.title = data.title
        if data.retrieval_scope is not None:
            conversation.retrieval_scope = data.retrieval_scope

        await db.commit()
        await db.refresh(conversation)
        return conversation

    @staticmethod
    async def delete_conversation(
        db: AsyncSession,
        conversation_id: uuid.UUID,
        owner_id: uuid.UUID
    ) -> bool:
        conversation = await ConversationService.get_conversation(db, conversation_id, owner_id)
        if not conversation:
            return False

        await db.delete(conversation)
        await db.commit()
        return True

    @staticmethod
    async def create_message(
        db: AsyncSession,
        conversation_id: uuid.UUID,
        role: MessageRole,
        content: str,
        citations_json: Optional[Any] = None,
        token_usage_json: Optional[Any] = None
    ) -> Message:
        message = Message(
            id=uuid.uuid4(),
            conversation_id=conversation_id,
            role=role,
            content=content,
            citations_json=citations_json,
            token_usage_json=token_usage_json,
        )
        db.add(message)
        await db.commit()
        await db.refresh(message)
        return message

    @staticmethod
    async def list_messages(
        db: AsyncSession,
        conversation_id: uuid.UUID,
        owner_id: uuid.UUID,
        limit: int = 100
    ) -> List[Message]:
        conv = await ConversationService.get_conversation(db, conversation_id, owner_id)
        if not conv:
            return []

        stmt = (
            select(Message)
            .where(Message.conversation_id == conversation_id)
            .order_by(Message.created_at.asc())
            .limit(limit)
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())
