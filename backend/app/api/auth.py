from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    get_current_user,
    get_password_hash,
    verify_password,
)
from app.db.database import get_db
from app.models.user import User
from app.schemas.auth import (
    AuthResponse,
    LoginRequest,
    LogoutResponse,
    RegisterRequest,
    UserResponse,
)

router = APIRouter(prefix="/auth", tags=["Auth"])


def normalize_email(email: str) -> str:
    return email.lower().strip()


def user_to_dict(user: User):
    return {
        "id": user.id,
        "email": user.email,
        "fullName": user.full_name,
        "role": user.role,
        "isActive": user.is_active,
        "createdAt": user.created_at,
    }


def auth_response_for_user(user: User):
    token = create_access_token({"sub": str(user.id), "role": user.role})

    return {
        "accessToken": token,
        "tokenType": "bearer",
        "user": user_to_dict(user),
    }


@router.post("/register", response_model=AuthResponse)
def register_user(request: RegisterRequest, db: Session = Depends(get_db)):
    email = normalize_email(request.email)

    if "@" not in email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Enter a valid email address.",
        )

    existing_user = db.query(User).filter(func.lower(User.email) == email).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists.",
        )

    user = User(
        email=email,
        full_name=request.fullName.strip() if request.fullName else None,
        hashed_password=get_password_hash(request.password),
        role="user",
        is_active=True,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return auth_response_for_user(user)


@router.post("/login", response_model=AuthResponse)
def login_user(request: LoginRequest, db: Session = Depends(get_db)):
    email = normalize_email(request.email)
    user = db.query(User).filter(func.lower(User.email) == email).first()

    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account is inactive.",
        )

    return auth_response_for_user(user)


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return user_to_dict(current_user)


@router.post("/logout", response_model=LogoutResponse)
def logout_user():
    return {"message": "Logged out successfully."}
