from typing import Dict, Any, Optional


class WorldManager:
    """
    Manages in-memory authoritative sector states and handles real-time synchronization.
    """

    def __init__(self):
        self._sessions: Dict[str, Dict[str, Any]] = {}

    def get_or_create_session(self, session_id: str) -> Dict[str, Any]:
        if session_id not in self._sessions:
            self._sessions[session_id] = {
                "session_id": session_id,
                "sector": "SECTOR_00",
                "current_objective": "ACCESS SECURITY DOOR",
                "corruption_level": 21,
                "player_integrity": 100,
                "entities": {
                    "door_01": {
                        "id": "door_01",
                        "type": "SECURITY DOOR",
                        "permission": "USER",
                        "status": "LOCKED",
                        "locked": True,
                    },
                    "terminal_01": {
                        "id": "terminal_01",
                        "type": "DEBUG TERMINAL",
                        "displayName": "CENTRAL DEBUG TERMINAL",
                        "accessLevel": "USER_L1",
                        "active": False,
                    },
                    "memory_01": {
                        "id": "memory_01",
                        "type": "MEMORY CORE",
                        "filename": "cortex_leak_0x00.mem",
                        "recoveryPercentage": 34.2,
                    },
                    "server_01": {
                        "id": "server_01",
                        "type": "QUANTUM SERVER",
                        "status": "CORRUPTED_OVERLOAD",
                        "integrity": 58.4,
                    },
                },
            }
        return self._sessions[session_id]

    def update_entity_property(
        self, session_id: str, object_id: str, property_name: str, value: str
    ) -> Dict[str, Any]:
        session = self.get_or_create_session(session_id)
        obj_lower = object_id.lower().strip()
        prop_lower = property_name.lower().strip()
        val_lower = value.lower().strip()

        entities = session["entities"]
        if obj_lower not in entities:
            return {
                "success": False,
                "message": f"ERROR: Entity '{object_id}' not found in sector matrix.",
            }

        target = entities[obj_lower]

        if obj_lower == "door_01":
            if prop_lower in ["permission", "permissionlevel"]:
                if val_lower in ["root", "admin"]:
                    target["permission"] = "ROOT"
                    target["locked"] = False
                    target["status"] = "UNLOCKED"
                    session["current_objective"] = "ENTER SECTOR 02"
                    session["corruption_level"] = 74
                    return {
                        "success": True,
                        "state_changed": True,
                        "message": "[DEBUG] COMMAND ACCEPTED\n[WORLD] permission = ROOT\n[WORLD] status = UNLOCKED\n[WORLD] Objective: ENTER SECTOR 02",
                        "updated_state": session,
                    }
                elif val_lower == "user":
                    target["permission"] = "USER"
                    target["locked"] = True
                    target["status"] = "LOCKED"
                    return {
                        "success": True,
                        "state_changed": True,
                        "message": "[DEBUG] COMMAND ACCEPTED\n[WORLD] permission = USER\n[WORLD] status = LOCKED",
                        "updated_state": session,
                    }

        return {
            "success": False,
            "message": f"INVALID_PROPERTY: Cannot rewrite '{property_name}' on '{object_id}'.",
        }


world_manager = WorldManager()
