# AI Document Assistant — Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        React Frontend                        │
│              (Vite + TypeScript + Tailwind CSS)              │
│                    Hosted on Vercel                          │
└───────────────────────┬─────────────────────────────────────┘
                        │ HTTPS + Firebase ID Token
                        │
┌───────────────────────▼─────────────────────────────────────┐
│                    FastAPI Backend                           │
│                  (Python 3.11+, Uvicorn)                     │
│                   Hosted on Render                           │
│                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │  API Layer  │  │  RAG Pipeline │  │  Background Jobs  │   │
│  │  (FastAPI)  │  │  (Embeddings  │  │  (Processing)     │   │
│  │             │  │   + Retrieval │  │                   │   │
│  │  Auth       │  │   + Generation│  │  Document Extract │   │
│  │  Documents  │  │  )            │  │  Chunk + Embed    │   │
│  │  Collections│  │               │  │  Pinecone Upsert  │   │
│  │  Chat       │  │               │  │                   │   │
│  │  Summaries  │  │               │  │                   │   │
│  └─────────────┘  └──────────────┘  └──────────────────┘   │
└──────┬──────────────────┬──────────────────┬────────────────┘
       │                  │                  │
       ▼                  ▼                  ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐
│   Supabase   │  │  Firebase    │  │      Pinecone        │
│  PostgreSQL  │  │              │  │   Vector Database    │
│              │  │  Auth        │  │                      │
│  users       │  │  Storage     │  │  Document Embeddings │
│  documents   │  │  (PDFs etc)  │  │  Chunk Metadata      │
│  collections │  │              │  │  User Namespaces     │
│  conversations│  │              │  │                      │
│  messages    │  │              │  └──────────┬───────────┘
│  summaries   │  │              │             │
│  jobs        │  │              │             │
└──────────────┘  └──────────────┘             │
                                               ▼
                                    ┌──────────────────────┐
                                    │     Gemini API       │
                                    │   (Google AI Studio) │
                                    │                      │
                                    │  Answer Generation   │
                                    │  Summarization       │
                                    └──────────────────────┘
```

## Data Flow: Document Upload

```
User selects file
      │
      ▼
Frontend validates (size, type)
      │
      ▼
POST /api/documents/upload (with Firebase ID Token)
      │
      ▼
Backend verifies Firebase token
      │
      ▼
Backend validates file content (not just MIME type)
      │
      ▼
Upload to Firebase Storage (private path: users/{uid}/documents/{uuid}/{filename})
      │
      ▼
Create document record in PostgreSQL (status: uploaded)
      │
      ▼
Trigger background processing job
      │
      ├──> Extract text (PyPDF2 / python-docx / plain text)
      │
      ├──> Chunk text (configurable size + overlap)
      │
      ├──> Generate embeddings (Sentence Transformers)
      │
      ├──> Upsert to Pinecone (namespace=user_uid)
      │
      └──> Update document status → completed (or failed)
```

## Data Flow: RAG Question Answering

```
User submits question
      │
      ▼
POST /api/chat (with Firebase ID Token + conversation_id + optional scope)
      │
      ▼
Backend verifies Firebase token
      │
      ▼
Verify conversation ownership in PostgreSQL
      │
      ▼
Generate query embedding (Sentence Transformers)
      │
      ▼
Search Pinecone (namespace=uid, metadata filter: document_id or collection_id)
      │
      ▼
Filter by relevance threshold
      │
      ├── No relevant chunks? → Return "insufficient evidence" response
      │
      ▼
Construct prompt with:
  - System instruction (answer from evidence only)
  - Retrieved chunks (wrapped in delimiters for injection protection)
  - Recent conversation history
  - User question
      │
      ▼
Call Gemini API (backend only — no API key in browser)
      │
      ▼
Validate citations against actual retrieved chunks
      │
      ▼
Save question + answer + citations to PostgreSQL
      │
      ▼
Return answer + validated citations to frontend
```

## Security Model

| Concern | Mitigation |
|---------|------------|
| Authentication | Firebase ID Token verified on every request |
| Authorization | Server-side ownership checks on all resources |
| Data Isolation | Pinecone namespace = verified UID |
| File Access | Signed URLs (60 min expiry), never public |
| Secrets | API keys only on backend, never in browser |
| Prompt Injection | Document text wrapped in XML delimiters |
| File Validation | Content inspection, not just MIME type |
| Rate Limiting | slowapi middleware on backend |
| CORS | Allowlist of frontend origins only |

## Cloud Services Required

| Service | Purpose | Cost Tier |
|---------|---------|-----------|
| Firebase Auth | User authentication | Free Spark plan |
| Firebase Storage | Document file storage | Free Spark plan (5GB) |
| Supabase | PostgreSQL database | Free tier (500MB) |
| Pinecone | Vector database | Free Starter (1 index) |
| Google AI (Gemini) | LLM for answers/summaries | Free tier / Pay-as-you-go |
| Vercel | Frontend hosting | Free Hobby plan |
| Render | Backend hosting | Free tier (with cold starts) |

## Embedding Model

- Model: `all-MiniLM-L6-v2` (default, configurable)
- Dimensions: 384
- Pinecone index dimension must match: 384
- Same model used for both indexing and retrieval
