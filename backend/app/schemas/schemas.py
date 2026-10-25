import uuid
from datetime import datetime
from typing import List, Optional, Any, Generic, TypeVar
from pydantic import BaseModel, Field, ConfigDict
from app.models.models import ProcessingStatus, SummaryType, MessageRole

T = TypeVar("T")


# Pagination
class PaginationMetadata(BaseModel):
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=20, ge=1, le=100)
    total_count: int = Field(default=0, ge=0)
    total_pages: int = Field(default=0, ge=0)


class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    pagination: PaginationMetadata


# User Schemas
class UserBase(BaseModel):
    email: str
    display_name: Optional[str] = None


class UserCreate(UserBase):
    firebase_uid: str


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    firebase_uid: str
    created_at: datetime
    updated_at: datetime


# Document Schemas
class DocumentBase(BaseModel):
    filename: str
    content_type: str
    file_size: int


class DocumentResponse(DocumentBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    owner_id: uuid.UUID
    collection_id: Optional[uuid.UUID] = None
    file_hash: str
    storage_path: str
    processing_status: ProcessingStatus
    processing_error: Optional[str] = None
    page_count: int = 0
    chunk_count: int = 0
    created_at: datetime
    updated_at: datetime


class DocumentDetailResponse(DocumentResponse):
    download_url: Optional[str] = None


class DocumentContentResponse(BaseModel):
    id: uuid.UUID
    filename: str
    content: str
    page_count: int
    chunk_count: int


class DocumentRetryResponse(BaseModel):
    message: str
    document_id: uuid.UUID
    job_id: uuid.UUID
    status: ProcessingStatus


# Collection Schemas
class CollectionBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: Optional[str] = None


class CollectionCreate(CollectionBase):
    pass


class CollectionUpdate(BaseModel):
    name: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = None


class CollectionResponse(CollectionBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    owner_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    document_count: int = 0


class CollectionDetailResponse(CollectionResponse):
    documents: List[DocumentResponse] = []


class CollectionDocumentOperation(BaseModel):
    document_ids: List[uuid.UUID]


# Citation & Token Usage Schemas
class CitationItem(BaseModel):
    document_id: str
    filename: str
    page_num: Optional[int] = None
    chunk_index: Optional[int] = None
    relevance_score: Optional[float] = None
    snippet: Optional[str] = None


class TokenUsage(BaseModel):
    prompt_tokens: int = 0
    completion_tokens: int = 0
    total_tokens: int = 0


# Conversation & Message Schemas
class MessageBase(BaseModel):
    role: MessageRole
    content: str


class MessageCreate(BaseModel):
    content: str


class MessageResponse(MessageBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    conversation_id: uuid.UUID
    citations_json: Optional[List[CitationItem]] = None
    token_usage_json: Optional[TokenUsage] = None
    created_at: datetime


class ConversationBase(BaseModel):
    title: str = Field(default="New Conversation", max_length=255)
    retrieval_scope: str = Field(default="all", max_length=50)


class ConversationCreate(ConversationBase):
    pass


class ConversationUpdate(BaseModel):
    title: Optional[str] = Field(default=None, max_length=255)
    retrieval_scope: Optional[str] = Field(default=None, max_length=50)


class ConversationResponse(ConversationBase):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    owner_id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    message_count: int = 0


class ConversationDetailResponse(ConversationResponse):
    messages: List[MessageResponse] = []


# Chat / RAG Schemas
class ChatRequest(BaseModel):
    question: str = Field(min_length=1, description="User's query")
    conversation_id: Optional[uuid.UUID] = Field(default=None, description="Existing conversation ID or null for new")
    retrieval_scope: str = Field(default="all", description="'all', 'document', or 'collection'")
    document_id: Optional[uuid.UUID] = Field(default=None, description="Target document ID if scope is 'document'")
    collection_id: Optional[uuid.UUID] = Field(default=None, description="Target collection ID if scope is 'collection'")
    top_k: Optional[int] = Field(default=None, ge=1, le=20, description="Override default top_k chunks retrieved")


class ChatResponse(BaseModel):
    conversation_id: uuid.UUID
    message_id: uuid.UUID
    answer: str
    citations: List[CitationItem] = []
    token_usage: TokenUsage = TokenUsage()
    created_at: datetime


# Summary Schemas
class SummaryCreateRequest(BaseModel):
    document_id: uuid.UUID
    summary_type: SummaryType = SummaryType.EXECUTIVE


class SummaryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    owner_id: uuid.UUID
    document_id: uuid.UUID
    summary_type: SummaryType
    content: str
    citations_json: Optional[List[CitationItem]] = None
    created_at: datetime
    updated_at: datetime


# Search Schemas
class SearchRequest(BaseModel):
    query: str = Field(min_length=1)
    retrieval_scope: str = Field(default="all")
    document_id: Optional[uuid.UUID] = None
    collection_id: Optional[uuid.UUID] = None
    top_k: int = Field(default=5, ge=1, le=50)


class SearchResultItem(BaseModel):
    chunk_id: str
    document_id: str
    filename: str
    text: str
    score: float
    page_num: Optional[int] = None
    chunk_index: Optional[int] = None


class SearchResponse(BaseModel):
    query: str
    results: List[SearchResultItem]
    total_results: int


# Health Schemas
class ServiceStatus(BaseModel):
    status: str
    details: Optional[str] = None


class HealthResponse(BaseModel):
    status: str
    version: str = "1.0.0"
    environment: str


class ReadyResponse(BaseModel):
    ready: bool
    database: ServiceStatus
    pinecone: ServiceStatus
    firebase: ServiceStatus
