import uuid
from datetime import datetime, timezone
from sqlalchemy import String, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    username: Mapped[str] = mapped_column(
        String(50), unique=True, index=True, nullable=False
    )
    email: Mapped[str] = mapped_column(
        String(255), unique=True, index=True, nullable=False
    )
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    profile = relationship("PlayerProfile", back_populates="user", uselist=False, lazy="selectin", cascade="all, delete-orphan")
    sessions = relationship("GameSession", back_populates="user", cascade="all, delete-orphan")
    saves = relationship("SaveSlot", back_populates="user", cascade="all, delete-orphan")
    quest_progress = relationship("QuestProgress", back_populates="user", cascade="all, delete-orphan")
    discovered_memories = relationship("DiscoveredMemory", back_populates="user", cascade="all, delete-orphan")
