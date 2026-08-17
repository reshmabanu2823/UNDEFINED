from app.routers.health import router as health_router
from app.routers.auth import router as auth_router
from app.routers.game import router as game_router
from app.routers.debug import router as debug_router
from app.routers.ws import router as ws_router

__all__ = ["health_router", "auth_router", "game_router", "debug_router", "ws_router"]
