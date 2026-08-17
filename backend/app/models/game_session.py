import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Integer, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class GameSession(Base):
    __tablename__ = "game_sessions"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4()), index=True
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    current_chapter: Mapped[int] = mapped_column(Integer, default=1)
    current_sector: Mapped[str] = mapped_column(String(50), default="sector_01")
    system_integrity: Mapped[int] = mapped_column(Integer, default=100)
    corruption_level: Mapped[int] = mapped_column(Integer, default=20)
    debug_energy: Mapped[int] = mapped_column(Integer, default=100)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    user = relationship("User", back_populates="sessions")
    saves = relationship("SaveSlot", back_populates="session", lazy="selectin", cascade="all, delete-orphan")
    world_objects = relationship("WorldObject", back_populates="session", lazy="selectin", cascade="all, delete-orphan")
    game_events = relationship("GameEvent", back_populates="session", cascade="all, delete-orphan")
