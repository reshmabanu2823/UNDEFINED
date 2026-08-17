import re
from typing import Dict, Any, Optional
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.game_session import GameSession
from app.models.world_object import WorldObject
from app.models.game_event import GameEvent


# Explicit allowlists for mutable properties and allowed values
MUTABLE_PROPERTIES = {
    "door_01": {
        "permission": ["USER", "ROOT", "ADMIN"],
        "permissionlevel": ["USER", "ROOT", "ADMIN"],
    },
    "terminal_01": {
        "active": ["TRUE", "FALSE"],
    },
    "memory_01": {
        "discovered": ["TRUE", "FALSE"],
    },
}


class AuthoritativeCommandExecutor:
    """
    Controlled server-side command engine with strict tokenization, allowlisting,
    and database persistence. Completely prevents arbitrary code execution.
    """

    @staticmethod
    async def execute_command(
        db: AsyncSession,
        session_id: str,
        user_id: str,
        raw_command: str,
    ) -> Dict[str, Any]:
        trimmed = raw_command.strip()
        if not trimmed:
            return {
                "success": False,
                "command": raw_command,
                "error_code": "EMPTY_COMMAND",
                "message": "Empty command string received.",
            }

        # 1. Verify session exists and verify ownership if authenticated
        session_stmt = (
            select(GameSession)
            .options(selectinload(GameSession.world_objects))
            .where(GameSession.id == session_id)
        )
        session_res = await db.execute(session_stmt)
        session = session_res.scalars().first()

        if not session:
            return {
                "success": False,
                "command": raw_command,
                "error_code": "SESSION_NOT_FOUND",
                "message": f"Game session '{session_id}' not found in matrix database.",
            }

        # Check ownership if user is authenticated
        if user_id and session.user_id != user_id and session.user_id != "anonymous_operator":
            return {
                "success": False,
                "command": raw_command,
                "error_code": "SESSION_UNAUTHORIZED",
                "message": f"Access denied: Game session '{session_id}' belongs to another operator.",
            }

        # Build lookup map of world objects in this session
        objects_by_id: Dict[str, WorldObject] = {
            obj.object_id.lower(): obj for obj in session.world_objects
        }

        # 2. Match: SCAN command
        # Syntax: scan <object_id> or scan
        scan_match = re.match(r"^scan(?:\s+([a-zA-Z0-9_-]+))?$", trimmed, re.IGNORECASE)
        if scan_match:
            target_id = scan_match.group(1)
            if not target_id:
                # Scan all objects in sector
                detected = [
                    f"{obj.object_id} [{obj.object_type}]"
                    for obj in session.world_objects
                ]
                msg = f"DETECTED ENTITIES ({len(detected)}):\n" + "\n".join(
                    [f"  * {d}" for d in detected]
                )

                # Record GameEvent
                event = GameEvent(
                    session_id=session.id,
                    event_type="DEBUG_SCAN_ALL",
                    payload_json={"command": trimmed},
                )
                db.add(event)
                await db.commit()

                return {
                    "success": True,
                    "command": raw_command,
                    "message": msg,
                    "state_changed": False,
                }

            target_id_clean = target_id.lower()
            if target_id_clean not in objects_by_id:
                return {
                    "success": False,
                    "command": raw_command,
                    "object_id": target_id,
                    "error_code": "OBJECT_NOT_FOUND",
                    "message": f"Entity '{target_id}' not detected in sector memory matrix.",
                }

            target_obj = objects_by_id[target_id_clean]
            state_lines = [
                f"ID: {target_obj.object_id}",
                f"TYPE: {target_obj.object_type}",
            ]
            for k, v in target_obj.state_json.items():
                state_lines.append(f"{k.upper()}: {v}")

            # Record GameEvent
            event = GameEvent(
                session_id=session.id,
                event_type="DEBUG_SCAN_OBJECT",
                payload_json={"object_id": target_obj.object_id, "state": target_obj.state_json},
            )
            db.add(event)
            await db.commit()

            return {
                "success": True,
                "command": raw_command,
                "object_id": target_obj.object_id,
                "message": "\n".join(state_lines),
                "state_changed": False,
                "updated_state": target_obj.state_json,
            }

        # 3. Match: REWRITE command
        # Syntax: rewrite <object_id>.<property>=<value>
        rewrite_match = re.match(
            r"^rewrite\s+([a-zA-Z0-9_-]+)\.([a-zA-Z0-9_]+)\s*=\s*([a-zA-Z0-9_]+)$",
            trimmed,
            re.IGNORECASE,
        )
        if rewrite_match:
            obj_id, prop_name, raw_value = rewrite_match.groups()
            obj_clean = obj_id.lower()
            prop_clean = prop_name.lower()
            val_clean = raw_value.upper()

            # Validate Object ID
            if obj_clean not in objects_by_id:
                return {
                    "success": False,
                    "command": raw_command,
                    "object_id": obj_id,
                    "error_code": "OBJECT_NOT_FOUND",
                    "message": f"Target object '{obj_id}' not found in active sector.",
                }

            # Validate Property Allowlist
            allowed_props = MUTABLE_PROPERTIES.get(obj_clean, {})
            if prop_clean not in allowed_props:
                return {
                    "success": False,
                    "command": raw_command,
                    "object_id": obj_id,
                    "property": prop_name,
                    "error_code": "PROPERTY_NOT_MUTABLE",
                    "message": f"Property '{prop_name}' is read-only or not mutable on '{obj_id}'.",
                }

            # Validate Value Allowlist
            allowed_values = allowed_props[prop_clean]
            if val_clean not in allowed_values:
                return {
                    "success": False,
                    "command": raw_command,
                    "object_id": obj_id,
                    "property": prop_name,
                    "error_code": "INVALID_VALUE",
                    "message": f"Value '{raw_value}' is invalid for property '{prop_name}'. Allowed: {', '.join(allowed_values)}",
                }

            target_obj = objects_by_id[obj_clean]
            current_state = dict(target_obj.state_json)

            # Apply Domain Rules for door_01
            if obj_clean == "door_01":
                old_val = current_state.get("permission", "USER")
                if val_clean in ["ROOT", "ADMIN"]:
                    current_state["permission"] = "ROOT"
                    current_state["locked"] = False
                    # Elevate corruption level on root elevation
                    session.corruption_level = 74
                    new_val = "ROOT"
                else:
                    current_state["permission"] = "USER"
                    current_state["locked"] = True
                    new_val = "USER"

                target_obj.state_json = current_state

            # Apply Domain Rules for terminal_01 / memory_01
            elif obj_clean == "terminal_01":
                old_val = current_state.get("active", True)
                bool_val = val_clean == "TRUE"
                current_state["active"] = bool_val
                new_val = bool_val
                target_obj.state_json = current_state

            elif obj_clean == "memory_01":
                old_val = current_state.get("discovered", False)
                bool_val = val_clean == "TRUE"
                current_state["discovered"] = bool_val
                new_val = bool_val
                target_obj.state_json = current_state

            # Log Authoritative GameEvent
            event = GameEvent(
                session_id=session.id,
                event_type="DEBUG_REWRITE",
                payload_json={
                    "command": raw_command,
                    "object_id": target_obj.object_id,
                    "property": prop_name,
                    "old_value": old_val,
                    "new_value": new_val,
                    "updated_state": current_state,
                },
            )
            db.add(event)
            await db.commit()

            # Real-time WebSocket Broadcasts to connected session clients
            try:
                from app.websocket.connection_manager import ws_manager
                await ws_manager.broadcast_to_session(
                    session.id,
                    event_type="WORLD_STATE_CHANGED",
                    payload={
                        "object_id": target_obj.object_id,
                        "property": prop_name,
                        "state": current_state,
                    },
                )
                if obj_clean == "door_01" and val_clean in ["ROOT", "ADMIN"]:
                    await ws_manager.broadcast_to_session(
                        session.id,
                        event_type="NULL_CORRUPTION",
                        payload={
                            "level": 74,
                            "trigger": "door_01_root_override",
                            "message": "UNKNOWN PROCESS DETECTED // NULL: hello.",
                        },
                    )
            except Exception:
                pass

            return {
                "success": True,
                "command": raw_command,
                "object_id": target_obj.object_id,
                "property": prop_name,
                "old_value": old_val,
                "new_value": new_val,
                "message": f"Property '{prop_name}' changed successfully to '{new_val}'.",
                "state_changed": True,
                "updated_state": current_state,
            }

        # 4. Unknown/Unsupported Command Format
        return {
            "success": False,
            "command": raw_command,
            "error_code": "INVALID_COMMAND",
            "message": f"Unsupported command: '{raw_command}'. Supported protocols: scan <object_id>, rewrite <object_id>.<property>=<value>",
        }
