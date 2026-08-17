import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Integer, Float, ForeignKey, DateTime, Text, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class GameSave(Base):
    __tablename__ = "game_saves"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    save_name: Mapped[str] = mapped_column(String(100), default="SECTOR_00_CHECKPOINT")
    slot_index: Mapped[int] = mapped_column(Integer, default=1)
    sector: Mapped[str] = mapped_column(String(50), default="SECTOR_00")
    corruption_level: Mapped[int] = mapped_column(Integer, default=21)
    player_integrity: Mapped[int] = mapped_column(Integer, default=100)
    current_objective: Mapped[str] = mapped_column(
        String(150), default="ACCESS SECURITY DOOR"
    )
    world_state_data: Mapped[dict] = mapped_column(JSON, default=dict)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationship
    user = relationship("User", back_populates="saves")
