import { useEffect, useState, useCallback } from 'react';
import { gameWs, ConnectionStatus, GameEventMessage } from '../services/websocket';
import { useWorldStore } from '../stores/worldStore';
import { soundEngine } from '../services/soundEngine';

export interface UseGameWebSocketReturn {
  connectionStatus: ConnectionStatus;
  isConnected: boolean;
  lastEvent: GameEventMessage | null;
  sendAction: (actionType: string, payload?: any) => void;
}

export const useGameWebSocket = (sessionId?: string): UseGameWebSocketReturn => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(gameWs.getStatus());
  const [lastEvent, setLastEvent] = useState<GameEventMessage | null>(null);

  useEffect(() => {
    // 1. Connect WebSocket
    gameWs.connect(sessionId);

    // 2. Track Connection Status
    const unsubStatus = gameWs.onStatusChange((status) => {
      setConnectionStatus(status);
    });

    // 3. Handle WORLD_STATE_CHANGED
    const unsubWorld = gameWs.on('WORLD_STATE_CHANGED', (event) => {
      setLastEvent(event);
      const payload = event.payload || {};
      const objId = (payload.object_id || '').toLowerCase();
      const state = payload.state || {};

      if (objId === 'door_01') {
        const perm = state.permission || 'USER';
        const isLocked = state.locked !== undefined ? state.locked : true;

        if (perm === 'ROOT' || !isLocked) {
          useWorldStore.getState().triggerNullCorruptionEvent();
        } else {
          useWorldStore.getState().setDoorPermission(perm);
        }
      } else if (objId === 'terminal_01') {
        if (state.active !== undefined) {
          useWorldStore.getState().setTerminalActive(state.active);
        }
      }
    });

    // 4. Handle NULL_CORRUPTION
    const unsubCorruption = gameWs.on('NULL_CORRUPTION', (event) => {
      setLastEvent(event);
      const payload = event.payload || {};
      if (payload.level !== undefined) {
        useWorldStore.getState().setCorruptionLevel(payload.level);
      }
      useWorldStore.getState().triggerNullCorruptionEvent();
    });

    // 5. Handle SYSTEM_WARNING
    const unsubWarning = gameWs.on('SYSTEM_WARNING', (event) => {
      setLastEvent(event);
      const payload = event.payload || {};
      soundEngine.playWarning();
      useWorldStore.getState().addNotification({
        title: payload.title || 'SYSTEM WARNING',
        message: payload.message || 'Anomaly detected in neural stream.',
        type: 'WARNING',
      });
    });

    // 6. Handle ENEMY_SPAWNED
    const unsubEnemy = gameWs.on('ENEMY_SPAWNED', (event) => {
      setLastEvent(event);
      const payload = event.payload || {};
      soundEngine.playWarning();
      useWorldStore.getState().setEnemyState(payload.state || 'DETECT', payload.distance || 15);
      useWorldStore.getState().addNotification({
        title: 'THREAT DETECTED',
        message: 'NULL_FRAGMENT materialized in sector matrix.',
        type: 'ERROR',
      });
    });

    // 7. Handle QUEST_UPDATED
    const unsubQuest = gameWs.on('QUEST_UPDATED', (event) => {
      setLastEvent(event);
      const payload = event.payload || {};
      if (payload.objective) {
        useWorldStore.getState().setObjective(payload.objective);
      }
    });

    // 8. Handle SYSTEM_FAILURE
    const unsubFailure = gameWs.on('SYSTEM_FAILURE', (event) => {
      setLastEvent(event);
      useWorldStore.setState({ playerIntegrity: 0, isSystemFailure: true });
      soundEngine.playNullAwakeningSound();
    });

    // 9. Handle MEMORY_DISCOVERED
    const unsubMemory = gameWs.on('MEMORY_DISCOVERED', (event) => {
      setLastEvent(event);
      const payload = event.payload || {};
      soundEngine.playKeyTick();
      useWorldStore.getState().addNotification({
        title: 'MEMORY FRAGMENT DISCOVERED',
        message: `Decrypted: ${payload.title || 'Unknown Fragment'} (${payload.integrity || 100}%)`,
        type: 'SUCCESS',
      });
    });

    // Cleanup on unmount / navigation
    return () => {
      unsubStatus();
      unsubWorld();
      unsubCorruption();
      unsubWarning();
      unsubEnemy();
      unsubQuest();
      unsubFailure();
      unsubMemory();
      gameWs.disconnect();
    };
  }, [sessionId]);

  const sendAction = useCallback((actionType: string, payload: any = {}) => {
    gameWs.send(actionType, payload);
  }, []);

  return {
    connectionStatus,
    isConnected: connectionStatus === 'CONNECTED',
    lastEvent,
    sendAction,
  };
};
