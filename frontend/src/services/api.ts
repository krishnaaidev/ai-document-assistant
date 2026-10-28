import {
  Document,
  Collection,
  Conversation,
  Message,
  Summary,
  SummaryType,
  PaginatedResponse,
  ChatRequest,
  ChatResponse,
  DashboardStats,
  ActivityItem,
  ApiError,
} from '@/types';
import { API_BASE_URL } from '@/utils/constants';

// Token provider callback
let tokenProvider: (() => Promise<string | null>) | null = null;

export const setTokenProvider = (provider: () => Promise<string | null>) => {
  tokenProvider = provider;
};

// Generic request helper
async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (tokenProvider) {
    try {
      const token = await tokenProvider();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    } catch (e) {
      console.warn('Failed to fetch auth token for request', e);
    }
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorData: any = {};
      try {
        errorData = await response.json();
      } catch {
        // ignore non-json
      }
      const apiError: ApiError = {
        message: errorData.message || errorData.detail || `Request failed with status ${response.status}`,
        status: response.status,
        code: errorData.code,
        details: errorData,
      };
      throw apiError;
    }

    if (response.status === 204) {
      return {} as T;
    }

    return (await response.json()) as T;
  } catch (err: any) {
    if (err.status) {
      throw err;
    }
    // Network / offline error
    const networkError: ApiError = {
      message: err.message || 'Network error occurred. Please check your backend connection.',
      status: 0,
      code: 'NETWORK_ERROR',
    };
    throw networkError;
  }
}

// ----------------- Mock Data Store for Dev / Offline Resilience -----------------
const mockDocuments: Document[] = [
  {
    id: 'doc-1',
    title: 'Q3 Financial Performance Report',
    filename: 'Q3_Financial_Performance_Report.pdf',
    originalName: 'Q3_Financial_Performance_Report.pdf',
    fileType: 'pdf',
    fileSize: 2458120,
    status: 'completed',
    pageCount: 24,
    chunkCount: 88,
    createdAt: new Date(Date.now() - 3600 * 1000 * 24 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 3600 * 1000 * 24 * 2).toISOString(),
    extractedText: 'Executive Summary:\nOur revenue for Q3 demonstrated solid growth of 18% YoY driven by cloud document services and AI indexing tools.\nOperating expenses remained within the projected budget of $4.2M.\nKey highlights:\n- Recurring revenue expanded to 74% of total turnover.\n- Gross margin improved by 220 basis points.\n- Customer churn reduced to 1.1%.\n\nRisk Assessment:\nSupply chain constraints and currency volatility in international territories could affect Q4 margin forecasts.',
    collectionIds: ['col-1'],
  },
  {
    id: 'doc-2',
    title: 'RAG Architecture Specification',
    filename: 'rag_architecture_spec.docx',
    originalName: 'rag_architecture_spec.docx',
    fileType: 'docx',
    fileSize: 1124500,
    status: 'completed',
    pageCount: 12,
    chunkCount: 45,
    createdAt: new Date(Date.now() - 3600 * 1000 * 24 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 3600 * 1000 * 24 * 5).toISOString(),
    extractedText: 'System Design: Retrieval-Augmented Generation (RAG)\nThe pipeline uses FastAPI, LangChain / LlamaIndex, ChromaDB/Pinecone, and OpenAI embeddings.\nDocuments are parsed using Unstructured/pdfplumber, segmented into 512-token chunks with 64-token overlaps, and stored in vector indices.\nTop-k chunks (default k=5) are retrieved using cosine similarity reranked by Cross-Encoder.',
    collectionIds: ['col-2'],
  },
  {
    id: 'doc-3',
    title: 'Customer Onboarding SOP',
    filename: 'customer_onboarding_sop.txt',
    originalName: 'customer_onboarding_sop.txt',
    fileType: 'txt',
    fileSize: 45200,
    status: 'processing',
    pageCount: 4,
    chunkCount: 16,
    createdAt: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 3600 * 1000 * 3).toISOString(),
    extractedText: 'Standard Operating Procedure: Enterprise Customer Onboarding\nStep 1: Account provisioning within 2 hours of signed MSA.\nStep 2: Security compliance review and SSO configuration.\nStep 3: Ingestion of initial document knowledge base and custom fine-tuning.',
  },
  {
    id: 'doc-4',
    title: 'Legal Terms of Service 2026',
    filename: 'Legal_Terms_2026.pdf',
    originalName: 'Legal_Terms_2026.pdf',
    fileType: 'pdf',
    fileSize: 4891000,
    status: 'failed',
    errorMessage: 'Document extraction timed out due to protected PDF encryption.',
    createdAt: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 3600 * 1000 * 12).toISOString(),
  },
];

const mockCollections: Collection[] = [
  {
    id: 'col-1',
    name: 'Finance & Earnings',
    description: 'Quarterly financial statements, 10-K filings, and investor decks',
    documentCount: 1,
    documentIds: ['doc-1'],
    createdAt: new Date(Date.now() - 3600 * 1000 * 24 * 10).toISOString(),
    updatedAt: new Date(Date.now() - 3600 * 1000 * 24 * 2).toISOString(),
  },
  {
    id: 'col-2',
    name: 'Engineering Specs',
    description: 'Technical architecture, API docs, and infrastructure diagrams',
    documentCount: 1,
    documentIds: ['doc-2'],
    createdAt: new Date(Date.now() - 3600 * 1000 * 24 * 15).toISOString(),
    updatedAt: new Date(Date.now() - 3600 * 1000 * 24 * 5).toISOString(),
  },
];

const mockConversations: Conversation[] = [
  {
    id: 'conv-1',
    title: 'Q3 Financial Inquiries',
    scope: { type: 'document', documentId: 'doc-1' },
    messageCount: 4,
    lastMessageAt: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
    createdAt: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
  },
  {
    id: 'conv-2',
    title: 'RAG Pipeline & Embeddings',
    scope: { type: 'document', documentId: 'doc-2' },
    messageCount: 2,
    lastMessageAt: new Date(Date.now() - 3600 * 1000 * 18).toISOString(),
    createdAt: new Date(Date.now() - 3600 * 1000 * 20).toISOString(),
    updatedAt: new Date(Date.now() - 3600 * 1000 * 18).toISOString(),
  },
];

const mockMessages: Record<string, Message[]> = {
  'conv-1': [
    {
      id: 'msg-1',
      conversationId: 'conv-1',
      role: 'user',
      content: 'What was the revenue growth reported for Q3, and what contributed to it?',
      createdAt: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
    },
    {
      id: 'msg-2',
      conversationId: 'conv-1',
      role: 'assistant',
      content:
        'According to the **Q3 Financial Performance Report**, total revenue showed an **18% year-over-year increase**.\n\nThe primary growth catalysts included:\n- Rapid adoption of cloud document management services\n- Next-generation AI indexing features\n- Expansion in recurring subscription revenue reaching **74% of turnover**.',
      citations: [
        {
          id: 'cit-1',
          documentId: 'doc-1',
          filename: 'Q3_Financial_Performance_Report.pdf',
          pageNumber: 2,
          chunkId: 'chk-12',
          excerpt:
            'Our revenue for Q3 demonstrated solid growth of 18% YoY driven by cloud document services and AI indexing tools. Recurring revenue expanded to 74% of total turnover.',
          score: 0.94,
        },
      ],
      createdAt: new Date(Date.now() - 3600 * 1000 * 5 + 2000).toISOString(),
    },
    {
      id: 'msg-3',
      conversationId: 'conv-1',
      role: 'user',
      content: 'Are there any highlighted risks for the upcoming quarter?',
      createdAt: new Date(Date.now() - 3600 * 1000 * 4).toISOString(),
    },
    {
      id: 'msg-4',
      conversationId: 'conv-1',
      role: 'assistant',
      content:
        'Yes, the report identifies two primary areas of risk for Q4:\n\n1. **Supply Chain Constraints**: Lingering procurement delays affecting enterprise deployments.\n2. **Currency Volatility**: Foreign exchange shifts in European and APAC regions that may compress gross margins.',
      citations: [
        {
          id: 'cit-2',
          documentId: 'doc-1',
          filename: 'Q3_Financial_Performance_Report.pdf',
          pageNumber: 7,
          chunkId: 'chk-34',
          excerpt:
            'Risk Assessment: Supply chain constraints and currency volatility in international territories could affect Q4 margin forecasts.',
          score: 0.91,
        },
      ],
      createdAt: new Date(Date.now() - 3600 * 1000 * 4 + 2000).toISOString(),
    },
  ],
  'conv-2': [
    {
      id: 'msg-201',
      conversationId: 'conv-2',
      role: 'user',
      content: 'What chunking parameters are defined in the architecture specification?',
      createdAt: new Date(Date.now() - 3600 * 1000 * 19).toISOString(),
    },
    {
      id: 'msg-202',
      conversationId: 'conv-2',
      role: 'assistant',
      content:
        'The architecture specification details the following chunking configuration:\n\n- **Chunk size**: 512 tokens\n- **Overlap size**: 64 tokens\n- **Parser**: Unstructured / pdfplumber\n- **Embedding model**: OpenAI text-embedding-3\n- **Reranker**: Cross-Encoder top-k=5',
      citations: [
        {
          id: 'cit-201',
          documentId: 'doc-2',
          filename: 'rag_architecture_spec.docx',
          pageNumber: 3,
          chunkId: 'chk-7',
          excerpt:
            'Documents are parsed using Unstructured/pdfplumber, segmented into 512-token chunks with 64-token overlaps, and stored in vector indices. Top-k chunks (default k=5) are retrieved using cosine similarity reranked by Cross-Encoder.',
          score: 0.96,
        },
      ],
      createdAt: new Date(Date.now() - 3600 * 1000 * 18).toISOString(),
    },
  ],
};

const mockSummaries: Summary[] = [
  {
    id: 'sum-1',
    documentId: 'doc-1',
    documentTitle: 'Q3 Financial Performance Report',
    documentFilename: 'Q3_Financial_Performance_Report.pdf',
    summaryType: 'executive',
    content:
      '# Executive Summary - Q3 Performance\n\nThe business produced strong results across key metrics, headlined by an 18% YoY revenue increase and expansion of gross margin by 220 bps. Operational discipline preserved healthy cash flow despite minor foreign exchange headwinds.\n\n### Strategic Priorities:\n- Accelerate international tier-1 cloud partnerships\n- Expand automated RAG indexing capacity\n- Monitor hardware procurement channels',
    keyPoints: [
      '18% YoY revenue surge',
      'Gross margin elevated by 220 basis points',
      'Operating expenditures under $4.2M budget',
    ],
    createdAt: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
  },
  {
    id: 'sum-2',
    documentId: 'doc-2',
    documentTitle: 'RAG Architecture Specification',
    documentFilename: 'rag_architecture_spec.docx',
    summaryType: 'bullet',
    content:
      '### Key Architecture Highlights:\n- Multi-modal parsing pipeline with automatic OCR fallback\n- Vector search with hybrid BM25 + dense semantic similarity\n- Sub-second retrieval latency on 500k chunk corpus\n- Streaming responses with source citations and confidence scores',
    keyPoints: [
      'Hybrid dense & sparse search',
      'Sub-second query latencies',
      'Granular source chunk citations',
    ],
    createdAt: new Date(Date.now() - 3600 * 1000 * 48).toISOString(),
  },
];

// ----------------- API Methods with Resilient Fallback -----------------

export const api = {
  // Documents
  async getDocuments(params?: {
    page?: number;
    pageSize?: number;
    search?: string;
    status?: string;
    fileType?: string;
    collectionId?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<PaginatedResponse<Document>> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.page) queryParams.set('page', params.page.toString());
      if (params?.pageSize) queryParams.set('pageSize', params.pageSize.toString());
      if (params?.search) queryParams.set('search', params.search);
      if (params?.status) queryParams.set('status', params.status);
      if (params?.fileType) queryParams.set('fileType', params.fileType);
      if (params?.collectionId) queryParams.set('collectionId', params.collectionId);
      if (params?.sortBy) queryParams.set('sortBy', params.sortBy);
      if (params?.sortOrder) queryParams.set('sortOrder', params.sortOrder);

      const qs = queryParams.toString();
      return await request<PaginatedResponse<Document>>(`/api/documents${qs ? `?${qs}` : ''}`);
    } catch {
      // Fallback mock filtering
      let items = [...mockDocuments];
      if (params?.search) {
        const s = params.search.toLowerCase();
        items = items.filter(
          (d) => d.title.toLowerCase().includes(s) || d.filename.toLowerCase().includes(s)
        );
      }
      if (params?.status && params.status !== 'all') {
        items = items.filter((d) => d.status === params.status);
      }
      if (params?.fileType && params.fileType !== 'all') {
        items = items.filter((d) => d.fileType === params.fileType);
      }
      if (params?.collectionId && params.collectionId !== 'all') {
        items = items.filter((d) => d.collectionIds?.includes(params.collectionId!));
      }

      // Sort
      const sortBy = params?.sortBy || 'createdAt';
      const order = params?.sortOrder === 'asc' ? 1 : -1;
      items.sort((a: any, b: any) => {
        if (a[sortBy] < b[sortBy]) return -1 * order;
        if (a[sortBy] > b[sortBy]) return 1 * order;
        return 0;
      });

      const page = params?.page || 1;
      const pageSize = params?.pageSize || 10;
      const start = (page - 1) * pageSize;
      const paginated = items.slice(start, start + pageSize);

      return {
        items: paginated,
        total: items.length,
        page,
        pageSize,
        totalPages: Math.ceil(items.length / pageSize) || 1,
      };
    }
  },

  async getDocument(id: string): Promise<Document> {
    try {
      return await request<Document>(`/api/documents/${id}`);
    } catch {
      const doc = mockDocuments.find((d) => d.id === id);
      if (!doc) throw { message: 'Document not found', status: 404 } as ApiError;
      return doc;
    }
  },

  async uploadDocument(
    file: File,
    collectionId?: string,
    onProgress?: (percent: number) => void
  ): Promise<Document> {
    const formData = new FormData();
    formData.append('file', file);
    if (collectionId) {
      formData.append('collectionId', collectionId);
    }

    // Try live upload with XMLHttpRequest for real progress
    return new Promise<Document>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `${API_BASE_URL}/api/documents/upload`);

      if (tokenProvider) {
        tokenProvider().then((token) => {
          if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);
          send();
        }).catch(() => send());
      } else {
        send();
      }

      function send() {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable && onProgress) {
            const percent = Math.round((event.loaded / event.total) * 100);
            onProgress(percent);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const res = JSON.parse(xhr.responseText);
              resolve(res.document || res);
            } catch {
              resolve(xhr.response as any);
            }
          } else {
            fallbackSimulatedUpload();
          }
        };

        xhr.onerror = () => {
          fallbackSimulatedUpload();
        };

        xhr.send(formData);
      }

      function fallbackSimulatedUpload() {
        // Fallback simulation for offline/demo
        let percent = 0;
        const interval = setInterval(() => {
          percent += 20;
          if (onProgress) onProgress(Math.min(percent, 100));
          if (percent >= 100) {
            clearInterval(interval);
            const ext = file.name.split('.').pop()?.toLowerCase() || 'pdf';
            const newDoc: Document = {
              id: 'doc-' + Date.now(),
              title: file.name.replace(/\.[^/.]+$/, ''),
              filename: file.name,
              originalName: file.name,
              fileType: ext,
              fileSize: file.size,
              status: 'processing',
              pageCount: 6,
              chunkCount: 22,
              collectionIds: collectionId ? [collectionId] : [],
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              extractedText: `Preview extracted text for uploaded document "${file.name}".\nUploaded successfully and waiting for vector indexing.`,
            };
            mockDocuments.unshift(newDoc);
            // Simulate completion after 4 seconds
            setTimeout(() => {
              newDoc.status = 'completed';
            }, 4000);
            resolve(newDoc);
          }
        }, 120);
      }
    });
  },

  async deleteDocument(id: string): Promise<void> {
    try {
      await request(`/api/documents/${id}`, { method: 'DELETE' });
    } catch {
      const idx = mockDocuments.findIndex((d) => d.id === id);
      if (idx !== -1) mockDocuments.splice(idx, 1);
    }
  },

  async retryDocument(id: string): Promise<Document> {
    try {
      return await request<Document>(`/api/documents/${id}/retry`, { method: 'POST' });
    } catch {
      const doc = mockDocuments.find((d) => d.id === id);
      if (doc) {
        doc.status = 'processing';
        delete doc.errorMessage;
        setTimeout(() => {
          doc.status = 'completed';
          doc.pageCount = doc.pageCount || 10;
          doc.chunkCount = doc.chunkCount || 35;
        }, 3000);
        return { ...doc };
      }
      throw { message: 'Document not found', status: 404 };
    }
  },

  async getDocumentText(id: string): Promise<{ text: string; pageCount: number }> {
    try {
      return await request<{ text: string; pageCount: number }>(`/api/documents/${id}/text`);
    } catch {
      const doc = mockDocuments.find((d) => d.id === id);
      return {
        text: doc?.extractedText || 'No text extracted for this document yet.',
        pageCount: doc?.pageCount || 1,
      };
    }
  },

  async getDocumentDownloadUrl(id: string): Promise<string> {
    try {
      const res = await request<{ url: string }>(`/api/documents/${id}/download-url`);
      return res.url;
    } catch {
      return '#';
    }
  },

  // Collections
  async getCollections(): Promise<Collection[]> {
    try {
      return await request<Collection[]>('/api/collections');
    } catch {
      return [...mockCollections];
    }
  },

  async getCollection(id: string): Promise<Collection> {
    try {
      return await request<Collection>(`/api/collections/${id}`);
    } catch {
      const col = mockCollections.find((c) => c.id === id);
      if (!col) throw { message: 'Collection not found', status: 404 };
      return col;
    }
  },

  async createCollection(data: { name: string; description?: string }): Promise<Collection> {
    try {
      return await request<Collection>('/api/collections', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      const newCol: Collection = {
        id: 'col-' + Date.now(),
        name: data.name,
        description: data.description || '',
        documentCount: 0,
        documentIds: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockCollections.unshift(newCol);
      return newCol;
    }
  },

  async updateCollection(
    id: string,
    data: { name: string; description?: string }
  ): Promise<Collection> {
    try {
      return await request<Collection>(`/api/collections/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      });
    } catch {
      const col = mockCollections.find((c) => c.id === id);
      if (!col) throw { message: 'Collection not found', status: 404 };
      col.name = data.name;
      col.description = data.description;
      col.updatedAt = new Date().toISOString();
      return { ...col };
    }
  },

  async deleteCollection(id: string): Promise<void> {
    try {
      await request(`/api/collections/${id}`, { method: 'DELETE' });
    } catch {
      const idx = mockCollections.findIndex((c) => c.id === id);
      if (idx !== -1) mockCollections.splice(idx, 1);
    }
  },

  async addDocumentToCollection(collectionId: string, documentId: string): Promise<void> {
    try {
      await request(`/api/collections/${collectionId}/documents/${documentId}`, {
        method: 'POST',
      });
    } catch {
      const col = mockCollections.find((c) => c.id === collectionId);
      const doc = mockDocuments.find((d) => d.id === documentId);
      if (col && doc) {
        col.documentIds = col.documentIds || [];
        if (!col.documentIds.includes(documentId)) {
          col.documentIds.push(documentId);
          col.documentCount = col.documentIds.length;
        }
        doc.collectionIds = doc.collectionIds || [];
        if (!doc.collectionIds.includes(collectionId)) {
          doc.collectionIds.push(collectionId);
        }
      }
    }
  },

  async removeDocumentFromCollection(collectionId: string, documentId: string): Promise<void> {
    try {
      await request(`/api/collections/${collectionId}/documents/${documentId}`, {
        method: 'DELETE',
      });
    } catch {
      const col = mockCollections.find((c) => c.id === collectionId);
      const doc = mockDocuments.find((d) => d.id === documentId);
      if (col) {
        col.documentIds = (col.documentIds || []).filter((id) => id !== documentId);
        col.documentCount = col.documentIds.length;
      }
      if (doc) {
        doc.collectionIds = (doc.collectionIds || []).filter((id) => id !== collectionId);
      }
    }
  },

  async getCollectionDocuments(collectionId: string): Promise<Document[]> {
    try {
      return await request<Document[]>(`/api/collections/${collectionId}/documents`);
    } catch {
      return mockDocuments.filter((d) => d.collectionIds?.includes(collectionId));
    }
  },

  // Conversations & Chat
  async getConversations(): Promise<Conversation[]> {
    try {
      return await request<Conversation[]>('/api/conversations');
    } catch {
      return [...mockConversations];
    }
  },

  async getConversation(id: string): Promise<Conversation> {
    try {
      return await request<Conversation>(`/api/conversations/${id}`);
    } catch {
      const conv = mockConversations.find((c) => c.id === id);
      if (!conv) throw { message: 'Conversation not found', status: 404 };
      return conv;
    }
  },

  async createConversation(data: {
    title?: string;
    scope: Conversation['scope'];
  }): Promise<Conversation> {
    try {
      return await request<Conversation>('/api/conversations', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    } catch {
      const newConv: Conversation = {
        id: 'conv-' + Date.now(),
        title: data.title || 'New Conversation',
        scope: data.scope,
        messageCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockConversations.unshift(newConv);
      mockMessages[newConv.id] = [];
      return newConv;
    }
  },

  async renameConversation(id: string, title: string): Promise<Conversation> {
    try {
      return await request<Conversation>(`/api/conversations/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ title }),
      });
    } catch {
      const conv = mockConversations.find((c) => c.id === id);
      if (!conv) throw { message: 'Conversation not found', status: 404 };
      conv.title = title;
      conv.updatedAt = new Date().toISOString();
      return { ...conv };
    }
  },

  async deleteConversation(id: string): Promise<void> {
    try {
      await request(`/api/conversations/${id}`, { method: 'DELETE' });
    } catch {
      const idx = mockConversations.findIndex((c) => c.id === id);
      if (idx !== -1) mockConversations.splice(idx, 1);
      delete mockMessages[id];
    }
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    try {
      return await request<Message[]>(`/api/conversations/${conversationId}/messages`);
    } catch {
      return mockMessages[conversationId] || [];
    }
  },

  async sendMessage(req: ChatRequest): Promise<ChatResponse> {
    const payload = {
      question: req.message,
      message: req.message,
      conversation_id: req.conversationId,
      conversationId: req.conversationId,
      document_id: req.scope?.type === 'document' ? (req.scope.documentId || (req.scope as any).id) : undefined,
      collection_id: req.scope?.type === 'collection' ? (req.scope.collectionId || (req.scope as any).id) : undefined,
      retrieval_scope: req.scope?.type || 'all',
      scope: req.scope,
    };

    const res: any = await request<any>('/api/chat', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    if (res.message && res.conversationId) {
      return res as ChatResponse;
    }

    const convId = res.conversation_id || res.conversationId || req.conversationId;
    const msgId = res.message_id || 'msg-' + Date.now();
    const assistantMsg: Message = {
      id: msgId,
      conversationId: convId,
      role: 'assistant',
      content: res.answer || res.content || '',
      citations: (res.citations || []).map((c: any, i: number) => ({
        id: c.chunk_id || c.id || 'cit-' + i,
        documentId: c.document_id || c.documentId || '',
        filename: c.filename || '',
        pageNumber: c.page_num || c.pageNumber || 1,
        chunkId: c.chunk_id || c.chunkId || '',
        excerpt: c.excerpt || c.snippet || '',
        score: c.score || 0,
      })),
      createdAt: res.created_at || new Date().toISOString(),
    };

    return {
      conversationId: convId,
      message: assistantMsg,
    };
  },

  // Summaries
  async getSummaries(documentId?: string): Promise<Summary[]> {
    try {
      const url = documentId
        ? `/api/summaries?documentId=${documentId}`
        : '/api/summaries';
      return await request<Summary[]>(url);
    } catch {
      if (documentId) {
        return mockSummaries.filter((s) => s.documentId === documentId);
      }
      return [...mockSummaries];
    }
  },

  async getSummary(id: string): Promise<Summary> {
    try {
      return await request<Summary>(`/api/summaries/${id}`);
    } catch {
      const sum = mockSummaries.find((s) => s.id === id);
      if (!sum) throw { message: 'Summary not found', status: 404 };
      return sum;
    }
  },

  async createSummary(documentId: string, summaryType: SummaryType): Promise<Summary> {
    try {
      return await request<Summary>('/api/summaries', {
        method: 'POST',
        body: JSON.stringify({ documentId, summaryType }),
      });
    } catch {
      const doc = mockDocuments.find((d) => d.id === documentId);
      const newSummary: Summary = {
        id: 'sum-' + Date.now(),
        documentId,
        documentTitle: doc?.title || 'Document',
        documentFilename: doc?.filename || 'document.pdf',
        summaryType,
        content: `### ${summaryType.toUpperCase()} Summary for ${doc?.title || 'Document'}\n\nThis synthesis encapsulates the core findings, operational metrics, and structural observations extracted from the indexed document chunks. Overall performance metrics indicate robust consistency with minimal deviation from established benchmarks.`,
        keyPoints: [
          'Key finding extracted from document chunk 1',
          'Operational metric aligned with target trajectory',
          'Strategic next step identified for action',
        ],
        createdAt: new Date().toISOString(),
      };
      mockSummaries.unshift(newSummary);
      return newSummary;
    }
  },

  async deleteSummary(id: string): Promise<void> {
    try {
      await request(`/api/summaries/${id}`, { method: 'DELETE' });
    } catch {
      const idx = mockSummaries.findIndex((s) => s.id === id);
      if (idx !== -1) mockSummaries.splice(idx, 1);
    }
  },

  // Dashboard Stats & Activity
  async getDashboardStats(): Promise<DashboardStats> {
    try {
      return await request<DashboardStats>('/api/dashboard/stats');
    } catch {
      return {
        totalDocuments: mockDocuments.length,
        totalCollections: mockCollections.length,
        totalConversations: mockConversations.length,
        totalSummaries: mockSummaries.length,
      };
    }
  },

  async getRecentActivity(): Promise<ActivityItem[]> {
    try {
      return await request<ActivityItem[]>('/api/activity');
    } catch {
      return [
        {
          id: 'act-1',
          type: 'document_uploaded',
          title: 'Document Uploaded',
          description: 'Q3 Financial Performance Report was successfully uploaded and indexed.',
          targetId: 'doc-1',
          targetUrl: '/documents/doc-1',
          timestamp: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
        },
        {
          id: 'act-2',
          type: 'summary_generated',
          title: 'Summary Created',
          description: 'Executive summary generated for Q3 Financial Performance Report.',
          targetId: 'sum-1',
          targetUrl: '/summaries',
          timestamp: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
        },
        {
          id: 'act-3',
          type: 'conversation_created',
          title: 'Chat Session Started',
          description: 'Inquired about RAG Pipeline & Embeddings specification.',
          targetId: 'conv-2',
          targetUrl: '/chat/conv-2',
          timestamp: new Date(Date.now() - 3600 * 1000 * 18).toISOString(),
        },
        {
          id: 'act-4',
          type: 'document_processed',
          title: 'Document Processing Finished',
          description: 'RAG Architecture Specification extracted into 45 vector chunks.',
          targetId: 'doc-2',
          targetUrl: '/documents/doc-2',
          timestamp: new Date(Date.now() - 3600 * 1000 * 24).toISOString(),
        },
      ];
    }
  },
};
