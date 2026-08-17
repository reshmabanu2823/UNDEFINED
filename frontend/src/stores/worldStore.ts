import { create } from 'zustand';
import { soundEngine } from '../services/soundEngine';

export type PermissionLevel = 'USER' | 'ADMIN' | 'ROOT';
export type DoorStatus = 'LOCKED' | 'UNLOCKED';
export type NullEventStage = 'IDLE' | 'FREEZE' | 'BLACKOUT' | 'WARNING' | 'NULL_MESSAGE' | 'COMPLETED';
export type EnemyAIState = 'IDLE' | 'DETECT' | 'CHASE' | 'ATTACK' | 'LOST';
export type ConnectionStatusType = 'DISCONNECTED' | 'CONNECTING' | 'CONNECTED' | 'RECONNECTING' | 'FAILED';

export interface DoorState {
  id: 'door_01';
  type: 'SECURITY DOOR';
  displayName: string;
  locked: boolean;
  permission: PermissionLevel;
  status: DoorStatus;
}

export interface TerminalState {
  id: 'terminal_01';
  type: 'DEBUG TERMINAL';
  displayName: string;
  active: boolean;
  terminalType: string;
  accessLevel: string;
}

export interface MemoryState {
  id: 'memory_01';
  type: 'MEMORY CORE';
  displayName: string;
  filename: string;
  recoveryPercentage: number;
}

export interface ServerState {
  id: 'server_01';
  type: 'QUANTUM SERVER';
  displayName: string;
  status: string;
  integrity: number;
}

export interface ActiveEnemy {
  id: string;
  type: 'NULL_FRAGMENT' | string;
  position: [number, number, number];
  state?: EnemyAIState;
}

export interface WorldNotification {
  id: string;
  title: string;
  message: string;
  type: 'SUCCESS' | 'WARNING' | 'ERROR' | 'INFO';
  timestamp: number;
}

export interface PlayerPosition {
  x: number;
  y: number;
  z: number;
}

export interface WorldStoreState {
  // Required Centralized Game State Fields
  systemIntegrity: number; // 0 - 100
  playerIntegrity: number; // Aliased for backwards compatibility
  corruptionLevel: number; // 20 -> 74
  currentSector: string; // "sector_01"
  currentObjective: string; // "ACCESS SECURITY DOOR" | "ENTER SECTOR 02"
  worldObjects: Record<string, any>;
  activeWarnings: string[];
  activeEnemies: ActiveEnemy[];
  connectionStatus: ConnectionStatusType;

  // World Entities (Direct References)
  door_01: DoorState;
  terminal_01: TerminalState;
  memory_01: MemoryState;
  server_01: ServerState;

  // Player & Gameplay State
  playerPosition: PlayerPosition;
  isSystemFailure: boolean;
  isGameplayFrozen: boolean;
  notifications: WorldNotification[];

  // Corruption & Visual Overlay States
  isBlackout: boolean;
  nullEventStage: NullEventStage;
  nullEntityVisible: boolean;

  // Enemy Threat Telemetry
  enemyState: EnemyAIState;
  enemyDistance: number;

  // Actions
  setConnectionStatus: (status: ConnectionStatusType) => void;
  setPlayerPosition: (pos: PlayerPosition) => void;
  damagePlayer: (amount: number) => void;
  healPlayer: (amount: number) => void;
  setEnemyState: (state: EnemyAIState, distance?: number) => void;
  spawnEnemy: (enemy: ActiveEnemy) => void;
  setTerminalActive: (active: boolean) => void;
  setDoorPermission: (permission: PermissionLevel) => void;
  unlockDoor: () => void;
  setObjective: (objective: string) => void;
  setSector: (sector: string) => void;
  setCorruptionLevel: (level: number) => void;
  addNotification: (notif: Omit<WorldNotification, 'id' | 'timestamp'>) => void;
  dismissNotification: (id: string) => void;
  clearWarnings: () => void;

  // Authoritative Backend Event Consumer
  handleBackendCorruptionEvent: (payload: {
    previous_level?: number;
    new_level?: number;
    severity?: string;
    message?: string;
  }) => void;

  rewriteProperty: (
    objectId: string,
    property: string,
    value: string
  ) => { success: boolean; message: string };

  triggerNullCorruptionEvent: () => void;
  resetWorldState: () => void;
  rebootSystem: () => void;
}

const INITIAL_DOOR_STATE: DoorState = {
  id: 'door_01',
  type: 'SECURITY DOOR',
  displayName: 'SECURITY BLAST DOOR',
  locked: true,
  permission: 'USER',
  status: 'LOCKED',
};

const INITIAL_TERMINAL_STATE: TerminalState = {
  id: 'terminal_01',
  type: 'DEBUG TERMINAL',
  displayName: 'CENTRAL DEBUG TERMINAL',
  active: false,
  terminalType: 'KERNEL_DEBUG_SHELL',
  accessLevel: 'USER_L1',
};

const INITIAL_MEMORY_STATE: MemoryState = {
  id: 'memory_01',
  type: 'MEMORY CORE',
  displayName: 'NEURAL MEMORY CORE',
  filename: 'cortex_leak_0x00.mem',
  recoveryPercentage: 34.2,
};

const INITIAL_SERVER_STATE: ServerState = {
  id: 'server_01',
  type: 'QUANTUM SERVER',
  displayName: 'QUANTUM SERVER NODE 01',
  status: 'CORRUPTED_OVERLOAD',
  integrity: 58.4,
};

export const useWorldStore = create<WorldStoreState>((set, get) => ({
  // Core Centralized Fields
  systemIntegrity: 100,
  playerIntegrity: 100,
  corruptionLevel: 20,
  currentSector: 'sector_01',
  currentObjective: 'ACCESS SECURITY DOOR',
  worldObjects: {
    door_01: { ...INITIAL_DOOR_STATE },
    terminal_01: { ...INITIAL_TERMINAL_STATE },
    memory_01: { ...INITIAL_MEMORY_STATE },
    server_01: { ...INITIAL_SERVER_STATE },
  },
  activeWarnings: [],
  activeEnemies: [],
  connectionStatus: 'DISCONNECTED',

  // World Entities
  door_01: { ...INITIAL_DOOR_STATE },
  terminal_01: { ...INITIAL_TERMINAL_STATE },
  memory_01: { ...INITIAL_MEMORY_STATE },
  server_01: { ...INITIAL_SERVER_STATE },

  // Player & Gameplay State
  playerPosition: { x: 0, y: 1.65, z: 7.5 },
  isSystemFailure: false,
  isGameplayFrozen: false,
  notifications: [],

  // Initial Corruption Level: 20%
  isBlackout: false,
  nullEventStage: 'IDLE',
  nullEntityVisible: false,

  enemyState: 'IDLE',
  enemyDistance: 999,

  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setSector: (sector) => set({ currentSector: sector }),

  setPlayerPosition: (pos) => set({ playerPosition: pos }),

  damagePlayer: (amount) => {
    const current = get().systemIntegrity;
    if (current <= 0 || get().isSystemFailure) return;

    const next = Math.max(0, current - amount);
    soundEngine.playWarning();

    if (next <= 0) {
      set({ systemIntegrity: 0, playerIntegrity: 0, isSystemFailure: true });
      soundEngine.playNullAwakeningSound();
    } else {
      set({ systemIntegrity: next, playerIntegrity: next });
    }
  },

  healPlayer: (amount) => {
    set((state) => {
      const next = Math.min(100, state.systemIntegrity + amount);
      return { systemIntegrity: next, playerIntegrity: next };
    });
  },

  setEnemyState: (state, distance = 999) => {
    set({ enemyState: state, enemyDistance: distance });
  },

  spawnEnemy: (enemy) => {
    set((state) => {
      const exists = state.activeEnemies.some((e) => e.id === enemy.id);
      if (exists) return state;
      return { activeEnemies: [...state.activeEnemies, enemy] };
    });
  },

  setTerminalActive: (active) =>
    set((state) => ({
      terminal_01: { ...state.terminal_01, active },
      worldObjects: {
        ...state.worldObjects,
        terminal_01: { ...state.terminal_01, active },
      },
    })),

  setDoorPermission: (permission) => {
    const isRoot = permission === 'ROOT' || permission === 'ADMIN';
    set((state) => {
      const updatedDoor: DoorState = {
        ...state.door_01,
        permission,
        locked: !isRoot,
        status: isRoot ? 'UNLOCKED' : 'LOCKED',
      };
      return {
        door_01: updatedDoor,
        worldObjects: {
          ...state.worldObjects,
          door_01: updatedDoor,
        },
        currentObjective: isRoot ? 'ENTER SECTOR 02' : 'ACCESS SECURITY DOOR',
      };
    });
  },

  unlockDoor: () => {
    set((state) => {
      const updatedDoor: DoorState = {
        ...state.door_01,
        permission: 'ROOT',
        locked: false,
        status: 'UNLOCKED',
      };
      return {
        door_01: updatedDoor,
        worldObjects: { ...state.worldObjects, door_01: updatedDoor },
        currentObjective: 'ENTER SECTOR 02',
      };
    });
    soundEngine.playDoorUnlock();
  },

  setObjective: (objective) => set({ currentObjective: objective }),

  setCorruptionLevel: (level) => set({ corruptionLevel: level }),

  addNotification: (notif) => {
    const newNotif: WorldNotification = {
      ...notif,
      id: `notif_${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
    };
    set((state) => ({
      notifications: [newNotif, ...state.notifications.slice(0, 4)],
    }));
  },

  dismissNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  clearWarnings: () => set({ activeWarnings: [] }),

  // CONSUMES AUTHORITATIVE NULL_CORRUPTION FROM FASTAPI BACKEND WEBSOCKET
  handleBackendCorruptionEvent: (payload) => {
    const prevLvl = payload.previous_level ?? 20;
    const targetLvl = payload.new_level ?? 74;

    // 1. Freeze normal gameplay very briefly
    set((state) => ({
      nullEventStage: 'FREEZE',
      isGameplayFrozen: true,
      activeWarnings: ['SYSTEM WARNING: UNKNOWN PROCESS DETECTED'],
      door_01: {
        ...state.door_01,
        permission: 'ROOT',
        locked: false,
        status: 'UNLOCKED',
      },
      currentObjective: 'ENTER SECTOR 02',
    }));
    soundEngine.playDoorUnlock();

    // 2. Blackout & Light Flicker (0.6s - 0.9s)
    setTimeout(() => {
      set({ isBlackout: true, nullEventStage: 'BLACKOUT' });
      soundEngine.playGlitch();

      setTimeout(() => {
        // 3. SYSTEM WARNING: UNKNOWN PROCESS DETECTED
        set({
          isBlackout: false,
          nullEventStage: 'WARNING',
          nullEntityVisible: true,
        });
        soundEngine.playNullAwakeningSound();

        // 4. Animate Corruption Meter: 20% -> 74%
        let currentLvl = prevLvl;
        const interval = setInterval(() => {
          currentLvl += 3;
          if (currentLvl >= targetLvl) {
            currentLvl = targetLvl;
            clearInterval(interval);
          }
          set({ corruptionLevel: currentLvl });
        }, 50);

        // 5. Reveal NULL: hello.
        setTimeout(() => {
          set({ nullEventStage: 'NULL_MESSAGE' });
          soundEngine.playWarning();

          // 6. Spawn NULL_FRAGMENT enemy & resume gameplay
          setTimeout(() => {
            set((state) => ({
              nullEventStage: 'COMPLETED',
              nullEntityVisible: false,
              isGameplayFrozen: false,
              activeEnemies: [
                ...state.activeEnemies.filter((e) => e.id !== 'null_fragment_01'),
                {
                  id: 'null_fragment_01',
                  type: 'NULL_FRAGMENT',
                  position: [0, 1.2, -6.5],
                  state: 'DETECT',
                },
              ],
            }));

            get().addNotification({
              title: 'CORRUPTION SURGE // SECTOR 01',
              message: payload.message || 'NULL process active in sector. Entity materialized.',
              type: 'ERROR',
            });
          }, 3200);
        }, 2200);
      }, 750);
    }, 300);
  },

  rewriteProperty: (objectId, property, value) => {
    const objIdLower = objectId.toLowerCase().trim();
    const propLower = property.toLowerCase().trim();
    const valLower = value.toLowerCase().trim();

    if (objIdLower === 'door_01') {
      if (propLower === 'permission') {
        if (valLower === 'root' || valLower === 'admin') {
          get().triggerNullCorruptionEvent();
          return { success: true, message: '[DEBUG] PERMISSION ELEVATED TO ROOT' };
        } else {
          get().setDoorPermission('USER');
          return { success: true, message: '[DEBUG] PERMISSION SET TO USER' };
        }
      }
    }
    return { success: true, message: `[DEBUG] ${objectId}.${property} updated.` };
  },

  triggerNullCorruptionEvent: () => {
    get().handleBackendCorruptionEvent({
      previous_level: get().corruptionLevel,
      new_level: 74,
      severity: 'HIGH',
      message: 'Unknown process detected',
    });
  },

  resetWorldState: () =>
    set({
      systemIntegrity: 100,
      playerIntegrity: 100,
      corruptionLevel: 20,
      currentSector: 'sector_01',
      currentObjective: 'ACCESS SECURITY DOOR',
      worldObjects: {
        door_01: { ...INITIAL_DOOR_STATE },
        terminal_01: { ...INITIAL_TERMINAL_STATE },
        memory_01: { ...INITIAL_MEMORY_STATE },
        server_01: { ...INITIAL_SERVER_STATE },
      },
      activeWarnings: [],
      activeEnemies: [],
      door_01: { ...INITIAL_DOOR_STATE },
      terminal_01: { ...INITIAL_TERMINAL_STATE },
      memory_01: { ...INITIAL_MEMORY_STATE },
      server_01: { ...INITIAL_SERVER_STATE },
      playerPosition: { x: 0, y: 1.65, z: 7.5 },
      isSystemFailure: false,
      isGameplayFrozen: false,
      notifications: [],
      isBlackout: false,
      nullEventStage: 'IDLE',
      nullEntityVisible: false,
      enemyState: 'IDLE',
      enemyDistance: 999,
    }),

  rebootSystem: () => {
    soundEngine.playBootTransition();
    get().resetWorldState();
  },
}));
