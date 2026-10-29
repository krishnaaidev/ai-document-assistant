import logging
from typing import List, Optional, Any
from uuid import UUID

from fastapi import Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.database import get_db
from app.models.models import Conversation, Document, Message, User
from app.rag.embeddings import get_embedding_service
from app.rag.llm_service import get_llm_service
from app.rag.pinecone_service import get_pinecone_service
from app.schemas.schemas import ChatResponse, CitationSchema, ConversationCreate, MessageSchema

logger = logging.getLogger(__name__)


class RAGPipeline:
    """Orchestrates the full RAG question-answering flow."""

    def __init__(self, db: Optional[AsyncSession] = None):
        self.db = db

    async def ask(
        self,
        question: str,
        conversation_id: Optional[str] = None,
        owner: Optional[User] = None,
        user: Optional[User] = None,
        document_id: Optional[str] = None,
        collection_id: Optional[str] = None,
        db: Optional[AsyncSession] = None,
    ) -> ChatResponse:
        """Execute the complete RAG pipeline."""
        if db is not None:
            self.db = db

        active_owner = owner or user
        if active_owner is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Owner/User must be provided")

        # ── Step 1: Get or create conversation ────────────────────────────
        conversation = await self._get_or_create_conversation(
            conversation_id=conversation_id,
            owner=active_owner,
            question=question,
            document_id=document_id,
            collection_id=collection_id,
        )

        # ── Step 2: Verify document/collection ownership ───────────────────
        if document_id:
            await self._verify_document_ownership(document_id, active_owner)
        if collection_id:
            await self._verify_collection_ownership(collection_id, active_owner)

        # ── Step 3: Generate query embedding ──────────────────────────────
        embedding_service = get_embedding_service()
        query_embedding = embedding_service.embed_text(question)

        # ── Step 4: Retrieve relevant chunks ──────────────────────────────
        from app.core.config import get_settings
        settings = get_settings()

        pinecone = get_pinecone_service()
        chunks = pinecone.search_similar(
            query_embedding=query_embedding,
            owner_uid=active_owner.firebase_uid,
            top_k=settings.TOP_K,
            document_id=document_id,
            collection_id=collection_id,
        )

        # ── Step 5: Get conversation history ──────────────────────────────
        history = await self._get_recent_messages(str(conversation.id), limit=6)

        # ── Step 6+7: Generate answer and validate citations ───────────────
        llm = get_llm_service()
        result = llm.generate_answer(
            question=question,
            context_chunks=chunks,
            conversation_history=history,
        )

        # ── Step 8: Save messages to PostgreSQL ────────────────────────────
        citations_data = [
            {
                "chunk_id": getattr(c, "chunk_id", None),
                "document_id": c.document_id,
                "filename": c.filename,
                "page_num": c.page_num,
                "excerpt": getattr(c, "excerpt", getattr(c, "snippet", "")),
                "score": getattr(c, "score", getattr(c, "relevance_score", 0.0)),
            }
            for c in result.citations
        ]

        await self._save_message(
            conversation_id=str(conversation.id),
            role="user",
            content=question,
        )
        token_dict = result.token_usage.model_dump() if hasattr(result.token_usage, "model_dump") else (result.token_usage or {})
        assistant_msg = await self._save_message(
            conversation_id=str(conversation.id),
            role="assistant",
            content=result.answer,
            citations_json=citations_data,
            token_usage_json=token_dict,
        )

        # ── Step 9: Return response ────────────────────────────────────────
        citation_schemas = [
            CitationSchema(
                chunk_id=c.chunk_id,
                document_id=c.document_id,
                filename=c.filename,
                page_num=c.page_num,
                snippet=getattr(c, "excerpt", getattr(c, "snippet", "")),
                excerpt=getattr(c, "excerpt", getattr(c, "snippet", "")),
                relevance_score=getattr(c, "score", getattr(c, "relevance_score", 0.0)),
            )
            for c in result.citations
        ]

        from datetime import datetime, timezone
        msg_created_at = getattr(assistant_msg, "created_at", None) or datetime.now(timezone.utc)

        return ChatResponse(
            conversation_id=conversation.id,
            message_id=assistant_msg.id,
            answer=result.answer,
            citations=citation_schemas,
            token_usage=result.token_usage if hasattr(result.token_usage, "model_dump") else TokenUsage(**(token_dict or {})),
            created_at=msg_created_at,
        )

    async def _get_or_create_conversation(
        self,
        conversation_id: Optional[Any],
        owner: User,
        question: str,
        document_id: Optional[Any],
        collection_id: Optional[Any],
    ) -> Conversation:
        if conversation_id:
            try:
                conv_uuid = conversation_id if isinstance(conversation_id, UUID) else UUID(str(conversation_id))
                result = await self.db.execute(
                    select(Conversation).where(
                        Conversation.id == conv_uuid,
                        Conversation.owner_id == owner.id,
                    )
                )
                conv = result.scalar_one_or_none()
                if conv:
                    return conv
            except (ValueError, TypeError):
                pass

        # Auto-generate title from question
        title = question[:80] + ("..." if len(question) > 80 else "")

        # Determine retrieval scope
        if document_id:
            scope = f"document:{document_id}"
        elif collection_id:
            scope = f"collection:{collection_id}"
        else:
            scope = "all"

        conv = Conversation(
            owner_id=owner.id,
            title=title,
            retrieval_scope=scope,
        )
        self.db.add(conv)
        await self.db.flush()
        return conv

    async def _verify_document_ownership(self, document_id: Any, owner: User) -> None:
        try:
            doc_uuid = document_id if isinstance(document_id, UUID) else UUID(str(document_id))
        except (ValueError, TypeError):
            # Not a DB UUID, skip check for mock/temp items
            return
        result = await self.db.execute(
            select(Document).where(
                Document.id == doc_uuid,
                Document.owner_id == owner.id,
            )
        )
        if not result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Document not found or access denied.",
            )

    async def _verify_collection_ownership(self, collection_id: Any, owner: User) -> None:
        from app.models.models import Collection
        try:
            col_uuid = collection_id if isinstance(collection_id, UUID) else UUID(str(collection_id))
        except (ValueError, TypeError):
            return
        result = await self.db.execute(
            select(Collection).where(
                Collection.id == col_uuid,
                Collection.owner_id == owner.id,
            )
        )
        if not result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Collection not found or access denied.",
            )

    async def _get_recent_messages(self, conversation_id: Any, limit: int = 6) -> list:
        try:
            conv_uuid = conversation_id if isinstance(conversation_id, UUID) else UUID(str(conversation_id))
        except (ValueError, TypeError):
            return []
        result = await self.db.execute(
            select(Message)
            .where(Message.conversation_id == conv_uuid)
            .order_by(Message.created_at.desc())
            .limit(limit)
        )
        messages = result.scalars().all()
        return [
            {"role": str(m.role.value if hasattr(m.role, 'value') else m.role), "content": m.content}
            for m in reversed(messages)
        ]

    async def _save_message(
        self,
        conversation_id: Any,
        role: str,
        content: str,
        citations_json: Optional[list] = None,
        token_usage_json: Optional[dict] = None,
    ) -> Message:
        try:
            conv_uuid = conversation_id if isinstance(conversation_id, UUID) else UUID(str(conversation_id))
        except (ValueError, TypeError):
            import uuid
            conv_uuid = uuid.uuid4()
        msg = Message(
            conversation_id=conv_uuid,
            role=role,
            content=content,
            citations_json=citations_json,
            token_usage_json=token_usage_json,
        )
        self.db.add(msg)
        await self.db.flush()
        return msg


rag_pipeline = RAGPipeline()
