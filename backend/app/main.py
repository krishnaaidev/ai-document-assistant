import time
import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.core.config import get_settings
from app.core.firebase import initialize_firebase
from app.rag.embeddings import embedding_service
from app.rag.pinecone_service import pinecone_service

from app.api.health import router as health_router
from app.api.auth import router as auth_router
from app.api.documents import router as documents_router
from app.api.collections import router as collections_router
from app.api.conversations import router as conversations_router
from app.api.chat import router as chat_router
from app.api.summaries import router as summaries_router
from app.api.search import router as search_router

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("document_assistant")

settings = get_settings()

# Rate limiting
limiter = Limiter(key_func=get_remote_address, default_limits=[settings.RATE_LIMIT_PER_MINUTE])


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown lifecycle management."""
    logger.info("Initializing AI Document Assistant backend...")
    # Validate critical configuration
    try:
        settings.validate_critical_settings()
    except Exception as e:
        logger.warning("Configuration validation warning: %s", e)

    # Initialize Firebase Admin
    try:
        initialize_firebase()
    except Exception as e:
        logger.warning("Firebase init warning: %s", e)

    # Preload Pinecone index
    try:
        pinecone_service._get_index()
    except Exception as e:
        logger.warning("Pinecone init warning: %s", e)

    # Embedding model is lazy-loaded on demand to preserve memory on 512MB dynos

    # Verify or initialize database tables
    try:
        from app.db.database import engine
        from app.models.models import Base
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info("Database tables verified.")
    except Exception as e:
        logger.warning("Database table check warning: %s", e)

    logger.info("Backend application startup complete.")
    yield
    logger.info("Backend application shutting down.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# Attach state for slowapi
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Rate limiting middleware
app.add_middleware(SlowAPIMiddleware)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Trusted Host middleware
app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=["*"],
)


# Request Timeout and Latency Middleware
@app.middleware("http")
async def timeout_and_logging_middleware(request: Request, call_next):
    start_time = time.time()
    try:
        # Timeout after 120 seconds
        response = await asyncio.wait_for(call_next(request), timeout=120.0)
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = f"{process_time:.4f}s"
        return response
    except asyncio.TimeoutError:
        logger.error("Request timeout for %s %s", request.method, request.url.path)
        return JSONResponse(
            status_code=status.HTTP_504_GATEWAY_TIMEOUT,
            content={"detail": "Request processing timed out. Please try again later."},
        )


# Global Exception Handlers
@app.exception_handler(ValueError)
async def value_error_handler(request: Request, exc: ValueError):
    return JSONResponse(
        status_code=status.HTTP_400_BAD_REQUEST,
        content={"detail": str(exc)},
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error("Unhandled server exception on %s %s: %s", request.method, request.url.path, exc, exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "An internal server error occurred."},
    )


# Register Routers under /api prefix
api_prefix = settings.API_V1_STR
app.include_router(health_router, prefix=api_prefix)
app.include_router(auth_router, prefix=api_prefix)
app.include_router(documents_router, prefix=api_prefix)
app.include_router(collections_router, prefix=api_prefix)
app.include_router(conversations_router, prefix=api_prefix)
app.include_router(chat_router, prefix=api_prefix)
app.include_router(summaries_router, prefix=api_prefix)
app.include_router(search_router, prefix=api_prefix)


@app.get("/")
async def root():
    return {
        "name": settings.PROJECT_NAME,
        "status": "online",
        "documentation": "/docs",
        "health": f"{settings.API_V1_STR}/health",
    }
