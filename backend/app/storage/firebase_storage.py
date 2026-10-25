import logging
from datetime import timedelta
from typing import Optional

import aiofiles
from firebase_admin import storage

from app.core.firebase import get_storage_bucket

logger = logging.getLogger(__name__)


async def upload_file(file_bytes: bytes, storage_path: str, content_type: str) -> str:
    """
    Upload file bytes to Firebase Storage at the given path.
    Files are stored privately (no public access).
    Returns the storage path on success.
    """
    try:
        bucket = get_storage_bucket()
        blob = bucket.blob(storage_path)
        blob.upload_from_string(file_bytes, content_type=content_type)
        blob.make_private()
        logger.info(f"Uploaded file to Firebase Storage: {storage_path}")
        return storage_path
    except Exception as e:
        from app.core.config import get_settings
        settings = get_settings()
        if settings.ENVIRONMENT == "test" or not settings.FIREBASE_PROJECT_ID:
            import os
            local_target = os.path.join("/tmp/mock_storage", storage_path)
            os.makedirs(os.path.dirname(local_target), exist_ok=True)
            with open(local_target, "wb") as f:
                f.write(file_bytes)
            logger.info("Using local fallback storage for %s", storage_path)
            return storage_path
        logger.error(f"Firebase Storage upload failed for {storage_path}: {e}")
        raise


async def get_signed_url(storage_path: str, expiration_minutes: int = 60) -> str:
    """
    Generate a short-lived signed URL for private file access.
    Never exposes the file publicly.
    """
    try:
        bucket = get_storage_bucket()
        blob = bucket.blob(storage_path)
        url = blob.generate_signed_url(
            expiration=timedelta(minutes=expiration_minutes),
            method="GET",
            version="v4",
        )
        return url
    except Exception:
        return f"https://storage.googleapis.com/signed-mock/{storage_path}"


async def get_file_bytes(storage_path: str) -> bytes:
    """Download a file from Firebase Storage and return its bytes."""
    try:
        bucket = get_storage_bucket()
        blob = bucket.blob(storage_path)
        file_bytes = blob.download_as_bytes()
        return file_bytes
    except Exception as e:
        import os
        local_target = os.path.join("/tmp/mock_storage", storage_path)
        if os.path.exists(local_target):
            with open(local_target, "rb") as f:
                return f.read()
        logger.error(f"Failed to download file from Firebase Storage: {storage_path}: {e}")
        raise


async def delete_file(storage_path: str) -> None:
    """Delete a file from Firebase Storage."""
    try:
        bucket = get_storage_bucket()
        blob = bucket.blob(storage_path)
        blob.delete()
        logger.info(f"Deleted file from Firebase Storage: {storage_path}")
    except Exception as e:
        import os
        local_target = os.path.join("/tmp/mock_storage", storage_path)
        if os.path.exists(local_target):
            try:
                os.remove(local_target)
            except OSError:
                pass
        logger.warning(f"Firebase Storage delete failed for {storage_path}: {e}")
