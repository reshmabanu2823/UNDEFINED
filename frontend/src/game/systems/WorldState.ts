export type PermissionLevel = 'USER' | 'ADMIN' | 'ROOT';
export type DoorStatus = 'LOCKED' | 'UNLOCKED' | 'OVERRIDDEN';

export interface WorldDoorObject {
  id: 'door_01';
  type: 'SECURITY DOOR';
  displayName: string;
  locked: boolean;
  permission: PermissionLevel;
  status: DoorStatus;
  accessCode?: string;
}

export interface WorldTerminalObject {
  id: 'terminal_01';
  type: 'DEBUG TERMINAL';
  displayName: string;
  terminalType: string;
  accessLevel: string;
}

export interface WorldMemoryObject {
  id: 'memory_01';
  type: 'MEMORY CORE';
  displayName: string;
  filename: string;
  recoveryPercentage: number;
}

export interface WorldServerObject {
  id: 'server_01';
  type: 'QUANTUM SERVER';
  displayName: string;
  status: string;
  integrity: number;
}

export type WorldGameObject =
  | WorldDoorObject
  | WorldTerminalObject
  | WorldMemoryObject
  | WorldServerObject;

export interface WorldNotification {
  id: string;
  title: string;
  message: string;
  type: 'SUCCESS' | 'WARNING' | 'ERROR' | 'INFO';
  timestamp: number;
}

class WorldStateManager {
  private listeners = new Set<() => void>();
  private notifications: WorldNotification[] = [];

  private objects: Record<string, WorldGameObject> = {
    door_01: {
      id: 'door_01',
      type: 'SECURITY DOOR',
      displayName: 'SECURITY BLAST DOOR',
      locked: true,
      permission: 'USER',
      status: 'LOCKED',
    },
    terminal_01: {
      id: 'terminal_01',
      type: 'DEBUG TERMINAL',
      displayName: 'CENTRAL DEBUG TERMINAL',
      terminalType: 'KERNEL_DEBUG_SHELL',
      accessLevel: 'USER_L1',
    },
    memory_01: {
      id: 'memory_01',
      type: 'MEMORY CORE',
      displayName: 'NEURAL MEMORY CORE',
      filename: 'cortex_leak_0x00.mem',
      recoveryPercentage: 34.2,
    },
    server_01: {
      id: 'server_01',
      type: 'QUANTUM SERVER',
      displayName: 'QUANTUM SERVER NODE 01',
      status: 'CORRUPTED_OVERLOAD',
      integrity: 58.4,
    },
  };

  public subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  public getObject(id: string): WorldGameObject | undefined {
    return this.objects[id];
  }

  public getAllObjects(): WorldGameObject[] {
    return Object.values(this.objects);
  }

  public getDoorState(): WorldDoorObject {
    return this.objects['door_01'] as WorldDoorObject;
  }

  public updateProperty(
    objectId: string,
    property: string,
    rawVal: string
  ): { success: boolean; message: string; appliedValue: any } {
    const target = this.objects[objectId];
    if (!target) {
      return { success: false, message: `OBJECT_NOT_FOUND: "${objectId}"`, appliedValue: null };
    }

    const propLower = property.toLowerCase();
    const valLower = rawVal.toLowerCase().trim();

    if (objectId === 'door_01') {
      const door = target as WorldDoorObject;
      if (propLower === 'permission' || propLower === 'permissionlevel') {
        if (valLower === 'root' || valLower === 'admin') {
          door.permission = valLower.toUpperCase() as PermissionLevel;
          door.locked = false;
          door.status = 'UNLOCKED';

          this.addNotification({
            id: `notif_${Date.now()}`,
            title: 'SECURITY GATE OVERRIDE',
            message: 'Blast door permissions elevated to ROOT. Hydraulic locks disengaged.',
            type: 'SUCCESS',
            timestamp: Date.now(),
          });

          this.notify();
          return {
            success: true,
            message: `[DEBUG] COMMAND ACCEPTED\n[WORLD] permission = ${door.permission}\n[WORLD] status = UNLOCKED\n[WORLD] Door blast locks disengaged. Access granted to Exit Sector.`,
            appliedValue: door.permission,
          };
        } else if (valLower === 'user') {
          door.permission = 'USER';
          door.locked = true;
          door.status = 'LOCKED';
          this.notify();
          return {
            success: true,
            message: `[DEBUG] COMMAND ACCEPTED\n[WORLD] permission = USER\n[WORLD] status = LOCKED`,
            appliedValue: 'USER',
          };
        }
      } else if (propLower === 'locked') {
        const isLocked = valLower === 'true' || valLower === '1';
        door.locked = isLocked;
        door.status = isLocked ? 'LOCKED' : 'UNLOCKED';
        this.notify();
        return {
          success: true,
          message: `[DEBUG] COMMAND ACCEPTED\n[WORLD] locked = ${isLocked}\n[WORLD] status = ${door.status}`,
          appliedValue: isLocked,
        };
      }
    }

    // Server object property updates
    if (objectId === 'server_01') {
      const srv = target as WorldServerObject;
      if (propLower === 'status') {
        srv.status = rawVal.toUpperCase();
        this.notify();
        return { success: true, message: `[WORLD] server_01.status = ${srv.status}`, appliedValue: srv.status };
      }
      if (propLower === 'integrity') {
        const num = parseFloat(rawVal);
        if (!isNaN(num)) {
          srv.integrity = Math.max(0, Math.min(100, num));
          this.notify();
          return { success: true, message: `[WORLD] server_01.integrity = ${srv.integrity}%`, appliedValue: srv.integrity };
        }
      }
    }

    // Memory object property updates
    if (objectId === 'memory_01') {
      const mem = target as WorldMemoryObject;
      if (propLower === 'recovery' || propLower === 'recoverypercentage') {
        const num = parseFloat(rawVal);
        if (!isNaN(num)) {
          mem.recoveryPercentage = Math.max(0, Math.min(100, num));
          this.notify();
          return { success: true, message: `[WORLD] memory_01.recovery = ${mem.recoveryPercentage}%`, appliedValue: mem.recoveryPercentage };
        }
      }
    }

    return {
      success: false,
      message: `INVALID_PROPERTY: Cannot rewrite property "${property}" on object "${objectId}"`,
      appliedValue: null,
    };
  }

  public addNotification(notif: WorldNotification) {
    this.notifications = [notif, ...this.notifications.slice(0, 4)];
    this.notify();
  }

  public getNotifications(): WorldNotification[] {
    return this.notifications;
  }

  public dismissNotification(id: string) {
    this.notifications = this.notifications.filter((n) => n.id !== id);
    this.notify();
  }
}

export const worldState = new WorldStateManager();
