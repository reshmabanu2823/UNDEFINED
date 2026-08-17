from fastapi import APIRouter

router = APIRouter(prefix="/api/health", tags=["Health"])


@router.get("", summary="Health Check")
async def health_check():
    """
    Returns the operational status of the NULL//ROOT backend service.
    """
    return {
        "status": "ok",
        "service": "null-root-backend"
    }
