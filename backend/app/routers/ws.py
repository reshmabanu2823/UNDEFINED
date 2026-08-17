from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.websocket.connection_manager import ws_manager
from app.utils.logger import logger

router = APIRouter(prefix="/api/ws", tags=["WebSocket"])


@router.websocket("/telemetry")
async def websocket_telemetry_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            # Echo or broadcast telemetry update
            await ws_manager.broadcast({
                "type": "TELEMETRY_UPDATE",
                "payload": data
            })
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        ws_manager.disconnect(websocket)
