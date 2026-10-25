import logging

from fastapi import Depends
from fastapi.routing import APIRouter
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("/health")
async def health():
    """Basic health check — always returns 200 if the server is running."""
    return {"status": "ok", "service": "AI Document Assistant API"}


@router.get("/ready")
async def ready(db: AsyncSession = Depends(get_db)):
    """
    Readiness check — verifies connectivity to critical services.
    Returns 200 only when everything required for serving traffic is ready.
    """
    checks = {}

    # Database check
    try:
        await db.execute(text("SELECT 1"))
        checks["database"] = "ok"
    except Exception as e:
        logger.error(f"Health check: database failure: {e}")
        checks["database"] = f"error: {str(e)[:100]}"

    # Pinecone check
    try:
        from app.rag.pinecone_service import get_pinecone_service
        svc = get_pinecone_service()
        # Quick stats call to verify connection
        svc.index.describe_index_stats()
        checks["pinecone"] = "ok"
    except Exception as e:
        logger.error(f"Health check: Pinecone failure: {e}")
        checks["pinecone"] = f"error: {str(e)[:100]}"

    # Embedding model check
    try:
        from app.rag.embeddings import get_embedding_service
        emb = get_embedding_service()
        checks["embedding_model"] = f"ok (dim={emb.dimension})"
    except Exception as e:
        logger.error(f"Health check: embedding model failure: {e}")
        checks["embedding_model"] = f"error: {str(e)[:100]}"

    # Firebase check
    try:
        from app.core.firebase import get_firebase_app
        get_firebase_app()
        checks["firebase"] = "ok"
    except Exception as e:
        logger.error(f"Health check: Firebase failure: {e}")
        checks["firebase"] = f"error: {str(e)[:100]}"

    all_ok = all(v == "ok" or v.startswith("ok") for v in checks.values())
    status_code = 200 if all_ok else 503

    from fastapi.responses import JSONResponse
    return JSONResponse(
        status_code=status_code,
        content={"status": "ready" if all_ok else "degraded", "checks": checks},
    )
