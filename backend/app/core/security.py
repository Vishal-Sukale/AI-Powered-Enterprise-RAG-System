from fastapi import Header, HTTPException, status
from app.config import settings


async def verify_api_key(x_api_key: str = Header(default="")):
    """
    Protects endpoints behind a shared API key passed via the X-API-Key header.
    If API_KEY is left empty in .env, authentication is disabled (useful for
    local development) — set it in production to lock the API down.
    """
    if not settings.API_KEY:
        return  # auth disabled in this environment

    if x_api_key != settings.API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API key.",
        )