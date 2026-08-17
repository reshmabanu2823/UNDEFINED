import uuid
from datetime import datetime, timezone
from sqlalchemy import String, Float, Text, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database import Base


class MemoryFragment(Base):
    __tablename__ = "memory_fragments"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    memory_key: Mapped[str] = mapped_column(
        String(100), unique=True, index=True, nullable=False
    )
    title: Mapped[str] = mapped_column(String(150), nullable=False)
    content: Mapped[str] = mapped_column(Text, default="")
    integrity: Mapped[float] = mapped_column(Float, default=100.0)
    chapter: Mapped[str] = mapped_column(String(50), default="CHAPTER_00")

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationship
    discoveries = relationship("DiscoveredMemory", back_populates="memory", cascade="all, delete-orphan")


class DiscoveredMemory(Base):
    __tablename__ = "discovered_memories"

    id: Mapped[str] = mapped_column(
        String(36), primary_key=True, default=lambda: str(uuid.uuid4())
    )
    user_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    memory_id: Mapped[str] = mapped_column(
        String(36), ForeignKey("memory_fragments.id", ondelete="CASCADE"), nullable=False, index=True
    )
    discovered_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    user = relationship("User", back_populates="discovered_memories")
    memory = relationship("MemoryFragment", back_populates="discoveries")
