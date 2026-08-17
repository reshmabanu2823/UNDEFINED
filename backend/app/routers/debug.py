from fastapi import APIRouter
from app.schemas.debug import CommandRequest, CommandResponse
from app.debug_engine.command_executor import CommandExecutor

router = APIRouter(prefix="/api/debug", tags=["Debug Terminal"])


@router.post("/execute", response_model=CommandResponse)
async def execute_debug_command(req: CommandRequest):
    """
    Executes a terminal debug command (e.g. 'scan door_01', 'rewrite door_01.permission=root').
    """
    session_id = req.session_id or "default_session"
    result = CommandExecutor.execute(req.command, session_id)
    return CommandResponse(
        success=result.get("success", True),
        command=req.command,
        output=result.get("output", ""),
        is_error=result.get("is_error", False),
        is_success=result.get("is_success", True),
        state_changed=result.get("state_changed", False),
        updated_state=result.get("updated_state"),
    )
