import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Integer, Boolean, DateTime, JSON
from sqlalchemy.orm import Mapped, mapped_column
from app.database import Base


class WorldSession(Base):
    __tablename__ = "world_sessions"

    session_id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    sector_name: Mapped[str] = mapped_column(String(50), default="SECTOR_CORE_00")
    current_objective: Mapped[str] = mapped_column(
        String(150), default="ACCESS SECURITY DOOR"
    )
    door_01_permission: Mapped[str] = mapped_column(String(20), default="USER")
    door_01_locked: Mapped[bool] = mapped_column(Boolean, default=True)
    terminal_01_active: Mapped[bool] = mapped_column(Boolean, default=False)
    corruption_level: Mapped[int] = mapped_column(Integer, default=21)
    player_integrity: Mapped[int] = mapped_column(Integer, default=100)
    world_entities: Mapped[dict] = mapped_column(JSON, default=dict)

    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )
