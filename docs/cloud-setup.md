# Cloud Services Setup Guide

This document explains how to configure each required cloud service for the AI Document Assistant.

---

## 1. Firebase (Authentication + Storage)

### Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click **Add project** → Enter name (e.g., `ai-document-assistant`)
3. Disable Google Analytics if not needed → **Create project**

### Enable Authentication

1. In Firebase console → **Authentication** → **Get started**
2. **Sign-in method** tab → Enable **Email/Password**
3. Click **Save**

### Enable Storage

1. **Storage** → **Get started**
2. Choose **Production mode**
3. Select a storage region (e.g., `us-central1`)
4. Go to **Rules** and set:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /users/{userId}/documents/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

> ⚠️ These rules enforce that users can only access their own uploaded documents.

### Get Frontend Config

1. **Project Settings** → **General** → scroll to **Your apps**
2. Click **Add app** → **Web** icon
3. Register the app → copy the `firebaseConfig` object
4. Use these values in `frontend/.env`:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_APP_ID`

### Get Backend Service Account

1. **Project Settings** → **Service accounts**
2. Click **Generate new private key** → **Generate key**
3. Save as `backend/firebase-service-account.json`
4. Set `FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json` in `backend/.env`

> ⚠️ **NEVER** commit `firebase-service-account.json` to Git.

---

## 2. Supabase (PostgreSQL Database)

### Create a Project

1. Go to [Supabase](https://supabase.com/)
2. **New project** → Enter name, set database password, select region
3. Wait for project to provision (~2 minutes)

### Get Connection String

1. **Settings** → **Database** → **Connection string**
2. Select **URI** tab → copy the string
3. Replace `[YOUR-PASSWORD]` with your database password
4. Set as `DATABASE_URL` in `backend/.env`

**Connection string format:**
```
postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

**For production (with connection pooling via PgBouncer):**
```
postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
```

### Run Migrations

After setting `DATABASE_URL`:
```bash
cd backend
alembic upgrade head
```

---

## 3. Pinecone (Vector Database)

### Create an Account and Index

1. Go to [Pinecone](https://app.pinecone.io/)
2. Create an account → **Create Index**
3. Configure:
   - **Name**: `ai-document-assistant`
   - **Dimensions**: `384` (for `all-MiniLM-L6-v2`)
   - **Metric**: `cosine`
   - **Cloud**: `AWS` (or your preferred)
   - **Region**: `us-east-1` (or closest to your backend)
4. Select **Serverless** tier (free)

### Get API Key

1. **API Keys** tab → copy the default API key
2. Set in `backend/.env`:
   - `PINECONE_API_KEY=...`
   - `PINECONE_INDEX_NAME=ai-document-assistant`
   - `PINECONE_CLOUD=aws`
   - `PINECONE_REGION=us-east-1`

> ⚠️ If you change the embedding model, you must recreate the index with the correct dimension.

| Embedding Model | Dimension |
|---|---|
| `all-MiniLM-L6-v2` | 384 |
| `all-mpnet-base-v2` | 768 |
| `multi-qa-MiniLM-L6-cos-v1` | 384 |

---

## 4. Gemini API (Google AI)

### Get an API Key

1. Go to [Google AI Studio](https://aistudio.google.com/)
2. **Get API key** → **Create API key**
3. Copy the key
4. Set in `backend/.env`:
   - `GEMINI_API_KEY=...`
   - `GEMINI_MODEL=gemini-1.5-flash`

### Available Models

| Model | Speed | Cost | Notes |
|---|---|---|---|
| `gemini-1.5-flash` | Fast | Low | Recommended default |
| `gemini-1.5-pro` | Slower | Higher | Better quality |
| `gemini-2.0-flash` | Fastest | Lowest | Latest |

---

## 5. Vercel (Frontend Hosting)

### Deploy

1. Go to [Vercel](https://vercel.com/)
2. **Import project** → connect your GitHub repo
3. Set **Root Directory**: `frontend`
4. Set **Build Command**: `npm run build`
5. Set **Output Directory**: `dist`
6. **Environment Variables**: add all `VITE_*` variables from `frontend/.env.example`
7. **Deploy**

### After Deployment

- Copy your Vercel URL (e.g., `https://ai-document-assistant.vercel.app`)
- Add it to `backend/.env`: `CORS_ORIGINS=https://ai-document-assistant.vercel.app`
- Redeploy backend

---

## 6. Render (Backend Hosting)

### Deploy

1. Go to [Render](https://render.com/)
2. **New** → **Web Service** → connect GitHub repo
3. Configure:
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. **Environment Variables**: add all backend variables from `backend/.env.example`
5. Upload `firebase-service-account.json` content as a secret file or environment variable
6. **Create Web Service**

### Firebase Service Account on Render

Option A — File: Upload `firebase-service-account.json` as a Render **Secret File** at path `/etc/secrets/firebase-service-account.json` and set:
```
FIREBASE_SERVICE_ACCOUNT_PATH=/etc/secrets/firebase-service-account.json
```

Option B — Env var: Set the entire JSON as `FIREBASE_SERVICE_ACCOUNT_JSON` and update the Firebase initialization code to read from this env var instead of a file path.

### After Deployment

- Copy your Render URL (e.g., `https://ai-document-assistant-api.onrender.com`)
- Add it to `frontend/.env` → `VITE_API_BASE_URL=https://ai-document-assistant-api.onrender.com`
- Redeploy frontend on Vercel

---

## Environment Variables Checklist

### Backend (`backend/.env`)

| Variable | Required | Example |
|---|---|---|
| `DATABASE_URL` | ✅ | `postgresql://postgres:pass@db.xxx.supabase.co:5432/postgres` |
| `GEMINI_API_KEY` | ✅ | `AIzaSy...` |
| `GEMINI_MODEL` | ✅ | `gemini-1.5-flash` |
| `PINECONE_API_KEY` | ✅ | `pcsk_...` |
| `PINECONE_INDEX_NAME` | ✅ | `ai-document-assistant` |
| `PINECONE_CLOUD` | ✅ | `aws` |
| `PINECONE_REGION` | ✅ | `us-east-1` |
| `EMBEDDING_MODEL` | ✅ | `all-MiniLM-L6-v2` |
| `FIREBASE_PROJECT_ID` | ✅ | `ai-doc-assistant-12345` |
| `FIREBASE_STORAGE_BUCKET` | ✅ | `ai-doc-assistant-12345.appspot.com` |
| `FIREBASE_SERVICE_ACCOUNT_PATH` | ✅ | `./firebase-service-account.json` |
| `CORS_ORIGINS` | ✅ | `http://localhost:5173,https://your-app.vercel.app` |
| `MAX_UPLOAD_SIZE_MB` | ✅ | `20` |
| `TOP_K` | ✅ | `5` |
| `CHUNK_SIZE` | ✅ | `1000` |
| `CHUNK_OVERLAP` | ✅ | `200` |
| `RELEVANCE_THRESHOLD` | ✅ | `0.5` |

### Frontend (`frontend/.env`)

| Variable | Required | Example |
|---|---|---|
| `VITE_API_BASE_URL` | ✅ | `http://localhost:8000` |
| `VITE_FIREBASE_API_KEY` | ✅ | `AIzaSy...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | ✅ | `project.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | ✅ | `project-id` |
| `VITE_FIREBASE_STORAGE_BUCKET` | ✅ | `project.appspot.com` |
| `VITE_FIREBASE_APP_ID` | ✅ | `1:123:web:abc` |
