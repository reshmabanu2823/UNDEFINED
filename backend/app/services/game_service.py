from typing import List, Optional, Dict, Any
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.game_session import GameSession
from app.models.world_object import WorldObject
from app.models.save_slot import SaveSlot


INITIAL_WORLD_OBJECTS = [
    {
        "object_id": "door_01",
        "object_type": "SECURITY_DOOR",
        "state_json": {
            "locked": True,
            "permission": "USER",
        },
    },
    {
        "object_id": "terminal_01",
        "object_type": "DEBUG_TERMINAL",
        "state_json": {
            "active": True,
        },
    },
    {
        "object_id": "memory_01",
        "object_type": "MEMORY_FRAGMENT",
        "state_json": {
            "discovered": False,
            "integrity": 100,
        },
    },
]


async def create_game_session(
    db: AsyncSession, user_id: str
) -> GameSession:
    """
    Initializes a new authoritative game session with default player diagnostics and initial world objects.
    """
    session = GameSession(
        user_id=user_id,
        current_chapter=1,
        current_sector="sector_01",
        system_integrity=100,
        corruption_level=20,
        debug_energy=100,
        is_active=True,
    )
    db.add(session)
    await db.flush()  # Generate session.id

    # Seed initial world objects
    for item in INITIAL_WORLD_OBJECTS:
        obj = WorldObject(
            session_id=session.id,
            object_id=item["object_id"],
            object_type=item["object_type"],
            state_json=item["state_json"],
        )
        db.add(obj)

    await db.commit()
    return await get_game_session_detail(db, session.id, user_id)


async def get_user_game_sessions(
    db: AsyncSession, user_id: str
) -> List[GameSession]:
    """
    Lists all game sessions belonging to the specified operator.
    """
    stmt = (
        select(GameSession)
        .where(GameSession.user_id == user_id)
        .order_by(GameSession.updated_at.desc())
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_game_session_detail(
    db: AsyncSession, session_id: str, user_id: str
) -> Optional[GameSession]:
    """
    Reconstructs complete server-side session state including all dynamic world objects.
    """
    stmt = (
        select(GameSession)
        .options(selectinload(GameSession.world_objects))
        .where(GameSession.id == session_id, GameSession.user_id == user_id)
    )
    result = await db.execute(stmt)
    return result.scalars().first()


async def save_session_checkpoint(
    db: AsyncSession,
    session_id: str,
    user_id: str,
    save_name: str = "CHECKPOINT_MANUAL",
    slot_number: int = 1,
    client_state: Optional[Dict[str, Any]] = None,
) -> Optional[SaveSlot]:
    """
    Captures an authoritative snapshot of the current session state and world objects into a save slot.
    Persists chapter, sector, system integrity, corruption level, debug abilities, world objects,
    discovered memories, and quest progress.
    """
    session = await get_game_session_detail(db, session_id, user_id)
    if not session:
        return None

    # Construct authoritative state snapshot
    world_objects_map = {
        obj.object_id: obj.state_json for obj in session.world_objects
    }

    client_state = client_state or {}

    serialized_state = {
        "current_chapter": session.current_chapter,
        "current_sector": session.current_sector,
        "system_integrity": session.system_integrity,
        "corruption_level": session.corruption_level,
        "debug_energy": session.debug_energy,
        "debug_abilities": client_state.get("debug_abilities", ["scan", "rewrite"]),
        "world_objects": world_objects_map,
        "discovered_memories": client_state.get("discovered_memories", []),
        "quest_progress": client_state.get("quest_progress", {"current_objective": "ACCESS SECURITY DOOR"}),
        "player_position": client_state.get("player_position", {"x": 0, "y": 1.65, "z": 7.5}),
    }

    # Upsert save slot for this slot_number
    stmt = select(SaveSlot).where(
        SaveSlot.user_id == user_id, SaveSlot.slot_number == slot_number
    )
    result = await db.execute(stmt)
    existing_save = result.scalars().first()

    if existing_save:
        existing_save.game_session_id = session.id
        existing_save.save_name = save_name
        existing_save.serialized_game_state = serialized_state
        save_obj = existing_save
    else:
        save_obj = SaveSlot(
            user_id=user_id,
            game_session_id=session.id,
            save_name=save_name,
            slot_number=slot_number,
            serialized_game_state=serialized_state,
        )
        db.add(save_obj)

    await db.commit()
    await db.refresh(save_obj)
    return save_obj


async def load_session_checkpoint(
    db: AsyncSession,
    session_id: str,
    user_id: str,
    save_id: Optional[str] = None,
    slot_number: Optional[int] = None,
) -> Optional[GameSession]:
    """
    Restores session state and overwrites world objects from a saved checkpoint snapshot.
    """
    session = await get_game_session_detail(db, session_id, user_id)
    if not session:
        return None

    # Locate save slot
    if save_id:
        stmt = select(SaveSlot).where(
            SaveSlot.id == save_id, SaveSlot.user_id == user_id
        )
    elif slot_number is not None:
        stmt = select(SaveSlot).where(
            SaveSlot.slot_number == slot_number, SaveSlot.user_id == user_id
        )
    else:
        return None

    result = await db.execute(stmt)
    save_obj = result.scalars().first()
    if not save_obj:
        return None

    state = save_obj.serialized_game_state
    session.current_chapter = state.get("current_chapter", session.current_chapter)
    session.current_sector = state.get("current_sector", session.current_sector)
    session.system_integrity = state.get("system_integrity", session.system_integrity)
    session.corruption_level = state.get("corruption_level", session.corruption_level)
    session.debug_energy = state.get("debug_energy", session.debug_energy)

    # Restore world objects
    saved_objects = state.get("world_objects", {})
    for obj in session.world_objects:
        if obj.object_id in saved_objects:
            obj.state_json = saved_objects[obj.object_id]

    await db.commit()
    return await get_game_session_detail(db, session_id, user_id)


async def delete_game_session(
    db: AsyncSession, session_id: str, user_id: str
) -> bool:
    """
    Deletes a game session and cascades deletion of its world objects and logs.
    """
    session = await get_game_session_detail(db, session_id, user_id)
    if not session:
        return False

    await db.delete(session)
    await db.commit()
    return True
