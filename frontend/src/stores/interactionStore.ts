import { useState, useCallback } from 'react';

export type InteractableType = 'DOOR' | 'TERMINAL' | 'MEMORY' | 'SERVER';

export interface SecurityDoorData {
  id: 'door_01';
  type: 'DOOR';
  displayName: string;
  locked: boolean;
  permissionLevel: 'USER' | 'ADMIN' | 'ROOT';
  status: 'LOCKED' | 'UNLOCKED' | 'ERROR';
}

export interface TerminalData {
  id: 'terminal_01';
  type: 'TERMINAL';
  displayName: string;
  terminalType: string;
  accessLevel: string;
  logs: string[];
}

export interface MemoryFileData {
  id: 'memory_01';
  type: 'MEMORY';
  displayName: string;
  filename: string;
  recoveryPercentage: number;
  recordedDate: string;
  author: string;
  contentSnippet: string;
}

export interface ServerNodeData {
  id: 'server_01';
  type: 'SERVER';
  displayName: string;
  systemStatus: string;
  integrity: number;
  allocatedCores: number;
  sector: string;
}

export type InteractableObject = SecurityDoorData | TerminalData | MemoryFileData | ServerNodeData;

export const INITIAL_INTERACTION_STATE: Record<string, InteractableObject> = {
  door_01: {
    id: 'door_01',
    type: 'DOOR',
    displayName: 'SECURITY BLAST DOOR',
    locked: true,
    permissionLevel: 'USER',
    status: 'LOCKED',
  },
  terminal_01: {
    id: 'terminal_01',
    type: 'TERMINAL',
    displayName: 'CENTRAL DEBUG TERMINAL',
    terminalType: 'KERNEL_DEBUG_SHELL',
    accessLevel: 'USER_CLEARANCE_L1',
    logs: [
      '[SYSTEM]: Kernel version 4.19 initialized at 0x7FFF08.',
      '[ANOMALY]: Unidentified NULL thread detected in sector 00.',
      '[MEMORY]: Heap corruption rate at 42.8 KB/sec.',
      '[DEBUG]: Type "help" or "scan" for diagnostic routines.',
    ],
  },
  memory_01: {
    id: 'memory_01',
    type: 'MEMORY',
    displayName: 'NEURAL MEMORY CORE',
    filename: 'cortex_leak_0x00.mem',
    recoveryPercentage: 34.2,
    recordedDate: '2088-08-17 // 23:14:02 UTC',
    author: 'SUBJECT_NULL // ARCHIVE',
    contentSnippet:
      '...the core partitions are fragmenting. If the operator fails to stabilize the neural bridge before synchronization drops below 10%, the consciousness matrix will collapse into the root partition...',
  },
  server_01: {
    id: 'server_01',
    type: 'SERVER',
    displayName: 'QUANTUM SERVER NODE 01',
    systemStatus: 'CORRUPTED_OVERLOAD',
    integrity: 58.4,
    allocatedCores: 64,
    sector: 'SECTOR_00_RACK_ALPHA',
  },
};

// Global singleton hook / state for interaction
class InteractionManager {
  private listeners = new Set<() => void>();
  private targeted: InteractableObject | null = null;
  private activeModal: InteractableObject | null = null;
  private objectsState: Record<string, InteractableObject> = { ...INITIAL_INTERACTION_STATE };

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  public getTargeted(): InteractableObject | null {
    return this.targeted;
  }

  public setTargeted(target: InteractableObject | null) {
    if (this.targeted?.id !== target?.id) {
      this.targeted = target;
      this.notify();
    }
  }

  public getActiveModal(): InteractableObject | null {
    return this.activeModal;
  }

  public openModal(target: InteractableObject) {
    this.activeModal = this.objectsState[target.id] || target;
    this.notify();
  }

  public closeModal() {
    this.activeModal = null;
    this.notify();
  }

  public getObject(id: string): InteractableObject | undefined {
    return this.objectsState[id];
  }

  public updateObject<T extends InteractableObject>(id: string, updates: Partial<T>) {
    if (this.objectsState[id]) {
      this.objectsState[id] = { ...this.objectsState[id], ...updates } as InteractableObject;
      if (this.activeModal?.id === id) {
        this.activeModal = this.objectsState[id];
      }
      this.notify();
    }
  }
}

export const interactionManager = new InteractionManager();

export function useInteractionState() {
  const [, setTick] = useState(0);

  const forceUpdate = useCallback(() => {
    setTick((t) => t + 1);
  }, []);

  useState(() => {
    return interactionManager.subscribe(forceUpdate);
  });

  return {
    targeted: interactionManager.getTargeted(),
    activeModal: interactionManager.getActiveModal(),
    openModal: (obj: InteractableObject) => interactionManager.openModal(obj),
    closeModal: () => interactionManager.closeModal(),
    updateObject: <T extends InteractableObject>(id: string, updates: Partial<T>) =>
      interactionManager.updateObject(id, updates),
  };
}
