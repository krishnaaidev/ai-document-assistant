import logging
import os
from functools import lru_cache

import firebase_admin
from firebase_admin import credentials, storage

from app.core.config import get_settings

logger = logging.getLogger(__name__)
settings = get_settings()

_firebase_app = None


def initialize_firebase() -> firebase_admin.App:
    """Initialize Firebase Admin SDK. Safe to call multiple times."""
    global _firebase_app

    if _firebase_app is not None:
        return _firebase_app

    if firebase_admin._apps:
        _firebase_app = firebase_admin.get_app()
        return _firebase_app

    # Try service account file first, then environment variable
    service_account_path = settings.FIREBASE_SERVICE_ACCOUNT_PATH
    service_account_json_str = os.environ.get("FIREBASE_SERVICE_ACCOUNT_JSON")

    try:
        if service_account_json_str:
            import json
            sa_dict = json.loads(service_account_json_str)
            cred = credentials.Certificate(sa_dict)
            logger.info("Firebase: using service account from FIREBASE_SERVICE_ACCOUNT_JSON env var.")
        elif service_account_path and os.path.isfile(service_account_path):
            cred = credentials.Certificate(service_account_path)
            logger.info(f"Firebase: using service account from file: {service_account_path}")
        else:
            # Fall back to Application Default Credentials (for Cloud Run / GKE)
            cred = credentials.ApplicationDefault()
            logger.info("Firebase: using Application Default Credentials.")

        _firebase_app = firebase_admin.initialize_app(
            cred,
            {
                "storageBucket": settings.FIREBASE_STORAGE_BUCKET,
                "projectId": settings.FIREBASE_PROJECT_ID,
            },
        )
        logger.info(f"Firebase Admin SDK initialized for project: {settings.FIREBASE_PROJECT_ID}")
        return _firebase_app

    except Exception as e:
        logger.error(f"Failed to initialize Firebase Admin SDK: {e}")
        raise


def get_firebase_app() -> firebase_admin.App:
    """Return the initialized Firebase app, initializing if necessary."""
    global _firebase_app
    if _firebase_app is None:
        initialize_firebase()
    return _firebase_app


def get_storage_bucket():
    """Return the Firebase Storage bucket handle."""
    get_firebase_app()
    return storage.bucket(settings.FIREBASE_STORAGE_BUCKET)
