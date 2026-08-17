import re
from typing import Dict, Any
from app.game_engine.world_manager import world_manager


class CommandExecutor:
    """
    Safely parses and executes debug terminal instructions without any eval/Function execution.
    """

    @staticmethod
    def execute(command: str, session_id: str = "default_session") -> Dict[str, Any]:
        trimmed = command.strip()
        if not trimmed:
            return {"success": True, "output": "", "command": command}

        lower = trimmed.lower()
        session = world_manager.get_or_create_session(session_id)

        # 1. HELP
        if lower == "help":
            return {
                "success": True,
                "command": command,
                "output": """=== NULL//ROOT KERNEL DEBUGGER ===
Available Protocols:
  scan <object_id>                  - Inspect target entity in sector
  scan                             - List all detectable entities
  rewrite <obj>.<prop>=<val>        - Overwrite memory property (e.g. rewrite door_01.permission=root)
  status                           - Query sector telemetry
  clear                            - Reset output stream
  exit                             - Close debug shell""",
                "is_success": True,
            }

        # 2. STATUS
        if lower == "status":
            door = session["entities"]["door_01"]
            return {
                "success": True,
                "command": command,
                "output": f"""SECTOR 00 TELEMETRY:
  SESSION:    {session_id}
  OBJECTIVE:  {session['current_objective']}
  CORRUPTION: {session['corruption_level']}%
  DOOR 01:    [{door['status']}] (PERMISSION: {door['permission']})
  ANOMALY:    NULL PROCESS (PID 0x00000000)""",
                "is_success": True,
            }

        # 3. SCAN
        if lower.startswith("scan"):
            parts = trimmed.split()
            if len(parts) == 1:
                entities = session["entities"]
                list_str = "\n".join(
                    [f"  * {k:<12} - [{v.get('type', 'UNKNOWN')}]" for k, v in entities.items()]
                )
                return {
                    "success": True,
                    "command": command,
                    "output": f"DETECTED ENTITIES IN SECTOR 00:\n{list_str}\n\nUse 'scan <id>' for detailed inspection.",
                    "is_success": True,
                }

            target_id = parts[1].lower()
            entities = session["entities"]
            if target_id in entities:
                ent = entities[target_id]
                lines = [f"OBJECT FOUND\n", f"ID: {ent.get('id', target_id)}", f"TYPE: {ent.get('type', 'GENERIC')}"]
                for k, v in ent.items():
                    if k not in ["id", "type", "displayName"]:
                        lines.append(f"{k.upper()}: {v}")
                return {
                    "success": True,
                    "command": command,
                    "output": "\n".join(lines),
                    "is_success": True,
                }
            else:
                return {
                    "success": False,
                    "command": command,
                    "output": f"ERROR: Object '{parts[1]}' not found in sector memory matrix.",
                    "is_error": True,
                }

        # 4. REWRITE
        if lower.startsWith if hasattr(lower, "startsWith") else lower.startswith("rewrite"):
            match = re.match(r"^rewrite\s+([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\s*=\s*(.+)$", trimmed, re.IGNORECASE)
            if not match:
                return {
                    "success": False,
                    "command": command,
                    "output": "SYNTAX ERROR: Invalid rewrite instruction.\nFormat: rewrite <object>.<property>=<value>",
                    "is_error": True,
                }

            obj_id, prop_name, raw_val = match.groups()
            res = world_manager.update_entity_property(session_id, obj_id, prop_name, raw_val)

            return {
                "success": res.get("success", False),
                "command": command,
                "output": res.get("message", "Executed."),
                "is_error": not res.get("success", False),
                "is_success": res.get("success", False),
                "state_changed": res.get("state_changed", False),
                "updated_state": res.get("updated_state"),
            }

        return {
            "success": False,
            "command": command,
            "output": f"COMMAND REJECTED: Instruction '{trimmed}' unrecognized. Type 'help' for protocols.",
            "is_error": True,
        }
