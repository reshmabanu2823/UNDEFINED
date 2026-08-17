import uuid
from typing import List, Optional, Dict, Any
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.memory import MemoryFragment, DiscoveredMemory
from app.schemas.memory import MemoryFragmentResponse
from app.websocket.connection_manager import ws_manager
from app.utils.logger import logger

SEED_MEMORIES = [
    {
        "memory_key": "MEMORY_01.dat",
        "title": "INITIALIZATION",
        "integrity": 100.0,
        "content": "The system was never designed to contain a human consciousness.",
        "chapter": "CHAPTER_01",
    },
    {
        "memory_key": "MEMORY_07.dat",
        "title": "DELETION RECORD",
        "integrity": 43.0,
        "content": "Process NULL was scheduled for deletion.",
        "chapter": "CHAPTER_01",
    },
    {
        "memory_key": "MEMORY_13.dat",
        "title": "ROOT",
        "integrity": 18.0,
        "content": "User identity does not match archived records.",
        "chapter": "CHAPTER_01",
    },
]


async def ensure_seed_memories(db: AsyncSession):
    """
    Seeds initial memory fragments into the database if not present.
    """
    for seed in SEED_MEMORIES:
        stmt = select(MemoryFragment).where(
            (MemoryFragment.memory_key == seed["memory_key"]) |
            (MemoryFragment.memory_key == seed["memory_key"].lower())
        )
        res = await db.execute(stmt)
        existing = res.scalars().first()

        if not existing:
            fragment = MemoryFragment(
                id=str(uuid.uuid4()),
                memory_key=seed["memory_key"],
                title=seed["title"],
                content=seed["content"],
                integrity=seed["integrity"],
                chapter=seed["chapter"],
            )
            db.add(fragment)
    await db.commit()


def normalize_key(key: str) -> str:
    cleaned = key.strip()
    if not cleaned.lower().endswith(".dat") and "_" in cleaned:
        cleaned = f"{cleaned}.dat"
    return cleaned


async def get_all_memories(
    db: AsyncSession, user_id: Optional[str] = None
) -> List[MemoryFragmentResponse]:
    await ensure_seed_memories(db)

    # Get all fragments
    stmt = select(MemoryFragment).order_by(MemoryFragment.memory_key.asc())
    res = await db.execute(stmt)
    fragments = res.scalars().all()

    # Get user discovered memory IDs
    discovered_map: Dict[str, Any] = {}
    if user_id:
        disc_stmt = select(DiscoveredMemory).where(DiscoveredMemory.user_id == user_id)
        disc_res = await db.execute(disc_stmt)
        for disc in disc_res.scalars().all():
            discovered_map[disc.memory_id] = disc.discovered_at

    responses = []
    for f in fragments:
        is_disc = f.id in discovered_map or not user_id
        disc_at = discovered_map.get(f.id)
        responses.append(
            MemoryFragmentResponse(
                id=f.id,
                memory_key=f.memory_key,
                title=f.title,
                content=f.content if is_disc else "[ENCRYPTED MEMORY CORE - SCAN REQUIRED]",
                integrity=f.integrity,
                chapter=f.chapter,
                discovered=is_disc,
                discovered_at=disc_at,
            )
        )
    return responses


async def get_memory_by_key(
    db: AsyncSession, memory_key: str, user_id: Optional[str] = None
) -> Optional[MemoryFragmentResponse]:
    await ensure_seed_memories(db)
    norm_key = normalize_key(memory_key)

    stmt = select(MemoryFragment).where(
        (MemoryFragment.memory_key.ilike(norm_key)) |
        (MemoryFragment.memory_key.ilike(memory_key)) |
        (MemoryFragment.memory_key.ilike(f"{memory_key}.dat"))
    )
    res = await db.execute(stmt)
    fragment = res.scalars().first()
    if not fragment:
        return None

    is_disc = True
    disc_at = None
    if user_id:
        disc_stmt = select(DiscoveredMemory).where(
            DiscoveredMemory.user_id == user_id,
            DiscoveredMemory.memory_id == fragment.id,
        )
        disc_res = await db.execute(disc_stmt)
        disc = disc_res.scalars().first()
        is_disc = disc is not None
        disc_at = disc.discovered_at if disc else None

    return MemoryFragmentResponse(
        id=fragment.id,
        memory_key=fragment.memory_key,
        title=fragment.title,
        content=fragment.content if is_disc else "[ENCRYPTED MEMORY CORE - DISCOVERY REQUIRED]",
        integrity=fragment.integrity,
        chapter=fragment.chapter,
        discovered=is_disc,
        discovered_at=disc_at,
    )


async def discover_memory_by_key(
    db: AsyncSession, memory_key: str, user_id: Optional[str] = None
) -> Optional[MemoryFragmentResponse]:
    await ensure_seed_memories(db)
    norm_key = normalize_key(memory_key)

    stmt = select(MemoryFragment).where(
        (MemoryFragment.memory_key.ilike(norm_key)) |
        (MemoryFragment.memory_key.ilike(memory_key)) |
        (MemoryFragment.memory_key.ilike(f"{memory_key}.dat"))
    )
    res = await db.execute(stmt)
    fragment = res.scalars().first()
    if not fragment:
        return None

    if user_id:
        disc_stmt = select(DiscoveredMemory).where(
            DiscoveredMemory.user_id == user_id,
            DiscoveredMemory.memory_id == fragment.id,
        )
        disc_res = await db.execute(disc_stmt)
        disc = disc_res.scalars().first()

        if not disc:
            disc = DiscoveredMemory(
                user_id=user_id,
                memory_id=fragment.id,
            )
            db.add(disc)
            await db.commit()
            await db.refresh(disc)

    # Broadcast real-time MEMORY_DISCOVERED event over WebSockets
    try:
        await ws_manager.broadcast_global(
            event_type="MEMORY_DISCOVERED",
            payload={
                "memory_id": fragment.id,
                "memory_key": fragment.memory_key,
                "title": fragment.title,
                "integrity": fragment.integrity,
                "content": fragment.content,
            },
        )
    except Exception as e:
        logger.warning(f"Error broadcasting MEMORY_DISCOVERED: {e}")

    return MemoryFragmentResponse(
        id=fragment.id,
        memory_key=fragment.memory_key,
        title=fragment.title,
        content=fragment.content,
        integrity=fragment.integrity,
        chapter=fragment.chapter,
        discovered=True,
    )
