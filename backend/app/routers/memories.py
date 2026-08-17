from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.user import User
from app.routers.auth import get_optional_current_user
from app.schemas.memory import MemoryFragmentResponse, MemoryDiscoveryResponse
from app.services.memory_service import (
    get_all_memories,
    get_memory_by_key,
    discover_memory_by_key,
)

router = APIRouter(prefix="/api/memories", tags=["Memory Fragments & Neural Lore"])


@router.get("", response_model=List[MemoryFragmentResponse])
async def list_memories_endpoint(
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Retrieves all lore memory fragments in the matrix, indicating discovery state for the operator.
    """
    user_id = current_user.id if current_user else None
    return await get_all_memories(db, user_id=user_id)


@router.get("/{memory_key}", response_model=MemoryFragmentResponse)
async def get_memory_endpoint(
    memory_key: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Fetches the details and content of a specific memory fragment by key (e.g. MEMORY_01.dat or memory_01).
    """
    user_id = current_user.id if current_user else None
    fragment = await get_memory_by_key(db, memory_key, user_id=user_id)
    if not fragment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"MEMORY_NOT_FOUND: Memory fragment '{memory_key}' not found in cortex archive.",
        )
    return fragment


@router.post("/{memory_key}/discover", response_model=MemoryDiscoveryResponse)
async def discover_memory_endpoint(
    memory_key: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Authoritatively registers the discovery of a memory fragment, decrypts its contents,
    and broadcasts the discovery over the real-time telemetry stream.
    """
    user_id = current_user.id if current_user else None
    fragment = await discover_memory_by_key(db, memory_key, user_id=user_id)
    if not fragment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"MEMORY_NOT_FOUND: Unable to discover fragment '{memory_key}'.",
        )
    return MemoryDiscoveryResponse(
        success=True,
        memory=fragment,
        message=f"Memory fragment '{fragment.title}' ({fragment.memory_key}) successfully decrypted.",
    )
