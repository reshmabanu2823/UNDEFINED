from typing import List, Optional
from sqlalchemy import select, desc
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.game_save import GameSave
from app.models.world_state import WorldSession
from app.schemas.game import GameSaveCreate, WorldStateSync


async def save_game_state(
    db: AsyncSession, user_id: str, save_in: GameSaveCreate
) -> GameSave:
    # Check if a save already exists for this slot
    stmt = select(GameSave).where(
        GameSave.user_id == user_id, GameSave.slot_index == save_in.slot_index
    )
    result = await db.execute(stmt)
    existing_save = result.scalars().first()

    if existing_save:
        existing_save.save_name = save_in.save_name
        existing_save.sector = save_in.sector
        existing_save.corruption_level = save_in.corruption_level
        existing_save.player_integrity = save_in.player_integrity
        existing_save.current_objective = save_in.current_objective
        existing_save.world_state_data = save_in.world_state_data
        save_obj = existing_save
    else:
        save_obj = GameSave(
            user_id=user_id,
            save_name=save_in.save_name,
            slot_index=save_in.slot_index,
            sector=save_in.sector,
            corruption_level=save_in.corruption_level,
            player_integrity=save_in.player_integrity,
            current_objective=save_in.current_objective,
            world_state_data=save_in.world_state_data,
        )
        db.add(save_obj)

    await db.commit()
    await db.refresh(save_obj)
    return save_obj


async def get_user_saves(db: AsyncSession, user_id: str) -> List[GameSave]:
    stmt = (
        select(GameSave)
        .where(GameSave.user_id == user_id)
        .order_by(GameSave.slot_index.asc())
    )
    result = await db.execute(stmt)
    return list(result.scalars().all())


async def get_save_by_slot(
    db: AsyncSession, user_id: str, slot_index: int
) -> Optional[GameSave]:
    stmt = select(GameSave).where(
        GameSave.user_id == user_id, GameSave.slot_index == slot_index
    )
    result = await db.execute(stmt)
    return result.scalars().first()


async def sync_world_session(
    db: AsyncSession, session_id: str, sync_data: WorldStateSync
) -> WorldSession:
    stmt = select(WorldSession).where(WorldSession.session_id == session_id)
    result = await db.execute(stmt)
    session = result.scalars().first()

    if not session:
        session = WorldSession(
            session_id=session_id,
            sector_name=sync_data.sector_name,
            current_objective=sync_data.current_objective,
            door_01_permission=sync_data.door_01_permission,
            door_01_locked=sync_data.door_01_locked,
            terminal_01_active=sync_data.terminal_01_active,
            corruption_level=sync_data.corruption_level,
            player_integrity=sync_data.player_integrity,
            world_entities=sync_data.world_entities,
        )
        db.add(session)
    else:
        session.sector_name = sync_data.sector_name
        session.current_objective = sync_data.current_objective
        session.door_01_permission = sync_data.door_01_permission
        session.door_01_locked = sync_data.door_01_locked
        session.terminal_01_active = sync_data.terminal_01_active
        session.corruption_level = sync_data.corruption_level
        session.player_integrity = sync_data.player_integrity
        session.world_entities = sync_data.world_entities

    await db.commit()
    await db.refresh(session)
    return session
