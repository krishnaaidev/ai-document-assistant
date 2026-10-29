import os
from functools import lru_cache
from typing import List, Optional
from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    # General
    ENVIRONMENT: str = Field(default="development", description="Environment: development, test, production")
    DEBUG: bool = Field(default=False, description="Debug mode")
    API_V1_STR: str = Field(default="/api", description="Base API route prefix")
    PROJECT_NAME: str = Field(default="AI Document Assistant", description="Application name")

    # Database
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/postgres",
        description="PostgreSQL connection string"
    )

    # Gemini AI
    GEMINI_API_KEY: str = Field(default="", description="Google Gemini API key")
    GEMINI_MODEL: str = Field(default="gemini-3.5-flash-lite", description="Gemini model name")

    # Pinecone
    PINECONE_API_KEY: str = Field(default="", description="Pinecone API key")
    PINECONE_INDEX_NAME: str = Field(default="ai-document-assistant", description="Pinecone index name")
    PINECONE_CLOUD: str = Field(default="aws", description="Pinecone cloud provider")
    PINECONE_REGION: str = Field(default="us-east-1", description="Pinecone region")

    # Embedding
    EMBEDDING_MODEL: str = Field(default="all-MiniLM-L6-v2", description="HuggingFace sentence-transformer model")

    # Firebase
    FIREBASE_PROJECT_ID: str = Field(default="", description="Firebase project ID")
    FIREBASE_STORAGE_BUCKET: str = Field(default="", description="Firebase storage bucket name")
    FIREBASE_SERVICE_ACCOUNT_PATH: Optional[str] = Field(
        default="./firebase-service-account.json",
        description="Path to Firebase service account JSON key file"
    )

    # CORS
    CORS_ORIGINS: str = Field(
        default="http://localhost:5173,http://localhost:3000",
        description="Comma-separated list of allowed origins"
    )

    # Upload Limits
    MAX_UPLOAD_SIZE_MB: int = Field(default=20, description="Max upload file size in megabytes")

    # RAG Settings
    TOP_K: int = Field(default=5, description="Number of top chunks to retrieve")
    CHUNK_SIZE: int = Field(default=1000, description="Target character chunk size")
    CHUNK_OVERLAP: int = Field(default=200, description="Overlap between consecutive chunks")
    RELEVANCE_THRESHOLD: float = Field(default=0.5, description="Minimum cosine similarity threshold")

    # Rate Limiting
    RATE_LIMIT_PER_MINUTE: str = Field(default="120/minute", description="Default slowapi rate limit")

    @property
    def cors_origins_list(self) -> List[str]:
        if not self.CORS_ORIGINS:
            return ["*"]
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def max_upload_size_bytes(self) -> int:
        return self.MAX_UPLOAD_SIZE_MB * 1024 * 1024

    @property
    def async_database_url(self) -> str:
        """Ensure the database URL uses the asyncpg driver, or aiosqlite for sqlite."""
        url = self.DATABASE_URL
        if url.startswith("sqlite+aiosqlite://"):
            return url
        elif url.startswith("sqlite://"):
            return url.replace("sqlite://", "sqlite+aiosqlite://", 1)
        elif url.startswith("postgres://"):
            url = url.replace("postgres://", "postgresql+asyncpg://", 1)
        elif url.startswith("postgresql://") and not url.startswith("postgresql+asyncpg://"):
            url = url.replace("postgresql://", "postgresql+asyncpg://", 1)
        return url

    def validate_critical_settings(self) -> None:
        """Validate critical configuration needed for production operations."""
        warnings: List[str] = []
        if not self.DATABASE_URL:
            warnings.append("DATABASE_URL is not configured.")
        if not self.GEMINI_API_KEY:
            warnings.append("GEMINI_API_KEY is not set. LLM features may fail.")
        if not self.PINECONE_API_KEY:
            warnings.append("PINECONE_API_KEY is not set. Vector search features may fail.")
        if not self.FIREBASE_PROJECT_ID:
            warnings.append("FIREBASE_PROJECT_ID is not set. Auth verification may fail.")

        if warnings and self.ENVIRONMENT == "production":
            raise ValueError(f"Critical configuration missing in production: {'; '.join(warnings)}")


@lru_cache()
def get_settings() -> Settings:
    return Settings()
