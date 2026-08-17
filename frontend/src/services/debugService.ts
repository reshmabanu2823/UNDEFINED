import { ApiClient } from './api';

export interface DebugExecuteRequest {
  session_id: string;
  command: string;
}

export interface DebugExecuteResponse {
  success: boolean;
  command: string;
  object_id?: string | null;
  property?: string | null;
  old_value?: any;
  new_value?: any;
  message: string;
  error_code?: string | null;
  state_changed: boolean;
  updated_state?: Record<string, any> | null;
}

export class DebugService {
  /**
   * Executes a debug command against the authoritative FastAPI backend.
   */
  static async executeCommand(
    command: string,
    sessionId?: string
  ): Promise<DebugExecuteResponse> {
    const activeSessionId = sessionId || ApiClient.getSessionId();

    try {
      const response = await ApiClient.post<DebugExecuteResponse>(
        '/api/debug/execute',
        {
          session_id: activeSessionId,
          command,
        }
      );
      return response;
    } catch (err: any) {
      // Handle Network / Backend Offline gracefully
      if (err.data && typeof err.data === 'object') {
        return {
          success: false,
          command,
          error_code: err.data.error || err.data.error_code || 'EXECUTION_ERROR',
          message: err.data.message || err.data.detail || err.message,
          state_changed: false,
        };
      }

      return {
        success: false,
        command,
        error_code: 'NETWORK_ERROR',
        message: 'CONNECTION ERROR\nSYSTEM UNREACHABLE',
        state_changed: false,
      };
    }
  }
}
