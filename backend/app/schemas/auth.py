import re
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict, field_validator


class PlayerProfileResponse(BaseModel):
    display_name: str
    system_integrity: int
    corruption_level: int
    debug_energy: int

    model_config = ConfigDict(from_attributes=True)


class UserBase(BaseModel):
    username: str = Field(
        ...,
        min_length=3,
        max_length=50,
        description="Operator username/callsign (3-50 alphanumeric or underscore characters)",
    )
    email: EmailStr

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        trimmed = v.strip()
        if not re.match(r"^[a-zA-Z0-9_-]+$", trimmed):
            raise ValueError("Username must contain only letters, numbers, underscores, or hyphens.")
        return trimmed


class UserCreate(UserBase):
    password: str = Field(
        ...,
        min_length=8,
        max_length=128,
        description="Password (minimum 8 characters)",
    )

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters long.")
        if not any(c.isdigit() for c in v) and not any(c.isalpha() for c in v):
            raise ValueError("Password must contain both letters and numbers.")
        return v


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=1)


class UserResponse(UserBase):
    id: str
    created_at: datetime
    profile: Optional[PlayerProfileResponse] = None

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenPayload(BaseModel):
    sub: Optional[str] = None
    email: Optional[str] = None
    type: Optional[str] = None
    exp: Optional[int] = None
