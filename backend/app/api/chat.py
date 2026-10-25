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

    Steps:
    1. Verify auth (done by dep)
    2. Verify conversation ownership
    3. Generate query embedding
    4. Retrieve relevant chunks from Pinecone
    5. Validate evidence sufficiency
    6. Generate answer via Gemini
    7. Validate citations
    8. Save messages to PostgreSQL
    9. Return answer + citations
    """
    pipeline = RAGPipeline(db=db)

    try:
        result = await pipeline.ask(
            question=request.question,
            conversation_id=request.conversation_id,
            owner=current_user,
            document_id=request.document_id,
            collection_id=request.collection_id,
        )
        return result
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"RAG pipeline error for user {current_user.firebase_uid}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing your question. Please try again.",
        )
