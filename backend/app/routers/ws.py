from typing import Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query, status
from app.websocket.connection_manager import ws_manager
from app.utils.security import decode_access_token
from app.utils.logger import logger

router = APIRouter(prefix="/api/ws", tags=["WebSocket"])


@router.websocket("/game/{session_id}")
async def game_session_websocket(
    websocket: WebSocket,
    session_id: str,
    token: Optional[str] = Query(None),
):
    """
    Real-time bidirectional WebSocket endpoint for game session events.
    Authenticates player via JWT token query parameter.
    """
    user_id: Optional[str] = None
    if token:
        payload = decode_access_token(token)
        if payload and "sub" in payload:
            user_id = payload["sub"]

    await ws_manager.connect(session_id, websocket, user_id)

    try:
        # Send initial connected acknowledgement
        await websocket.send_json({
            "type": "CONNECTION_ESTABLISHED",
            "timestamp": None,
            "payload": {
                "session_id": session_id,
                "authenticated": user_id is not None,
                "user_id": user_id,
                "message": "Connected to NULL//ROOT authoritative neural telemetry stream.",
            },
        })

        while True:
            data = await websocket.receive_json()

            # Handle client-sent actions or ping/pong
            msg_type = data.get("type", "UNKNOWN")

            if msg_type == "PING":
                await websocket.send_json({"type": "PONG", "payload": {}})

            elif msg_type == "PLAYER_ACTION":
                action_payload = data.get("payload", {})
                logger.info(f"Received PLAYER_ACTION from session '{session_id}': {action_payload}")
                # Echo or broadcast action to other session clients
                await ws_manager.broadcast_to_session(
                    session_id,
                    event_type="PLAYER_ACTION_BROADCAST",
                    payload=action_payload,
                )

    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket session '{session_id}' error: {e}")
        ws_manager.disconnect(websocket)
