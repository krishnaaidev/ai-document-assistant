import logging
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.models import User

logger = logging.getLogger(__name__)


async def upsert_user(
    db: AsyncSession,
    firebase_uid: str,
    email: str,
    display_name: Optional[str] = None,
) -> User:
    """
    Create or update the application user record for a Firebase UID.
    Always derives identity from the verified Firebase token — never from request body.
    """
    result = await db.execute(select(User).where(User.firebase_uid == firebase_uid))
    user = result.scalar_one_or_none()

    if user is None:
        # Create new user
        user = User(
            firebase_uid=firebase_uid,
            email=email,
            display_name=display_name,
        )
        db.add(user)
        await db.flush()
        logger.info(f"Created new user record for firebase_uid={firebase_uid}")
    else:
        # Update mutable fields if they've changed
        changed = False
        if email and user.email != email:
            user.email = email
            changed = True
        if display_name and user.display_name != display_name:
            user.display_name = display_name
            changed = True
        if changed:
            user.updated_at = datetime.now(timezone.utc)
            await db.flush()

    return user


async def get_user_by_firebase_uid(db: AsyncSession, firebase_uid: str) -> Optional[User]:
    """Look up a user by their Firebase UID."""
    result = await db.execute(select(User).where(User.firebase_uid == firebase_uid))
    return result.scalar_one_or_none()


async def get_user_by_id(db: AsyncSession, user_id) -> Optional[User]:
    """Look up a user by their internal UUID."""
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()
