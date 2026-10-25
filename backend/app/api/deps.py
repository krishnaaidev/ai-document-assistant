import logging
from typing import AsyncGenerator, Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.database import get_db
from app.core.security import verify_firebase_token
from app.models.models import User
from app.services.user_service import UserService

logger = logging.getLogger(__name__)
security_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    auth_creds: Optional[HTTPAuthorizationCredentials] = Depends(security_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    """
    FastAPI dependency that validates Firebase ID token, upserts user in Postgres,
    and returns the User model.
    """
    if not auth_creds or not auth_creds.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header with Bearer token is required",
            headers={"WWW-Authenticate": "Bearer"},
        )

    token = auth_creds.credentials
    claims = verify_firebase_token(token)

    firebase_uid = claims.get("uid")
    if not firebase_uid:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload: missing uid",
            headers={"WWW-Authenticate": "Bearer"},
        )

    email = claims.get("email") or f"{firebase_uid}@example.com"
    display_name = claims.get("name") or claims.get("display_name")

    # Upsert user record
    user = await UserService.get_or_create_user(
        db=db,
        firebase_uid=firebase_uid,
        email=email,
        display_name=display_name,
    )

    return user
