import logging
from typing import List, Optional
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

    def __init__(self, db: AsyncSession):
        self.db = db

    async def ask(
        self,
        question: str,
        conversation_id: Optional[str],
        owner: User,
        document_id: Optional[str] = None,
        collection_id: Optional[str] = None,
    ) -> ChatResponse:
        """Execute the complete RAG pipeline."""
        # ── Step 1: Get or create conversation ────────────────────────────
        conversation = await self._get_or_create_conversation(
            conversation_id=conversation_id,
            owner=owner,
            question=question,
            document_id=document_id,
            collection_id=collection_id,
        )

        # ── Step 2: Verify document/collection ownership ───────────────────
        if document_id:
            await self._verify_document_ownership(document_id, owner)
        if collection_id:
            await self._verify_collection_ownership(collection_id, owner)

        # ── Step 3: Generate query embedding ──────────────────────────────
        embedding_service = get_embedding_service()
        query_embedding = embedding_service.embed_text(question)

        # ── Step 4: Retrieve relevant chunks ──────────────────────────────
        from app.core.config import get_settings
        settings = get_settings()

        pinecone = get_pinecone_service()
        chunks = pinecone.search_similar(
            query_embedding=query_embedding,
            owner_uid=owner.firebase_uid,
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
                "chunk_id": c.chunk_id,
                "document_id": c.document_id,
                "filename": c.filename,
                "page_num": c.page_num,
                "excerpt": c.excerpt,
                "score": c.score,
            }
            for c in result.citations
        ]

        await self._save_message(
            conversation_id=str(conversation.id),
            role="user",
            content=question,
        )
        await self._save_message(
            conversation_id=str(conversation.id),
            role="assistant",
            content=result.answer,
            citations_json=citations_data,
            token_usage_json=result.token_usage,
        )

        # ── Step 9: Return response ────────────────────────────────────────
        citation_schemas = [
            CitationSchema(
                chunk_id=c.chunk_id,
                document_id=c.document_id,
                filename=c.filename,
                page_num=c.page_num,
                excerpt=c.excerpt,
                score=c.score,
            )
            for c in result.citations
        ]

        return ChatResponse(
            conversation_id=str(conversation.id),
            answer=result.answer,
            citations=citation_schemas,
            has_evidence=result.has_evidence,
            token_usage=result.token_usage,
            model_name=result.model_name,
        )

    async def _get_or_create_conversation(
        self,
        conversation_id: Optional[str],
        owner: User,
        question: str,
        document_id: Optional[str],
        collection_id: Optional[str],
    ) -> Conversation:
        if conversation_id:
            result = await self.db.execute(
                select(Conversation).where(
                    Conversation.id == UUID(conversation_id),
                    Conversation.owner_id == owner.id,
                )
            )
            conv = result.scalar_one_or_none()
            if not conv:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Conversation not found.",
                )
            return conv

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

    async def _verify_document_ownership(self, document_id: str, owner: User) -> None:
        result = await self.db.execute(
            select(Document).where(
                Document.id == UUID(document_id),
                Document.owner_id == owner.id,
            )
        )
        if not result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Document not found or access denied.",
            )

    async def _verify_collection_ownership(self, collection_id: str, owner: User) -> None:
        from app.models.models import Collection
        result = await self.db.execute(
            select(Collection).where(
                Collection.id == UUID(collection_id),
                Collection.owner_id == owner.id,
            )
        )
        if not result.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Collection not found or access denied.",
            )

    async def _get_recent_messages(self, conversation_id: str, limit: int = 6) -> list:
        result = await self.db.execute(
            select(Message)
            .where(Message.conversation_id == UUID(conversation_id))
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
        conversation_id: str,
        role: str,
        content: str,
        citations_json: Optional[list] = None,
        token_usage_json: Optional[dict] = None,
    ) -> Message:
        msg = Message(
            conversation_id=UUID(conversation_id),
            role=role,
            content=content,
            citations_json=citations_json,
            token_usage_json=token_usage_json,
        )
        self.db.add(msg)
        await self.db.flush()
        return msg
