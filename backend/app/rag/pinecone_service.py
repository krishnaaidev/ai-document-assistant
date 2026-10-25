import logging
from typing import List, Optional, Dict, Any
from dataclasses import dataclass
import numpy as np
from app.core.config import get_settings
from app.rag.embeddings import embedding_service
from app.rag.document_processor import DocumentChunk

logger = logging.getLogger(__name__)


@dataclass
class SearchResult:
    chunk_id: str
    document_id: str
    filename: str
    text: str
    score: float
    page_num: Optional[int]
    chunk_index: Optional[int]


class PineconeService:
    def __init__(self):
        self.settings = get_settings()
        self._client = None
        self._index = None
        # In-memory vector store fallback for testing/offline use:
        # { namespace: { id: (embedding_list, metadata_dict) } }
        self._in_memory_store: Dict[str, Dict[str, Tuple[List[float], Dict[str, Any]]]] = {}

    def _get_index(self):
        if self._index is not None:
            return self._index

        api_key = self.settings.PINECONE_API_KEY
        if not api_key:
            logger.warning("PINECONE_API_KEY not configured. Using in-memory fallback vector store.")
            return None

        try:
            from pinecone import Pinecone, ServerlessSpec
            self._client = Pinecone(api_key=api_key)
            index_name = self.settings.PINECONE_INDEX_NAME

            # Check if index exists
            existing_indexes = [idx["name"] for idx in self._client.list_indexes()]
            if index_name not in existing_indexes:
                logger.info("Creating Pinecone index: %s", index_name)
                try:
                    self._client.create_index(
                        name=index_name,
                        dimension=embedding_service.dimension,
                        metric="cosine",
                        spec=ServerlessSpec(
                            cloud=self.settings.PINECONE_CLOUD,
                            region=self.settings.PINECONE_REGION,
                        ),
                    )
                except Exception as e:
                    logger.warning("Could not create Pinecone index: %s", e)

            self._index = self._client.Index(index_name)
            logger.info("Pinecone index '%s' connected successfully", index_name)
            return self._index
        except Exception as e:
            logger.warning("Failed to initialize Pinecone client: %s. Using in-memory fallback.", e)
            return None

    def upsert_chunks(
        self,
        chunks: List[DocumentChunk],
        owner_uid: str,
        document_id: str,
        filename: str,
        collection_id: Optional[str] = None,
    ) -> int:
        """
        Embed and upsert document chunks into Pinecone under namespace=owner_uid.
        """
        if not chunks:
            return 0

        # Generate embeddings
        texts = [c.text for c in chunks]
        embeddings = embedding_service.embed_batch(texts)

        vectors = []
        for chunk, emb in zip(chunks, embeddings):
            metadata = {
                "chunk_id": chunk.chunk_id,
                "owner_uid": owner_uid,
                "document_id": str(document_id),
                "filename": filename,
                "page_num": chunk.page_num,
                "chunk_index": chunk.chunk_index,
                "collection_id": str(collection_id) if collection_id else "",
                "text": chunk.text[:1000],  # Pinecone metadata size considerations
            }
            vectors.append({
                "id": chunk.chunk_id,
                "values": emb,
                "metadata": metadata,
            })

        index = self._get_index()
        if index is not None:
            try:
                # Upsert in batches of 100
                batch_size = 100
                for i in range(0, len(vectors), batch_size):
                    batch = vectors[i:i + batch_size]
                    index.upsert(vectors=batch, namespace=owner_uid)
                logger.info("Successfully upserted %d chunks to Pinecone for doc %s", len(vectors), document_id)
                return len(vectors)
            except Exception as e:
                logger.error("Error upserting to Pinecone: %s. Storing in memory fallback.", e)

        # In-memory fallback
        if owner_uid not in self._in_memory_store:
            self._in_memory_store[owner_uid] = {}
        for v in vectors:
            self._in_memory_store[owner_uid][v["id"]] = (v["values"], v["metadata"])
        logger.info("Upserted %d vectors to in-memory store for namespace %s", len(vectors), owner_uid)
        return len(vectors)

    def search_similar(
        self,
        query_embedding: List[float],
        owner_uid: str,
        top_k: Optional[int] = None,
        document_id: Optional[str] = None,
        collection_id: Optional[str] = None,
    ) -> List[SearchResult]:
        """
        Search similar chunks in namespace=owner_uid with optional filtering.
        """
        k = top_k or self.settings.TOP_K
        threshold = self.settings.RELEVANCE_THRESHOLD
        results: List[SearchResult] = []

        filter_dict: Dict[str, Any] = {}
        if document_id:
            filter_dict["document_id"] = str(document_id)
        if collection_id:
            filter_dict["collection_id"] = str(collection_id)

        index = self._get_index()
        if index is not None:
            try:
                query_kwargs = {
                    "vector": query_embedding,
                    "top_k": k,
                    "namespace": owner_uid,
                    "include_metadata": True,
                }
                if filter_dict:
                    query_kwargs["filter"] = filter_dict

                response = index.query(**query_kwargs)
                for match in response.get("matches", []):
                    score = float(match.get("score", 0.0))
                    if score >= threshold:
                        meta = match.get("metadata", {})
                        results.append(
                            SearchResult(
                                chunk_id=meta.get("chunk_id", match.get("id")),
                                document_id=meta.get("document_id", ""),
                                filename=meta.get("filename", ""),
                                text=meta.get("text", ""),
                                score=score,
                                page_num=int(meta.get("page_num")) if meta.get("page_num") is not None else None,
                                chunk_index=int(meta.get("chunk_index")) if meta.get("chunk_index") is not None else None,
                            )
                        )
                return results
            except Exception as e:
                logger.error("Error querying Pinecone: %s. Using memory fallback.", e)

        # In-memory cosine search fallback
        user_vectors = self._in_memory_store.get(owner_uid, {})
        if not user_vectors:
            return []

        q_vec = np.array(query_embedding, dtype=np.float32)
        q_norm = np.linalg.norm(q_vec)
        if q_norm > 0:
            q_vec = q_vec / q_norm

        scored: List[Tuple[float, Dict[str, Any]]] = []
        for vid, (emb, meta) in user_vectors.items():
            # Apply filters
            if document_id and meta.get("document_id") != str(document_id):
                continue
            if collection_id and meta.get("collection_id") != str(collection_id):
                continue

            v_arr = np.array(emb, dtype=np.float32)
            v_norm = np.linalg.norm(v_arr)
            sim = float(np.dot(q_vec, v_arr) / (q_norm * v_norm)) if (q_norm * v_norm) > 0 else 0.0

            if sim >= threshold:
                scored.append((sim, meta))

        scored.sort(key=lambda x: x[0], reverse=True)
        for sim, meta in scored[:k]:
            results.append(
                SearchResult(
                    chunk_id=meta.get("chunk_id", ""),
                    document_id=meta.get("document_id", ""),
                    filename=meta.get("filename", ""),
                    text=meta.get("text", ""),
                    score=round(sim, 4),
                    page_num=meta.get("page_num"),
                    chunk_index=meta.get("chunk_index"),
                )
            )

        return results

    def delete_document_vectors(self, document_id: str, owner_uid: str) -> bool:
        """
        Delete all vectors associated with a document under namespace=owner_uid.
        """
        doc_id_str = str(document_id)
        index = self._get_index()
        deleted = False

        if index is not None:
            try:
                index.delete(
                    filter={"document_id": {"$eq": doc_id_str}},
                    namespace=owner_uid,
                )
                logger.info("Deleted Pinecone vectors for doc %s in namespace %s", doc_id_str, owner_uid)
                deleted = True
            except Exception as e:
                logger.warning("Error deleting vectors from Pinecone: %s", e)

        # Clean from in-memory fallback
        if owner_uid in self._in_memory_store:
            keys_to_delete = [
                vid for vid, (_, meta) in self._in_memory_store[owner_uid].items()
                if meta.get("document_id") == doc_id_str
            ]
            for k in keys_to_delete:
                del self._in_memory_store[owner_uid][k]
            deleted = True

        return deleted


pinecone_service = PineconeService()
