import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Integer, ForeignKey, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class SaveSlot(Base):
    __tablename__ = "save_slots"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    game_session_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("game_sessions.id", ondelete="SET NULL"), nullable=True, index=True
    )
    save_name: Mapped[str] = mapped_column(String(100), default="SECTOR_00_CHECKPOINT")
    slot_number: Mapped[int] = mapped_column(Integer, default=1)
    serialized_game_state: Mapped[dict] = mapped_column(JSON, default=dict)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    user = relationship("User", back_populates="saves")
    session = relationship("GameSession", back_populates="saves")
