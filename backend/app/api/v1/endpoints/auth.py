from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any

from backend.app.database.session import get_db
from backend.app.models.entities import User
from backend.app.core.security import (
    hash_password, verify_password, create_access_token,
    get_current_user_payload
)

router = APIRouter()

class UserRegisterRequest(BaseModel):
    email: EmailStr
    username: str
    password: str
    full_name: str
    role: Optional[str] = "analyst"
    organization: Optional[str] = None

class UserLoginRequest(BaseModel):
    username_or_email: str
    password: str

class UserProfileUpdateRequest(BaseModel):
    full_name: Optional[str] = None
    organization: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None

@router.post("/register")
def register_user(req: UserRegisterRequest, db: Session = Depends(get_db)):
    # Check duplicate email
    if db.query(User).filter(User.email == req.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email address already exists."
        )
    # Check duplicate username
    if db.query(User).filter(User.username == req.username).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username is already taken. Please choose another username."
        )

    user = User(
        email=req.email,
        username=req.username,
        hashed_password=hash_password(req.password),
        full_name=req.full_name,
        role=req.role if req.role in ["analyst", "viewer", "admin"] else "analyst",
        organization=req.organization,
        preferences={"theme": "dark", "preferred_language": "ta", "notifications": True}
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    access_token = create_access_token(subject=user.id, role=user.role)

    return {
        "message": "User registered successfully",
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "full_name": user.full_name,
            "role": user.role,
            "organization": user.organization
        }
    }

@router.post("/login")
def login_user(req: UserLoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(
        (User.email == req.username_or_email) | (User.username == req.username_or_email)
    ).first()

    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username/email or password.",
            headers={"WWW-Authenticate": "Bearer"}
        )

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="User account is deactivated.")

    access_token = create_access_token(subject=user.id, role=user.role)

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "full_name": user.full_name,
            "role": user.role,
            "organization": user.organization,
            "preferences": user.preferences
        }
    }

@router.get("/me")
def get_current_user_profile(
    current_payload: Dict[str, Any] = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    user_id = current_payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    return {
        "id": user.id,
        "email": user.email,
        "username": user.username,
        "full_name": user.full_name,
        "role": user.role,
        "organization": user.organization,
        "preferences": user.preferences,
        "created_at": user.created_at.isoformat() if user.created_at else None
    }

@router.put("/profile")
def update_profile(
    req: UserProfileUpdateRequest,
    current_payload: Dict[str, Any] = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    user_id = current_payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    if req.full_name is not None:
        user.full_name = req.full_name
    if req.organization is not None:
        user.organization = req.organization
    if req.preferences is not None:
        user.preferences = {**user.preferences, **req.preferences}

    db.commit()
    db.refresh(user)

    return {
        "message": "Profile updated successfully",
        "user": {
            "id": user.id,
            "email": user.email,
            "username": user.username,
            "full_name": user.full_name,
            "role": user.role,
            "organization": user.organization,
            "preferences": user.preferences
        }
    }
