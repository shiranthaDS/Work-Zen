from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from typing import Optional
import secrets
import bcrypt
from datetime import datetime, timedelta
from app.database import get_database
from app.models import UserRole

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# Simple token store (in production, use JWT or Redis)
TOKENS = {}

class LoginRequest(BaseModel):
    username: str
    password: str

class LoginResponse(BaseModel):
    token: str
    username: str
    role: str

async def hash_password(password: str) -> str:
    """Hash password using bcrypt"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

async def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password against hash"""
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

@router.post("/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    """
    Authenticate user and return token
    
    Credentials are stored in MongoDB users collection
    """
    db = await get_database()
    users_collection = db.users
    
    # Find user by username
    user = await users_collection.find_one({"username": request.username})
    
    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    # Check if user is active
    if not user.get("is_active", True):
        raise HTTPException(status_code=401, detail="User account is disabled")
    
    # Verify password
    if not await verify_password(request.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")
    
    # Generate token
    token = secrets.token_urlsafe(32)
    
    # Store token with expiration (24 hours)
    TOKENS[token] = {
        "username": user["username"],
        "role": user.get("role", "employee"),
        "user_id": str(user["_id"]),
        "expires_at": datetime.now() + timedelta(hours=24)
    }
    
    return LoginResponse(
        token=token,
        username=user["username"],
        role=user.get("role", "employee")
    )

@router.post("/logout")
async def logout(authorization: Optional[str] = Header(None)):
    """Logout user by invalidating token"""
    if authorization and authorization.startswith("Bearer "):
        token = authorization.replace("Bearer ", "")
        if token in TOKENS:
            del TOKENS[token]
    return {"message": "Logged out successfully"}

@router.get("/verify")
async def verify_token(authorization: Optional[str] = Header(None)):
    """Verify if token is valid"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    token = authorization.replace("Bearer ", "")
    
    if token not in TOKENS:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    token_data = TOKENS[token]
    
    # Check if token is expired
    if datetime.now() > token_data["expires_at"]:
        del TOKENS[token]
        raise HTTPException(status_code=401, detail="Token expired")
    
    return {
        "valid": True,
        "username": token_data["username"],
        "role": token_data["role"],
        "user_id": token_data["user_id"]
    }

async def get_current_user(authorization: Optional[str] = Header(None)):
    """Dependency to get current user from token"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid authorization header")
    
    token = authorization.replace("Bearer ", "")
    
    if token not in TOKENS:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    
    token_data = TOKENS[token]
    
    # Check if token is expired
    if datetime.now() > token_data["expires_at"]:
        del TOKENS[token]
        raise HTTPException(status_code=401, detail="Token expired")
    
    return token_data
