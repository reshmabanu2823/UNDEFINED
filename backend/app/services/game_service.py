from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.save_slot import SaveSlot
from app.models.game_session import GameSession
from app.models.world_object import WorldObject
from app.schemas.game import GameSaveCreate, WorldStateSync


async def save_game_state(
    db: AsyncSession, user_id: str, save_in: GameSaveCreate
) -> SaveSlot:
    # Check if a save already exists for this slot
    stmt = select(SaveSlot).where(
        SaveSlot.user_id == user_id, SaveSlot.slot_number == save_in.slot_index
    )
    result = await db.execute(stmt)
    existing_save = result.scalars().first()

    state_data = {
        "sector": save_in.sector,
        "corruption_level": save_in.corruption_level,
        "player_integrity": save_in.player_integrity,
        "current_objective": save_in.current_objective,
        **save_in.world_state_data,
    }

    if existing_save:
        existing_save.save_name = save_in.save_name
        existing_save.serialized_game_state = state_data
        save_obj = existing_save
    else:
        save_obj = SaveSlot(
            user_id=user_id,
            save_name=save_in.save_name,
            slot_number=save_in.slot_index,
            serialized_game_state=state_data,
        )
        db.add(save_obj)

    await db.commit()
    await db.refresh(save_obj)
    return save_obj


async def get_user_saves(db: AsyncSession, user_id: str) -> List[SaveSlot]:
    stmt = (
        select(SaveSlot)
        .where(SaveSlot.user_id == user_id)
        .order_by(SaveSlot.slot_number.asc())
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_save_by_slot(
    db: AsyncSession, user_id: str, slot_index: int
) -> Optional[SaveSlot]:
    stmt = select(SaveSlot).where(
        SaveSlot.user_id == user_id, SaveSlot.slot_number == slot_index
    )
    result = await db.execute(stmt)
    return result.scalars().first()


async def sync_world_session(
    db: AsyncSession, session_id: str, sync_data: WorldStateSync, user_id: Optional[str] = None
) -> GameSession:
    stmt = select(GameSession).where(GameSession.id == session_id)
    result = await db.execute(stmt)
    session = result.scalars().first()

    if not session:
        session = GameSession(
            id=session_id,
            user_id=user_id or "anonymous_operator",
            current_chapter="CHAPTER_00",
            current_sector=sync_data.sector_name,
            is_active=True,
        )
        db.add(session)
    else:
        session.current_sector = sync_data.sector_name
        session.is_active = True

    await db.commit()
    await db.refresh(session)
    return session
