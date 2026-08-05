from datetime import datetime
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.core.auth import hash_password, verify_password, create_access_token

router = APIRouter(prefix="/auth", tags=["Auth"])

ALLOWED_ROLES = {"admin", "employee", "guest"}


class SignupRequest(BaseModel):
    username: str = Field(..., min_length=3)
    password: str = Field(..., min_length=6)
    role: str = Field(default="employee")


class LoginRequest(BaseModel):
    username: str
    password: str


@router.post("/signup")
async def signup(request: SignupRequest):
    role = request.role if request.role in ("employee", "guest") else "employee"

    with get_db() as conn:
        existing = conn.execute(
            "SELECT id FROM users WHERE username = ?", (request.username,)
        ).fetchone()
        if existing:
            raise HTTPException(status_code=400, detail="Username already taken.")

        conn.execute(
            "INSERT INTO users (username, password_hash, role, created_at) VALUES (?, ?, ?, ?)",
            (request.username, hash_password(request.password), role, datetime.utcnow().isoformat()),
        )

    return {"message": "Account created successfully. Please log in."}


@router.post("/login")
async def login(request: LoginRequest):
    with get_db() as conn:
        user = conn.execute(
            "SELECT * FROM users WHERE username = ?", (request.username,)
        ).fetchone()

    if user is None or not verify_password(request.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid username or password.")

    token = create_access_token(user["id"], user["username"], user["role"])
    return {
        "access_token": token,
        "token_type": "bearer",
        "username": user["username"],
        "role": user["role"],
    }