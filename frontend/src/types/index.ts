export type DocumentStatus =
  | 'uploaded'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'deleting';

export type FileType = 'pdf' | 'docx' | 'txt' | string;

export interface User {
  id: string;
  email: string;
  displayName: string | null;
  photoURL?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Document {
  id: string;
  title: string;
  filename: string;
  originalName: string;
  fileType: FileType;
  fileSize: number;
  status: DocumentStatus;
  pageCount?: number;
  chunkCount?: number;
  storagePath?: string;
  downloadUrl?: string;
  extractedText?: string;
  fileBase64?: string;
  mimeType?: string;
  errorMessage?: string;
  collectionIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  documentCount: number;
  documentIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export type ScopeType = 'all' | 'document' | 'collection';

export interface ConversationScope {
  type: ScopeType;
  documentId?: string;
  collectionId?: string;
}

export interface Citation {
  id: string;
  documentId: string;
  filename: string;
  pageNumber?: number;
  chunkId?: string;
  excerpt: string;
  score?: number;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations?: Citation[];
  createdAt: string;
}

export interface Conversation {
  id: string;
  title: string;
  scope: ConversationScope;
  lastMessageAt?: string;
  messageCount?: number;
  createdAt: string;
  updatedAt: string;
}

export type SummaryType =
  | 'brief'
  | 'detailed'
  | 'bullet'
  | 'executive'
  | 'key_takeaways';

export interface Summary {
  id: string;
  documentId: string;
  documentTitle?: string;
  documentFilename?: string;
  summaryType: SummaryType;
  content: string;
  keyPoints?: string[];
  createdAt: string;
}

export interface ProcessingJob {
  jobId: string;
  documentId: string;
  status: DocumentStatus;
  progress?: number;
  stage?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ChatRequest {
  conversationId?: string;
  message: string;
  scope: ConversationScope;
}

export interface ChatResponse {
  conversationId: string;
  message: Message;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
  details?: Record<string, unknown>;
}

export type ActivityType =
  | 'document_uploaded'
  | 'document_processed'
  | 'conversation_created'
  | 'summary_generated';

export interface ActivityItem {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  targetId: string;
  targetUrl: string;
  timestamp: string;
}

export interface DashboardStats {
  totalDocuments: number;
  totalCollections: number;
  totalConversations: number;
  totalSummaries: number;
}

export interface DocumentUploadResponse {
  document: Document;
  uploadUrl?: string;
  jobId?: string;
}
