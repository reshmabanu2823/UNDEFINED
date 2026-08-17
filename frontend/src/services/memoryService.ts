import { ApiClient } from './api';

export type MemoryStatus = 'RECOVERED' | 'PARTIAL' | 'CORRUPTED' | 'LOCKED';

export interface MemoryFragment {
  id: string;
  memory_key: string;
  title: string;
  content: string;
  integrity: number;
  chapter: string;
  discovered: boolean;
  discovered_at?: string | null;
}

export class MemoryService {
  /**
   * Evaluates the visual classification status of a memory core based on integrity.
   */
  static getStatus(integrity: number, discovered: boolean): MemoryStatus {
    if (!discovered) return 'LOCKED';
    if (integrity >= 100) return 'RECOVERED';
    if (integrity >= 40) return 'PARTIAL';
    return 'CORRUPTED';
  }

  /**
   * Lists all matrix memories from the authoritative backend.
   */
  static async listMemories(): Promise<MemoryFragment[]> {
    try {
      return await ApiClient.get<MemoryFragment[]>('/api/memories');
    } catch (e) {
      console.warn('[MemoryService] Failed to fetch memories:', e);
      return [];
    }
  }

  /**
   * Fetches specific memory by key.
   */
  static async getMemory(key: string): Promise<MemoryFragment | null> {
    try {
      return await ApiClient.get<MemoryFragment>(`/api/memories/${encodeURIComponent(key)}`);
    } catch {
      return null;
    }
  }

  /**
   * Discovers and decrypts a memory fragment on the server.
   */
  static async discoverMemory(key: string): Promise<MemoryFragment | null> {
    try {
      const res = await ApiClient.post<{ success: boolean; memory: MemoryFragment }>(
        `/api/memories/${encodeURIComponent(key)}/discover`,
        {}
      );
      return res.memory;
    } catch (e) {
      console.warn('[MemoryService] Failed to discover memory:', e);
      return null;
    }
  }
}
