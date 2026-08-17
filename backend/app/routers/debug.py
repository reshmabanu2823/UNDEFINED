from typing import Optional
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.database import get_db
from app.models.user import User
from app.routers.auth import get_optional_current_user
from app.schemas.debug import DebugExecuteRequest, DebugExecuteResponse
from app.debug_engine.command_executor import AuthoritativeCommandExecutor

router = APIRouter(prefix="/api/debug", tags=["Debug Terminal"])


@router.post("/execute", response_model=DebugExecuteResponse)
async def execute_debug_command_endpoint(
    req: DebugExecuteRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db),
):
    """
    Safely executes a debug command (e.g. 'scan door_01', 'rewrite door_01.permission=root')
    against the server's authoritative game state.
    """
    user_id = current_user.id if current_user else None
    result = await AuthoritativeCommandExecutor.execute_command(
        db=db,
        session_id=req.session_id,
        user_id=user_id,
        raw_command=req.command,
    )
    return DebugExecuteResponse(
        success=result.get("success", False),
        command=req.command,
        object_id=result.get("object_id"),
        property=result.get("property"),
        old_value=result.get("old_value"),
        new_value=result.get("new_value"),
        message=result.get("message", ""),
        error_code=result.get("error_code"),
        state_changed=result.get("state_changed", False),
        updated_state=result.get("updated_state"),
    )
