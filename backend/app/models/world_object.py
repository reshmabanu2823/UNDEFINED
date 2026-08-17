import uuid
from datetime import datetime, timezone
from sqlalchemy import String, ForeignKey, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class WorldObject(Base):
    __tablename__ = "world_objects"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    object_id: Mapped[str] = mapped_column(
        String(50), index=True, nullable=False
    )
    session_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("game_sessions.id", ondelete="CASCADE"), nullable=False, index=True
    )
    object_type: Mapped[str] = mapped_column(
        String(50), nullable=False
    )
    state_json: Mapped[dict] = mapped_column(JSON, default=dict)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationship
    session = relationship("GameSession", back_populates="world_objects")
