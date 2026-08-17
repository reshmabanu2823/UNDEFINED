from datetime import datetime, timedelta, timezone
from typing import Any, Optional, Dict
import jwt
from passlib.context import CryptContext
from app.config import settings

# Password hashing context (bcrypt)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a plain text password against a bcrypt hashed password.
    """
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """
    Generates a secure bcrypt password hash.
    """
    return pwd_context.hash(password)


def create_access_token(
    subject: str,
    email: Optional[str] = None,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """
    Creates a signed JWT access token with user ID, email, expiration, and token type.
    """
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode: Dict[str, Any] = {
        "sub": str(subject),
        "exp": expire,
        "iat": now,
        "type": "access",
    }
    if email:
        to_encode["email"] = email

    encoded_jwt = jwt.encode(
        to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM
    )
    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """
    Safely decodes and verifies a JWT token. Returns None if invalid or expired.
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM],
            options={"require": ["exp", "sub"]},
        )
        return payload
    except jwt.PyJWTError:
        return None
