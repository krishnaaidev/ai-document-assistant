import logging
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()


class Base(DeclarativeBase):
    pass


def build_engine():
    """Build the async SQLAlchemy engine with Supabase-compatible settings."""
    db_url = settings.async_database_url
    connect_args = {}

    # For Supabase with pgBouncer (transaction mode), statement_cache_size must be 0
    if "pgbouncer=true" in db_url or "pooler.supabase" in db_url:
        connect_args["statement_cache_size"] = 0
        logger.info("Using PgBouncer-compatible settings (statement_cache_size=0).")

    engine = create_async_engine(
        db_url,
        echo=settings.DEBUG,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10,
        pool_recycle=300,
        connect_args=connect_args,
    )
    return engine


engine = build_engine()

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """FastAPI dependency that provides an async database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()
