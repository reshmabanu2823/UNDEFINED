from typing import Optional
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.models.player_profile import PlayerProfile
from app.schemas.auth import UserCreate
from app.utils.security import get_password_hash, verify_password


async def get_user_by_username(db: AsyncSession, username: str) -> Optional[User]:
    result = await db.execute(
        select(User).options(selectinload(User.profile)).where(User.username == username)
    )
    return result.scalars().first()


async def get_user_by_email(db: AsyncSession, email: str) -> Optional[User]:
    result = await db.execute(
        select(User).options(selectinload(User.profile)).where(User.email == email)
    )
    return result.scalars().first()


async def get_user_by_id(db: AsyncSession, user_id: str) -> Optional[User]:
    result = await db.execute(
        select(User).options(selectinload(User.profile)).where(User.id == user_id)
    )
    return result.scalars().first()


async def create_user(db: AsyncSession, user_in: UserCreate) -> User:
    hashed_password = get_password_hash(user_in.password)
    user = User(
        username=user_in.username,
        email=user_in.email,
        password_hash=hashed_password,
    )
    db.add(user)
    await db.flush()  # Generate user.id

    # Create associated player profile
    profile = PlayerProfile(
        user_id=user.id,
        display_name=user.username,
        system_integrity=100,
        corruption_level=21,
        debug_energy=100,
    )
    db.add(profile)
    await db.commit()

    # Re-query with profile eagerly loaded
    return await get_user_by_id(db, user.id)


async def authenticate_user_by_email(
    db: AsyncSession, email: str, password: str
) -> Optional[User]:
    user = await get_user_by_email(db, email)
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user


async def authenticate_user(
    db: AsyncSession, identifier: str, password: str
) -> Optional[User]:
    # Check if identifier is email or username
    user = await get_user_by_email(db, identifier)
    if not user:
        user = await get_user_by_username(db, identifier)
    if not user:
        return None
    if not verify_password(password, user.password_hash):
        return None
    return user

