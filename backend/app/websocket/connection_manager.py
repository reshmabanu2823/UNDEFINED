from datetime import datetime, timezone
from typing import Dict, Set, Any, Optional
from collections import defaultdict
from fastapi import WebSocket
from app.utils.logger import logger


class GameSessionConnectionManager:
    """
    Authoritative WebSocket Connection Manager.
    Manages session-scoped client sockets and broadcasts real-time neural events.
    """

    def __init__(self):
        # Maps session_id -> Set of active WebSockets
        self.session_connections: Dict[str, Set[WebSocket]] = defaultdict(set)
        # Maps WebSocket -> session_id
        self.socket_to_session: Dict[WebSocket, str] = {}
        # Maps WebSocket -> user_id
        self.socket_to_user: Dict[WebSocket, Optional[str]] = {}

    async def connect(
        self, session_id: str, websocket: WebSocket, user_id: Optional[str] = None
    ):
        await websocket.accept()
        self.session_connections[session_id].add(websocket)
        self.socket_to_session[websocket] = session_id
        self.socket_to_user[websocket] = user_id
        logger.info(
            f"WebSocket connected: session='{session_id}', user='{user_id}'. Active session clients: {len(self.session_connections[session_id])}"
        )

    def disconnect(self, websocket: WebSocket):
        session_id = self.socket_to_session.pop(websocket, None)
        self.socket_to_user.pop(websocket, None)

        if session_id and session_id in self.session_connections:
            self.session_connections[session_id].discard(websocket)
            if not self.session_connections[session_id]:
                del self.session_connections[session_id]
            logger.info(
                f"WebSocket disconnected from session '{session_id}'."
            )

    async def broadcast_to_session(self, session_id: str, event_type: str, payload: Dict[str, Any]):
        """
        Broadcasts a structured neural game event to all active clients connected to a specific session.
        """
        if session_id not in self.session_connections:
            return

        message = {
            "type": event_type,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "payload": payload,
        }

        dead_sockets: Set[WebSocket] = set()
        for websocket in list(self.session_connections[session_id]):
            try:
                await websocket.send_json(message)
            except Exception as e:
                logger.warning(f"Error broadcasting to socket in session '{session_id}': {e}")
                dead_sockets.add(websocket)

        for dead_socket in dead_sockets:
            self.disconnect(dead_socket)

    async def broadcast_global(self, event_type: str, payload: Dict[str, Any]):
        """
        Broadcasts an event globally across all active game sessions.
        """
        for session_id in list(self.session_connections.keys()):
            await self.broadcast_to_session(session_id, event_type, payload)


ws_manager = GameSessionConnectionManager()
