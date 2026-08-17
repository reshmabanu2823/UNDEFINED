import { ApiClient } from './api';

export type ObjectiveStatus = 'COMPLETED' | 'IN_PROGRESS' | 'LOCKED' | 'CORRUPTED';

export interface ObjectiveItem {
  id: string;
  label: string;
  status: ObjectiveStatus;
}

export interface Quest {
  id: string;
  quest_key: string;
  title: string;
  description: string;
  chapter: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
  current_objective: string;
  objectives: ObjectiveItem[];
  progress_percent: number;
}

export class QuestService {
  /**
   * Lists all matrix quests with objective progression.
   */
  static async listQuests(): Promise<Quest[]> {
    try {
      return await ApiClient.get<Quest[]>('/api/quests');
    } catch (e) {
      console.warn('[QuestService] Failed to fetch quests:', e);
      return [];
    }
  }

  /**
   * Fetches specific quest by ID or Key.
   */
  static async getQuest(questIdOrKey: string): Promise<Quest | null> {
    try {
      return await ApiClient.get<Quest>(`/api/quests/${encodeURIComponent(questIdOrKey)}`);
    } catch {
      return null;
    }
  }

  /**
   * Manually dispatches objective progress if needed.
   */
  static async progressObjective(
    questKey: string,
    objectiveId: string,
    metadata?: any
  ): Promise<Quest | null> {
    try {
      return await ApiClient.post<Quest>(`/api/quests/${encodeURIComponent(questKey)}/progress`, {
        objective_id: objectiveId,
        metadata,
      });
    } catch (e) {
      console.warn('[QuestService] Failed to progress objective:', e);
      return null;
    }
  }
}
