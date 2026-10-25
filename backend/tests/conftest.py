import os
import uuid
import pytest
import pytest_asyncio
from typing import AsyncGenerator
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker

# Set test environment
os.environ["ENVIRONMENT"] = "test"
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///:memory:"
os.environ["GEMINI_API_KEY"] = "mock_gemini_key"
os.environ["PINECONE_API_KEY"] = ""
os.environ["FIREBASE_PROJECT_ID"] = "test-project"

from app.db.database import Base, get_db
from app.models.models import User
from app.api.deps import get_current_user
from app.main import app

# Create in-memory async SQLite engine for tests
test_engine = create_async_engine(
    "sqlite+aiosqlite:///:memory:",
    echo=False,
)

TestingSessionLocal = async_sessionmaker(
    bind=test_engine,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
    class_=AsyncSession,
)


@pytest_asyncio.fixture(scope="session", autouse=True)
async def prepare_database():
    """Create all tables in the test database schema."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await test_engine.dispose()


@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Provide a transactional database session for tests."""
    async with TestingSessionLocal() as session:
        yield session
        await session.rollback()


@pytest_asyncio.fixture
async def test_user(db_session: AsyncSession) -> User:
    """Create or return a default authenticated test user."""
    from app.services.user_service import UserService
    user = await UserService.get_or_create_user(
        db=db_session,
        firebase_uid="test_user_uid_101",
        email="test_user@example.com",
        display_name="Test User",
    )
    return user


@pytest_asyncio.fixture
async def other_user(db_session: AsyncSession) -> User:
    """Create a second distinct user for isolation testing."""
    from app.services.user_service import UserService
    user = await UserService.get_or_create_user(
        db=db_session,
        firebase_uid="test_user_uid_202",
        email="other_user@example.com",
        display_name="Other User",
    )
    return user


@pytest_asyncio.fixture
def auth_headers(test_user: User) -> dict:
    """Authorization header with test bearer token recognized by security module."""
    return {"Authorization": f"Bearer test-token-{test_user.firebase_uid}"}


@pytest_asyncio.fixture
def other_auth_headers(other_user: User) -> dict:
    """Authorization header for second user."""
    return {"Authorization": f"Bearer test-token-{other_user.firebase_uid}"}


@pytest_asyncio.fixture
async def client(db_session: AsyncSession, test_user: User) -> AsyncGenerator[AsyncClient, None]:
    """Provide an AsyncClient wired with DB and auth overrides."""
    async def override_get_db():
        yield db_session

    async def override_get_current_user():
        return test_user

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac

    app.dependency_overrides.clear()
