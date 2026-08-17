import { useWorldStore } from '../../stores/worldStore';
import { soundEngine } from '../../services/soundEngine';

export interface CommandParseResult {
  success: boolean;
  output: string;
  isError?: boolean;
  isSuccess?: boolean;
  stateChanged?: boolean;
  shouldCloseTerminal?: boolean;
}

export class DebugCommandParser {
  /**
   * Executes a string command safely without eval() or arbitrary execution.
   */
  public static execute(rawCommand: string): CommandParseResult {
    const trimmed = rawCommand.trim();
    if (!trimmed) {
      return { success: true, output: '' };
    }

    const lower = trimmed.toLowerCase();
    const state = useWorldStore.getState();

    // 1. HELP COMMAND
    if (lower === 'help') {
      return {
        success: true,
        output: `=== NULL//ROOT DEBUG PROTOCOLS ===
Available Commands:
  scan <object_id>                   - Inspect an entity in sector 00 (e.g. "scan door_01")
  scan                              - List all detectable interactable entities
  rewrite <object>.<prop>=<value>   - Modify entity memory runtime (e.g. "rewrite door_01.permission=root")
  status                            - Output global sector 00 telemetry summary
  clear                             - Clear terminal buffer
  exit                              - Close debug session`,
        isSuccess: true,
      };
    }

    // 2. STATUS COMMAND
    if (lower === 'status') {
      const door = state.door_01;
      const srv = state.server_01;
      const mem = state.memory_01;
      return {
        success: true,
        output: `SECTOR 00 TELEMETRY:
  CURRENT OBJECTIVE:  ${state.currentObjective}
  DOOR 01:            [${door.status}] (PERMISSION: ${door.permission})
  SERVER 01:          [${srv.status} ${srv.integrity}%]
  MEMORY 01:          [RECOVERED ${mem.recoveryPercentage}%]
  ANOMALY:            NULL PROCESS FOUND (PID 0x00000000)`,
        isSuccess: true,
      };
    }

    // 3. EXIT / CLOSE COMMAND
    if (lower === 'exit' || lower === 'close' || lower === 'quit') {
      return {
        success: true,
        output: 'Closing debug terminal session...',
        shouldCloseTerminal: true,
      };
    }

    // 4. SCAN COMMAND
    if (lower.startsWith('scan')) {
      const parts = trimmed.split(/\s+/);
      if (parts.length === 1) {
        // List all objects
        return {
          success: true,
          output: `DETECTED ENTITIES IN SECTOR 00:
  * door_01      - ${state.door_01.displayName} [${state.door_01.type}]
  * terminal_01  - ${state.terminal_01.displayName} [${state.terminal_01.type}]
  * memory_01    - ${state.memory_01.displayName} [${state.memory_01.type}]
  * server_01    - ${state.server_01.displayName} [${state.server_01.type}]

Use "scan <object_id>" (e.g. "scan door_01") for detailed analysis.`,
          isSuccess: true,
        };
      }

      const targetId = parts[1].toLowerCase();

      if (targetId === 'door_01') {
        const door = state.door_01;
        soundEngine.playSystemLine();
        return {
          success: true,
          output: `OBJECT FOUND

ID: ${door.id}
TYPE: ${door.type}
PERMISSION: ${door.permission}
STATUS: ${door.status}`,
          isSuccess: true,
        };
      }

      if (targetId === 'terminal_01') {
        const term = state.terminal_01;
        soundEngine.playSystemLine();
        return {
          success: true,
          output: `OBJECT FOUND

ID: ${term.id}
TYPE: ${term.type}
NAME: ${term.displayName}
ACCESS: ${term.accessLevel}`,
          isSuccess: true,
        };
      }

      if (targetId === 'memory_01') {
        const mem = state.memory_01;
        soundEngine.playSystemLine();
        return {
          success: true,
          output: `OBJECT FOUND

ID: ${mem.id}
TYPE: ${mem.type}
FILENAME: ${mem.filename}
RECOVERY: ${mem.recoveryPercentage}%`,
          isSuccess: true,
        };
      }

      if (targetId === 'server_01') {
        const srv = state.server_01;
        soundEngine.playSystemLine();
        return {
          success: true,
          output: `OBJECT FOUND

ID: ${srv.id}
TYPE: ${srv.type}
STATUS: ${srv.status}
INTEGRITY: ${srv.integrity}%`,
          isSuccess: true,
        };
      }

      soundEngine.playWarning();
      return {
        success: false,
        output: `ERROR: Object "${parts[1]}" not found in sector memory matrix.\nUse "scan" to list detectable entities.`,
        isError: true,
      };
    }

    // 5. REWRITE COMMAND (e.g. rewrite door_01.permission=root)
    if (lower.startsWith('rewrite')) {
      const rewritePattern = /^rewrite\s+([a-zA-Z0-9_]+)\.([a-zA-Z0-9_]+)\s*=\s*(.+)$/i;
      const match = trimmed.match(rewritePattern);

      if (!match) {
        soundEngine.playWarning();
        return {
          success: false,
          output: `SYNTAX ERROR: Invalid rewrite syntax.\nFormat: rewrite <object_id>.<property>=<value>\nExample: rewrite door_01.permission=root`,
          isError: true,
        };
      }

      const [, objId, propName, rawValue] = match;
      const result = state.rewriteProperty(objId, propName, rawValue);

      if (result.success) {
        soundEngine.playDoorUnlock();
        return {
          success: true,
          output: result.message,
          isSuccess: true,
          stateChanged: true,
        };
      } else {
        soundEngine.playWarning();
        return {
          success: false,
          output: `[DEBUG ERROR]: ${result.message}`,
          isError: true,
        };
      }
    }

    // UNKNOWN COMMAND
    soundEngine.playWarning();
    return {
      success: false,
      output: `COMMAND REJECTED: Unknown instruction "${trimmed}".\nType "help" to view valid command protocols.`,
      isError: true,
    };
  }
}

export default DebugCommandParser;
