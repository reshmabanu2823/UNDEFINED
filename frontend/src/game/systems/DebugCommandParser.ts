import { worldState, WorldGameObject } from './WorldState';
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
      const door = worldState.getDoorState();
      return {
        success: true,
        output: `SECTOR 00 TELEMETRY:
  SESSION:    ROOT_DEBUGGER_ACTIVE
  DOOR 01:    [${door.status}] (PERMISSION: ${door.permission})
  SERVER 01:  [OVERLOAD 58.4%]
  MEMORY 01:  [RECOVERED 34.2%]
  ANOMALY:    NULL PROCESS (PID 0x00000000)`,
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
        const all = worldState.getAllObjects();
        const listText = all
          .map((obj) => `  * ${obj.id.padEnd(12)} - ${obj.displayName} [${obj.type}]`)
          .join('\n');

        return {
          success: true,
          output: `DETECTED ENTITIES IN SECTOR 00:\n${listText}\n\nUse "scan <id>" (e.g. "scan door_01") for detailed analysis.`,
          isSuccess: true,
        };
      }

      const targetId = parts[1].toLowerCase();
      const obj = worldState.getObject(targetId);

      if (!obj) {
        soundEngine.playWarning();
        return {
          success: false,
          output: `ERROR: Object "${parts[1]}" not found in sector memory matrix.\nUse "scan" to list detectable entities.`,
          isError: true,
        };
      }

      soundEngine.playSystemLine();
      return {
        success: true,
        output: this.formatScanOutput(obj),
        isSuccess: true,
      };
    }

    // 5. REWRITE COMMAND (e.g. rewrite door_01.permission=root)
    if (lower.startsWith('rewrite')) {
      // Regex pattern to match: rewrite <object_id>.<property>=<value>
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
      const result = worldState.updateProperty(objId, propName, rawValue);

      if (result.success) {
        soundEngine.playBootTransition();
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

  private static formatScanOutput(obj: WorldGameObject): string {
    if (obj.id === 'door_01') {
      return `OBJECT FOUND

ID: ${obj.id}
TYPE: ${obj.type}
PERMISSION: ${obj.permission}
STATUS: ${obj.status}`;
    }

    if (obj.id === 'terminal_01') {
      return `OBJECT FOUND

ID: ${obj.id}
TYPE: ${obj.type}
NAME: ${obj.displayName}
ACCESS: ${obj.accessLevel}`;
    }

    if (obj.id === 'memory_01') {
      return `OBJECT FOUND

ID: ${obj.id}
TYPE: ${obj.type}
FILENAME: ${obj.filename}
RECOVERY: ${obj.recoveryPercentage}%`;
    }

    if (obj.id === 'server_01') {
      return `OBJECT FOUND

ID: ${obj.id}
TYPE: ${obj.type}
STATUS: ${obj.status}
INTEGRITY: ${obj.integrity}%`;
    }

    return `OBJECT FOUND\nID: ${(obj as any).id}\nTYPE: ${(obj as any).type}`;
  }
}
