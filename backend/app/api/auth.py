from fastapi import APIRouter, Depends
from app.api.deps import get_current_user
from app.models.models import User
from app.schemas.schemas import UserResponse

router = APIRouter(prefix="/auth", tags=["Auth"])


@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_user),
):
    """Return the currently authenticated user's profile."""
    return current_user


@router.post("/verify", response_model=UserResponse)
async def verify_auth_token(
    current_user: User = Depends(get_current_user),
):
    """Verify the bearer token and return user information."""
    return current_user
