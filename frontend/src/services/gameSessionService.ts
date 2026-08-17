import { ApiClient } from './api';
import { useWorldStore } from '../stores/worldStore';

export interface GameSessionSummary {
  id: string;
  user_id: string;
  current_chapter: number;
  current_sector: string;
  system_integrity: number;
  corruption_level: number;
  debug_energy: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GameSessionDetailResponse {
  id: string;
  user_id: string;
  current_chapter: number;
  current_sector: string;
  system_integrity: number;
  corruption_level: number;
  debug_energy: number;
  is_active: boolean;
  world_objects: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface SaveSlotResponse {
  id: string;
  user_id: string;
  game_session_id?: string;
  save_name: string;
  slot_number: number;
  serialized_game_state: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface SerializedGameState {
  chapter: number;
  sector: string;
  system_integrity: number;
  corruption_level: number;
  debug_abilities: string[];
  debug_energy: number;
  world_object_states: Record<string, any>;
  discovered_memories: any[];
  quest_progress: Record<string, any>;
  player_position: { x: number; y: number; z: number };
}

export class GameSessionService {
  /**
   * Ensures the operator is authenticated against the backend.
   */
  static async ensureAuthenticated(): Promise<string> {
    const token = ApiClient.getToken();
    if (token) return token;

    try {
      const creds = {
        email: 'operator_01@nullroot.net',
        password: 'Password123!',
      };
      try {
        const loginRes = await ApiClient.post<{ access_token: string }>('/api/auth/login', creds);
        ApiClient.setToken(loginRes.access_token);
        return loginRes.access_token;
      } catch {
        await ApiClient.post('/api/auth/register', {
          username: 'OPERATOR_01',
          email: creds.email,
          password: creds.password,
        });
        const loginRes = await ApiClient.post<{ access_token: string }>('/api/auth/login', creds);
        ApiClient.setToken(loginRes.access_token);
        return loginRes.access_token;
      }
    } catch (e) {
      console.warn('[GameSessionService] Auth fallback notice:', e);
      return '';
    }
  }

  /**
   * Retrieves all game sessions for authenticated operator.
   */
  static async listSessions(): Promise<GameSessionSummary[]> {
    try {
      await this.ensureAuthenticated();
      return await ApiClient.get<GameSessionSummary[]>('/api/game/sessions');
    } catch (e) {
      console.warn('[GameSessionService] Failed to list sessions:', e);
      return [];
    }
  }

  /**
   * Initializes a new authoritative game session on the server.
   */
  static async createSession(customName?: string): Promise<GameSessionDetailResponse> {
    try {
      await this.ensureAuthenticated();
      const session = await ApiClient.post<GameSessionDetailResponse>('/api/game/sessions', {
        custom_name: customName,
      });
      localStorage.setItem('null_root_session_id', session.id);
      this.applySessionToWorld(session);
      return session;
    } catch (e) {
      console.warn('[GameSessionService] Initializing resilient session:', e);
      const fallbackSession: GameSessionDetailResponse = {
        id: 'session_' + Math.random().toString(36).substring(2, 10),
        user_id: 'guest_operator',
        current_chapter: 1,
        current_sector: 'sector_01',
        system_integrity: 100,
        corruption_level: 20,
        debug_energy: 100,
        is_active: true,
        world_objects: {
          door_01: { locked: true, permission: 'USER' },
          terminal_01: { active: true },
          memory_01: { filename: 'MEMORY_01.dat', recoveryPercentage: 34.2 },
          server_01: { status: 'CORRUPTED_OVERLOAD', integrity: 58.4 },
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      localStorage.setItem('null_root_session_id', fallbackSession.id);
      this.applySessionToWorld(fallbackSession);
      return fallbackSession;
    }
  }

  /**
   * Reconstructs full game session from server database.
   */
  static async getSession(sessionId: string): Promise<GameSessionDetailResponse | null> {
    try {
      await this.ensureAuthenticated();
      return await ApiClient.get<GameSessionDetailResponse>(`/api/game/sessions/${sessionId}`);
    } catch {
      return null;
    }
  }

  /**
   * Persists an authoritative checkpoint snapshot.
   */
  static async saveSession(
    sessionId: string,
    saveName: string = 'CHECKPOINT_MANUAL',
    slotNumber: number = 1
  ): Promise<SaveSlotResponse> {
    const serializedState = this.serializeCurrentWorldState();

    return await ApiClient.post<SaveSlotResponse>(`/api/game/sessions/${sessionId}/save`, {
      save_name: saveName,
      slot_number: slotNumber,
      client_state: {
        debug_abilities: serializedState.debug_abilities,
        discovered_memories: serializedState.discovered_memories,
        quest_progress: serializedState.quest_progress,
        player_position: serializedState.player_position,
      },
    });
  }

  /**
   * Restores session and world objects from server checkpoint.
   */
  static async loadSession(
    sessionId: string,
    slotNumber: number = 1
  ): Promise<GameSessionDetailResponse> {
    const detail = await ApiClient.post<GameSessionDetailResponse>(
      `/api/game/sessions/${sessionId}/load`,
      { slot_number: slotNumber }
    );
    this.applySessionToWorld(detail);
    localStorage.setItem('null_root_session_id', detail.id);
    return detail;
  }

  /**
   * Permanently purges a game session.
   */
  static async deleteSession(sessionId: string): Promise<boolean> {
    try {
      const res = await fetch(`${(import.meta as any).env?.VITE_API_URL || 'http://localhost:8000'}/api/game/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${ApiClient.getToken()}`,
        },
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  /**
   * Dedicated game-state serializer (does NOT capture React UI/Component state).
   */
  static serializeCurrentWorldState(): SerializedGameState {
    const state = useWorldStore.getState();

    return {
      chapter: 1,
      sector: state.currentSector || 'sector_01',
      system_integrity: state.systemIntegrity,
      corruption_level: state.corruptionLevel,
      debug_abilities: ['scan', 'rewrite'],
      debug_energy: 100,
      world_object_states: {
        door_01: {
          locked: state.door_01.locked,
          permission: state.door_01.permission,
          status: state.door_01.status,
        },
        terminal_01: {
          active: state.terminal_01.active,
        },
        memory_01: {
          filename: state.memory_01.filename,
          recoveryPercentage: state.memory_01.recoveryPercentage,
        },
        server_01: {
          status: state.server_01.status,
          integrity: state.server_01.integrity,
        },
      },
      discovered_memories: [
        {
          id: 'memory_01',
          filename: state.memory_01.filename,
          recoveryPercentage: state.memory_01.recoveryPercentage,
        },
      ],
      quest_progress: {
        current_objective: state.currentObjective,
      },
      player_position: state.playerPosition,
    };
  }

  /**
   * Applies server-reconstructed session detail into Zustand world store.
   */
  static applySessionToWorld(session: GameSessionDetailResponse) {
    const store = useWorldStore.getState();

    const worldObjs = session.world_objects || {};
    const doorState = worldObjs.door_01 || {};
    const perm = doorState.permission || 'USER';
    const isLocked = doorState.locked !== undefined ? doorState.locked : perm !== 'ROOT';

    useWorldStore.setState({
      systemIntegrity: session.system_integrity,
      playerIntegrity: session.system_integrity,
      corruptionLevel: session.corruption_level,
      currentSector: session.current_sector || 'sector_01',
      currentObjective:
        perm === 'ROOT' || !isLocked ? 'ENTER SECTOR 02' : 'ACCESS SECURITY DOOR',
      door_01: {
        ...store.door_01,
        permission: perm,
        locked: isLocked,
        status: isLocked ? 'LOCKED' : 'UNLOCKED',
      },
      terminal_01: {
        ...store.terminal_01,
        active: worldObjs.terminal_01?.active ?? false,
      },
      memory_01: {
        ...store.memory_01,
        recoveryPercentage: worldObjs.memory_01?.recoveryPercentage ?? 34.2,
      },
      server_01: {
        ...store.server_01,
        status: worldObjs.server_01?.status ?? 'CORRUPTED_OVERLOAD',
        integrity: worldObjs.server_01?.integrity ?? 58.4,
      },
      nullEventStage: session.corruption_level > 50 ? 'COMPLETED' : 'IDLE',
    });
  }
}
