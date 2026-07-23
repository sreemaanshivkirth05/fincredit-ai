from datetime import datetime

from pydantic import BaseModel, Field


class UserResponse(BaseModel):
    id: int
    email: str
    fullName: str | None = None
    role: str
    isActive: bool
    createdAt: datetime


class RegisterRequest(BaseModel):
    email: str
    password: str = Field(min_length=8)
    fullName: str | None = None


class LoginRequest(BaseModel):
    email: str
    password: str


class AuthResponse(BaseModel):
    accessToken: str
    tokenType: str
    user: UserResponse


class LogoutResponse(BaseModel):
    message: str
