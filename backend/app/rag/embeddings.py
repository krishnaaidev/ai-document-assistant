import logging
from typing import List, Optional
import numpy as np
from app.core.config import get_settings

logger = logging.getLogger(__name__)


class EmbeddingService:
    _instance: Optional["EmbeddingService"] = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(EmbeddingService, cls).__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if getattr(self, "_initialized", False):
            return
        self.settings = get_settings()
        self.model_name = self.settings.EMBEDDING_MODEL
        self._model = None
        self.dimension = 384  # default for all-MiniLM-L6-v2
        self._initialized = True

    def _get_model(self):
        if self._model is None:
            try:
                from sentence_transformers import SentenceTransformer
                logger.info("Loading sentence-transformers embedding model: %s", self.model_name)
                self._model = SentenceTransformer(self.model_name)
                self.dimension = self._model.get_sentence_embedding_dimension()
                logger.info("Embedding model loaded successfully. Dimension: %d", self.dimension)
            except Exception as e:
                logger.warning("Could not load sentence-transformers model (%s): %s. Using fallback vector generator.", self.model_name, e)
                self._model = None
        return self._model

    def embed_text(self, text: str) -> List[float]:
        """Embed a single text string into a normalized float vector."""
        if not text or not text.strip():
            return [0.0] * self.dimension
        embeddings = self.embed_batch([text])
        return embeddings[0]

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """Embed a batch of text strings into normalized float vectors."""
        if not texts:
            return []

        cleaned_texts = [t.replace("\n", " ").strip() if t else "" for t in texts]
        model = self._get_model()

        if model is not None:
            try:
                embeddings = model.encode(
                    cleaned_texts,
                    normalize_embeddings=True,
                    show_progress_bar=False,
                    convert_to_numpy=True,
                )
                return [vec.tolist() for vec in embeddings]
            except Exception as e:
                logger.error("Error generating embeddings with sentence-transformers: %s", e)

        # Fallback deterministic pseudo-random unit vectors for offline / test environments
        fallback_results: List[List[float]] = []
        for text in cleaned_texts:
            seed = sum(ord(c) for c in text[:100]) if text else 42
            rng = np.random.RandomState(seed % (2**32))
            vec = rng.randn(self.dimension).astype(np.float32)
            norm = np.linalg.norm(vec)
            if norm > 0:
                vec = vec / norm
            fallback_results.append(vec.tolist())
        return fallback_results


embedding_service = EmbeddingService()
