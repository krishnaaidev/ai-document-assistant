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
        # Ensure the blob is NOT publicly accessible
        blob.make_private()
        logger.info(f"Uploaded file to Firebase Storage: {storage_path}")
        return storage_path
    except Exception as e:
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
    except Exception as e:
        logger.error(f"Failed to generate signed URL for {storage_path}: {e}")
        raise


async def get_file_bytes(storage_path: str) -> bytes:
    """Download a file from Firebase Storage and return its bytes."""
    try:
        bucket = get_storage_bucket()
        blob = bucket.blob(storage_path)
        file_bytes = blob.download_as_bytes()
        return file_bytes
    except Exception as e:
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
        logger.warning(f"Firebase Storage delete failed for {storage_path}: {e}")
        # Don't re-raise — deletion failures during cleanup should not crash the deletion flow.
        # Log them for operator review.
