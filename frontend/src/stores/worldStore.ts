import { create } from 'zustand';
import { soundEngine } from '../services/soundEngine';

export type PermissionLevel = 'USER' | 'ADMIN' | 'ROOT';
export type DoorStatus = 'LOCKED' | 'UNLOCKED';

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
  // World Entities
  door_01: DoorState;
  terminal_01: TerminalState;
  memory_01: MemoryState;
  server_01: ServerState;

  // Player & Game State
  playerPosition: PlayerPosition;
  currentObjective: string;
  notifications: WorldNotification[];

  // Actions
  setPlayerPosition: (pos: PlayerPosition) => void;
  setTerminalActive: (active: boolean) => void;
  setDoorPermission: (permission: PermissionLevel) => void;
  unlockDoor: () => void;
  setObjective: (objective: string) => void;
  addNotification: (notif: Omit<WorldNotification, 'id' | 'timestamp'>) => void;
  dismissNotification: (id: string) => void;
  rewriteProperty: (
    objectId: string,
    property: string,
    value: string
  ) => { success: boolean; message: string };
  resetWorldState: () => void;
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
  door_01: { ...INITIAL_DOOR_STATE },
  terminal_01: { ...INITIAL_TERMINAL_STATE },
  memory_01: { ...INITIAL_MEMORY_STATE },
  server_01: { ...INITIAL_SERVER_STATE },

  playerPosition: { x: 0, y: 1.65, z: 7.5 },
  currentObjective: 'ACCESS SECURITY DOOR',
  notifications: [],

  setPlayerPosition: (pos) => set({ playerPosition: pos }),

  setTerminalActive: (active) =>
    set((state) => ({
      terminal_01: { ...state.terminal_01, active },
    })),

  setDoorPermission: (permission) => {
    const isRoot = permission === 'ROOT' || permission === 'ADMIN';
    set((state) => ({
      door_01: {
        ...state.door_01,
        permission,
        locked: !isRoot,
        status: isRoot ? 'UNLOCKED' : 'LOCKED',
      },
      currentObjective: isRoot ? 'ENTER SECTOR 02' : state.currentObjective,
    }));

    if (isRoot) {
      soundEngine.playDoorUnlock();
    }
  },

  unlockDoor: () => {
    set((state) => ({
      door_01: {
        ...state.door_01,
        permission: 'ROOT',
        locked: false,
        status: 'UNLOCKED',
      },
      currentObjective: 'ENTER SECTOR 02',
    }));
    soundEngine.playDoorUnlock();
  },

  setObjective: (objective) => set({ currentObjective: objective }),

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

  rewriteProperty: (objectId, property, value) => {
    const objIdLower = objectId.toLowerCase().trim();
    const propLower = property.toLowerCase().trim();
    const valLower = value.toLowerCase().trim();

    if (objIdLower === 'door_01') {
      if (propLower === 'permission' || propLower === 'permissionlevel') {
        if (valLower === 'root' || valLower === 'admin') {
          get().unlockDoor();
          get().addNotification({
            title: 'SECURITY GATE OVERRIDE',
            message: 'Blast door permissions elevated to ROOT. Hydraulic locks disengaged.',
            type: 'SUCCESS',
          });

          return {
            success: true,
            message: `[DEBUG] COMMAND ACCEPTED\n[WORLD] permission = ROOT\n[WORLD] status = UNLOCKED\n[WORLD] Objective Updated: ENTER SECTOR 02`,
          };
        } else if (valLower === 'user') {
          set((state) => ({
            door_01: {
              ...state.door_01,
              permission: 'USER',
              locked: true,
              status: 'LOCKED',
            },
            currentObjective: 'ACCESS SECURITY DOOR',
          }));
          return {
            success: true,
            message: `[DEBUG] COMMAND ACCEPTED\n[WORLD] permission = USER\n[WORLD] status = LOCKED`,
          };
        }
      } else if (propLower === 'locked') {
        const isLocked = valLower === 'true' || valLower === '1';
        if (!isLocked) {
          get().unlockDoor();
        } else {
          set((state) => ({
            door_01: {
              ...state.door_01,
              locked: true,
              status: 'LOCKED',
            },
          }));
        }
        return {
          success: true,
          message: `[DEBUG] COMMAND ACCEPTED\n[WORLD] locked = ${isLocked}\n[WORLD] status = ${!isLocked ? 'UNLOCKED' : 'LOCKED'}`,
        };
      }
    }

    if (objIdLower === 'server_01') {
      if (propLower === 'status') {
        set((state) => ({
          server_01: { ...state.server_01, status: value.toUpperCase() },
        }));
        return { success: true, message: `[WORLD] server_01.status = ${value.toUpperCase()}` };
      }
      if (propLower === 'integrity') {
        const num = parseFloat(value);
        if (!isNaN(num)) {
          const clamped = Math.max(0, Math.min(100, num));
          set((state) => ({
            server_01: { ...state.server_01, integrity: clamped },
          }));
          return { success: true, message: `[WORLD] server_01.integrity = ${clamped}%` };
        }
      }
    }

    if (objIdLower === 'memory_01') {
      if (propLower === 'recovery' || propLower === 'recoverypercentage') {
        const num = parseFloat(value);
        if (!isNaN(num)) {
          const clamped = Math.max(0, Math.min(100, num));
          set((state) => ({
            memory_01: { ...state.memory_01, recoveryPercentage: clamped },
          }));
          return { success: true, message: `[WORLD] memory_01.recovery = ${clamped}%` };
        }
      }
    }

    return {
      success: false,
      message: `INVALID_PROPERTY: Cannot rewrite property "${property}" on entity "${objectId}".`,
    };
  },

  resetWorldState: () =>
    set({
      door_01: { ...INITIAL_DOOR_STATE },
      terminal_01: { ...INITIAL_TERMINAL_STATE },
      memory_01: { ...INITIAL_MEMORY_STATE },
      server_01: { ...INITIAL_SERVER_STATE },
      playerPosition: { x: 0, y: 1.65, z: 7.5 },
      currentObjective: 'ACCESS SECURITY DOOR',
      notifications: [],
    }),
}));
