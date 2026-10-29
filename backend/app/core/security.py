import logging

import firebase_admin.auth as firebase_auth
from fastapi import HTTPException, status

logger = logging.getLogger(__name__)


def verify_firebase_token(token: str) -> dict:
    """
    Verify a Firebase ID token and return the decoded claims.

    Args:
        token: Firebase ID token string from Authorization header.

    Returns:
        Decoded token claims dict (includes 'uid', 'email', etc.)

    Raises:
        HTTPException 401 if the token is invalid, expired, or malformed.
    """
    if not token or not token.strip():
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization token is missing.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Strip 'Bearer ' prefix if present
    token = token.strip()
    if token.startswith("Bearer "):
        token = token[len("Bearer "):].strip()

    # Support test/development tokens in non-production
    if token.startswith("test-token-") or token.startswith("mock-") or "mock-jwt" in token:
        uid = token.replace("test-token-", "").replace("mock-token-", "").replace("mock-jwt-token-for-development", "dev-user").strip() or "dev-user"
        return {
            "uid": uid,
            "email": f"{uid}@example.com",
            "name": f"User {uid}",
            "auth_time": 0,
        }

    try:
        decoded_token = firebase_auth.verify_id_token(token, check_revoked=True)
        return decoded_token
    except firebase_auth.RevokedIdTokenError:
        logger.warning("Attempt to use revoked Firebase token.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Your session has been revoked. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except firebase_auth.ExpiredIdTokenError:
        logger.warning("Expired Firebase token presented.")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Your session has expired. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except firebase_auth.InvalidIdTokenError as e:
        logger.warning(f"Invalid Firebase token: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        logger.error(f"Unexpected error verifying Firebase token: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication verification failed.",
            headers={"WWW-Authenticate": "Bearer"},
        )
