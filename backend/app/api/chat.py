import logging
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.routing import APIRouter
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.db.database import get_db
from app.models.models import User
from app.rag.llm_service import get_llm_service
from app.rag.pipeline import RAGPipeline
from app.schemas.schemas import ChatRequest, ChatResponse

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/chat", response_model=ChatResponse)
async def chat(
    request: ChatRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Main RAG question-answering endpoint.
    """
    q = request.question or request.message
    if not q or not q.strip():
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Question is required.")

    conv_id = request.conversation_id or request.conversationId
    doc_id = request.document_id or request.documentId
    col_id = request.collection_id or request.collectionId

    if request.scope and isinstance(request.scope, dict):
        s_type = request.scope.get("type")
        s_id = request.scope.get("id")
        if s_type == "document" and s_id:
            doc_id = s_id
        elif s_type == "collection" and s_id:
            col_id = s_id

    pipeline = RAGPipeline(db=db)

    try:
        result = await pipeline.ask(
            question=q.strip(),
            conversation_id=str(conv_id) if conv_id else None,
            owner=current_user,
            document_id=str(doc_id) if doc_id else None,
            collection_id=str(col_id) if col_id else None,
        )

        conv_id_str = str(result.conversation_id)
        msg_id_str = str(result.message_id)

        # Build frontend-compatible message object
        frontend_citations = [
            {
                "id": str(getattr(c, "chunk_id", f"cit-{i}")),
                "documentId": str(getattr(c, "document_id", "")),
                "filename": getattr(c, "filename", ""),
                "pageNumber": getattr(c, "page_num", 1) or 1,
                "chunkId": str(getattr(c, "chunk_id", f"chk-{i}")),
                "excerpt": getattr(c, "excerpt", getattr(c, "snippet", "")),
                "score": float(getattr(c, "score", 0.0) or 0.0),
            }
            for i, c in enumerate(result.citations)
        ]

        result.conversationId = conv_id_str
        result.message = {
            "id": msg_id_str,
            "conversationId": conv_id_str,
            "role": "assistant",
            "content": result.answer,
            "citations": frontend_citations,
            "createdAt": result.created_at.isoformat() if hasattr(result.created_at, "isoformat") else str(result.created_at),
        }

        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"RAG pipeline error for user {current_user.firebase_uid}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An error occurred while processing your question: {str(e)}",
        )
