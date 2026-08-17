from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.schemas.game import GameSaveCreate, GameSaveResponse, WorldStateSync
from app.schemas.auth import UserResponse
from app.routers.auth import get_current_user
from app.services.game_service import (
    save_game_state,
    get_user_saves,
    get_save_by_slot,
    sync_world_session,
)

router = APIRouter(prefix="/api/game", tags=["Game"])


@router.post("/save", response_model=GameSaveResponse)
async def save_game(
    save_in: GameSaveCreate,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    save_obj = await save_game_state(db, current_user.id, save_in)
    return GameSaveResponse.model_validate(save_obj)


@router.get("/saves", response_model=List[GameSaveResponse])
async def list_saves(
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    saves = await get_user_saves(db, current_user.id)
    return [GameSaveResponse.model_validate(s) for s in saves]


@router.get("/saves/{slot_index}", response_model=GameSaveResponse)
async def get_save(
    slot_index: int,
    current_user: UserResponse = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    save_obj = await get_save_by_slot(db, current_user.id, slot_index)
    if not save_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"SLOT_EMPTY: No save checkpoint found in memory slot {slot_index}.",
        )
    return GameSaveResponse.model_validate(save_obj)


@router.post("/sync/{session_id}")
async def sync_state(
    session_id: str,
    sync_data: WorldStateSync,
    db: AsyncSession = Depends(get_db),
):
    session = await sync_world_session(db, session_id, sync_data)
    return {
        "status": "synchronized",
        "session_id": session.session_id,
        "corruption_level": session.corruption_level,
        "door_01_status": "UNLOCKED" if not session.door_01_locked else "LOCKED",
    }
