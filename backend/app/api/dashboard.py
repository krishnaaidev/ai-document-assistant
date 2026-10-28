import logging
from typing import List, Dict, Any
from fastapi import Depends
from fastapi.routing import APIRouter
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc

from app.api.deps import get_current_user
from app.db.database import get_db
from app.models.models import User, Document, Collection, Conversation, Summary

logger = logging.getLogger(__name__)

router = APIRouter(tags=["dashboard"])


@router.get("/dashboard/stats")
async def get_dashboard_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> Dict[str, int]:
    """Get high-speed aggregated counts for the dashboard."""
    try:
        # Fast indexed count queries
        docs_q = select(func.count(Document.id)).where(Document.owner_id == current_user.id)
        cols_q = select(func.count(Collection.id)).where(Collection.owner_id == current_user.id)
        convs_q = select(func.count(Conversation.id)).where(Conversation.owner_id == current_user.id)
        sums_q = select(func.count(Summary.id)).where(Summary.owner_id == current_user.id)

        docs_count = (await db.scalar(docs_q)) or 0
        cols_count = (await db.scalar(cols_q)) or 0
        convs_count = (await db.scalar(convs_q)) or 0
        sums_count = (await db.scalar(sums_q)) or 0

        return {
            "totalDocuments": docs_count,
            "totalCollections": cols_count,
            "totalConversations": convs_count,
            "totalSummaries": sums_count,
        }
    except Exception as e:
        logger.error("Error computing dashboard stats: %s", e)
        return {
            "totalDocuments": 0,
            "totalCollections": 0,
            "totalConversations": 0,
            "totalSummaries": 0,
        }


@router.get("/activity")
async def get_recent_activity(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> List[Dict[str, Any]]:
    """Get chronological user activity feed across documents, chats, and summaries."""
    activities: List[Dict[str, Any]] = []
    try:
        # Recent documents
        doc_stmt = (
            select(Document)
            .where(Document.owner_id == current_user.id)
            .order_by(desc(Document.created_at))
            .limit(5)
        )
        docs = (await db.scalars(doc_stmt)).all()
        for d in docs:
            activities.append({
                "id": f"act-doc-{d.id}",
                "type": "document_uploaded",
                "title": f"Uploaded {d.filename}",
                "description": f"Processed into {d.chunk_count} vector chunks",
                "targetId": str(d.id),
                "targetUrl": f"/documents/{d.id}",
                "timestamp": d.created_at.isoformat() if d.created_at else "",
            })

        # Recent conversations
        conv_stmt = (
            select(Conversation)
            .where(Conversation.owner_id == current_user.id)
            .order_by(desc(Conversation.created_at))
            .limit(5)
        )
        convs = (await db.scalars(conv_stmt)).all()
        for c in convs:
            activities.append({
                "id": f"act-conv-{c.id}",
                "type": "conversation_created",
                "title": f"Started chat: {c.title}",
                "description": f"Inquiry session with scope: {c.retrieval_scope}",
                "targetId": str(c.id),
                "targetUrl": f"/chat/{c.id}",
                "timestamp": c.created_at.isoformat() if c.created_at else "",
            })

        # Recent summaries
        sum_stmt = (
            select(Summary)
            .where(Summary.owner_id == current_user.id)
            .order_by(desc(Summary.created_at))
            .limit(5)
        )
        sums = (await db.scalars(sum_stmt)).all()
        for s in sums:
            activities.append({
                "id": f"act-sum-{s.id}",
                "type": "summary_generated",
                "title": f"Generated {s.summary_type.value if hasattr(s.summary_type, 'value') else s.summary_type} summary",
                "description": "Synthesized key findings and metrics",
                "targetId": str(s.id),
                "targetUrl": "/summaries",
                "timestamp": s.created_at.isoformat() if s.created_at else "",
            })

        # Sort all combined by timestamp desc
        activities.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        return activities[:10]
    except Exception as e:
        logger.error("Error fetching activity feed: %s", e)
        return []
