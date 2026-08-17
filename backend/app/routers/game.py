from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.user import User
from app.routers.auth import get_current_user
from app.schemas.game import (
    GameSessionCreate,
    GameSessionSummary,
    GameSessionDetailResponse,
    SaveSessionRequest,
    LoadSessionRequest,
    SaveSlotResponse,
)
from app.services.game_service import (
    create_game_session,
    get_user_game_sessions,
    get_game_session_detail,
    save_session_checkpoint,
    load_session_checkpoint,
    delete_game_session,
)

router = APIRouter(prefix="/api/game", tags=["Game Sessions & Authoritative State"])


def format_session_detail(session) -> GameSessionDetailResponse:
    world_objects_dict: Dict[str, Dict[str, Any]] = {}
    if hasattr(session, "world_objects") and session.world_objects:
        for obj in session.world_objects:
            world_objects_dict[obj.object_id] = obj.state_json

    return GameSessionDetailResponse(
        id=session.id,
        user_id=session.user_id,
        current_chapter=session.current_chapter,
        current_sector=session.current_sector,
        system_integrity=session.system_integrity,
        corruption_level=session.corruption_level,
        debug_energy=session.debug_energy,
        is_active=session.is_active,
        world_objects=world_objects_dict,
        created_at=session.created_at,
        updated_at=session.updated_at,
    )


@router.post("/sessions", response_model=GameSessionDetailResponse, status_code=status.HTTP_201_CREATED)
async def create_session_endpoint(
    body: GameSessionCreate = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Initializes a new authoritative game session with chapter 1, sector_01,
    default diagnostics, and initial world objects (door_01, terminal_01, memory_01).
    """
    session = await create_game_session(db, current_user.id)
    return format_session_detail(session)


@router.get("/sessions", response_model=List[GameSessionSummary])
async def list_sessions_endpoint(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieves a list of all game sessions belonging to the authenticated operator.
    """
    sessions = await get_user_game_sessions(db, current_user.id)
    return [GameSessionSummary.model_validate(s) for s in sessions]


@router.get("/sessions/{session_id}", response_model=GameSessionDetailResponse)
async def get_session_endpoint(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Authoritatively reconstructs the full game session and dynamic world objects state from the database.
    """
    session = await get_game_session_detail(db, session_id, current_user.id)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"SESSION_NOT_FOUND: Game session '{session_id}' does not exist or access is forbidden.",
        )
    return format_session_detail(session)


@router.post("/sessions/{session_id}/save", response_model=SaveSlotResponse)
async def save_session_endpoint(
    session_id: str,
    save_req: SaveSessionRequest = SaveSessionRequest(),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Creates an authoritative persistent checkpoint snapshot for this game session in the specified slot.
    """
    save_obj = await save_session_checkpoint(
        db,
        session_id=session_id,
        user_id=current_user.id,
        save_name=save_req.save_name,
        slot_number=save_req.slot_number,
        client_state=save_req.client_state,
    )
    if not save_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"SESSION_NOT_FOUND: Unable to save; session '{session_id}' not found.",
        )
    return SaveSlotResponse.model_validate(save_obj)


@router.post("/sessions/{session_id}/load", response_model=GameSessionDetailResponse)
async def load_session_endpoint(
    session_id: str,
    load_req: LoadSessionRequest = LoadSessionRequest(),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Authoritatively restores session parameters and world objects from a saved checkpoint snapshot.
    """
    restored_session = await load_session_checkpoint(
        db,
        session_id=session_id,
        user_id=current_user.id,
        save_id=load_req.save_id,
        slot_number=load_req.slot_number if load_req.slot_number is not None else 1,
    )
    if not restored_session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="SAVE_NOT_FOUND: Specified checkpoint could not be found for restoration.",
        )
    return format_session_detail(restored_session)


@router.delete("/sessions/{session_id}")
async def delete_session_endpoint(
    session_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Permanently deletes a game session and cascades to its world objects and telemetry.
    """
    success = await delete_game_session(db, session_id, current_user.id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"SESSION_NOT_FOUND: Game session '{session_id}' not found.",
        )
    return {
        "status": "DELETED",
        "session_id": session_id,
        "message": "Game session and persistent matrix state successfully purged.",
    }
