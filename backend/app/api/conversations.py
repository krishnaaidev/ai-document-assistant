import uuid
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query, status, Response
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.api.deps import get_current_user
from app.models.models import User
from app.schemas.schemas import (
    ConversationCreate,
    ConversationUpdate,
    ConversationResponse,
    ConversationDetailResponse,
    MessageResponse,
    PaginatedResponse,
    PaginationMetadata,
)
from app.services.conversation_service import ConversationService

router = APIRouter(prefix="/conversations", tags=["Conversations"])


@router.post("", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    data: ConversationCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Start a new chat conversation."""
    conversation = await ConversationService.create_conversation(db, current_user.id, data)
    resp = ConversationResponse.model_validate(conversation)
    resp.message_count = 0
    return resp


@router.get("", response_model=PaginatedResponse[ConversationResponse])
async def list_conversations(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List all conversations owned by current user."""
    convs, total_count = await ConversationService.list_conversations(
        db, current_user.id, page=page, page_size=page_size
    )

    items = []
    for c in convs:
        resp = ConversationResponse.model_validate(c)
        resp.message_count = len(c.messages) if c.messages else 0
        items.append(resp)

    total_pages = (total_count + page_size - 1) // page_size if page_size > 0 else 0

    return PaginatedResponse[ConversationResponse](
        items=items,
        pagination=PaginationMetadata(
            page=page,
            page_size=page_size,
            total_count=total_count,
            total_pages=total_pages,
        ),
    )


@router.get("/{conversation_id}", response_model=ConversationDetailResponse)
async def get_conversation(
    conversation_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get conversation details including all ordered chat messages."""
    conversation = await ConversationService.get_conversation(
        db, conversation_id, current_user.id, load_messages=True
    )
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    messages = [MessageResponse.model_validate(m) for m in (conversation.messages or [])]
    return ConversationDetailResponse(
        id=conversation.id,
        owner_id=conversation.owner_id,
        title=conversation.title,
        retrieval_scope=conversation.retrieval_scope,
        created_at=conversation.created_at,
        updated_at=conversation.updated_at,
        message_count=len(messages),
        messages=messages,
    )


@router.put("/{conversation_id}", response_model=ConversationResponse)
async def update_conversation(
    conversation_id: uuid.UUID,
    data: ConversationUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Update conversation title or retrieval scope."""
    conversation = await ConversationService.update_conversation(db, conversation_id, current_user.id, data)
    if not conversation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    resp = ConversationResponse.model_validate(conversation)
    resp.message_count = len(conversation.messages) if conversation.messages else 0
    return resp


@router.delete("/{conversation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_conversation(
    conversation_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Delete conversation and all its messages."""
    deleted = await ConversationService.delete_conversation(db, conversation_id, current_user.id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/{conversation_id}/messages", response_model=List[MessageResponse])
async def list_messages(
    conversation_id: uuid.UUID,
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve message history for a conversation."""
    messages = await ConversationService.list_messages(db, conversation_id, current_user.id, limit=limit)
    return [MessageResponse.model_validate(m) for m in messages]
