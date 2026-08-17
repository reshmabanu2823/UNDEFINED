from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.user import User
from app.routers.auth import get_optional_current_user
from app.schemas.quest import QuestResponse, QuestProgressUpdateRequest
from app.services.quest_service import (
    get_all_quests,
    get_quest_by_key_or_id,
    advance_quest_objective,
)

router = APIRouter(prefix="/api/quests", tags=["Quests & Authoritative Objectives"])


@router.get("", response_model=List[QuestResponse])
async def list_quests_endpoint(
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Lists all available quests with objective progression for the current operator.
    """
    user_id = current_user.id if current_user else None
    return await get_all_quests(db, user_id=user_id)


@router.get("/{quest_id}", response_model=QuestResponse)
async def get_quest_endpoint(
    quest_id: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieves the status, checklist, and active objectives for a specific quest.
    """
    user_id = current_user.id if current_user else None
    quest = await get_quest_by_key_or_id(db, quest_id, user_id=user_id)
    if not quest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"QUEST_NOT_FOUND: Quest '{quest_id}' not found in runtime database.",
        )
    return quest


@router.post("/{quest_key}/progress", response_model=QuestResponse)
async def progress_quest_endpoint(
    quest_key: str,
    body: QuestProgressUpdateRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Dispatches a game progress event to advance quest objectives.
    """
    user_id = current_user.id if current_user else None
    quest = await advance_quest_objective(
        db,
        event_type=body.objective_id,
        user_id=user_id,
        metadata=body.metadata,
    )
    if not quest:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"QUEST_NOT_FOUND: Unable to update quest '{quest_key}'.",
        )
    return quest
