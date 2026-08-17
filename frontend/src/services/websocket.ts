import { ApiClient } from './api';

export type GameEventType =
  | 'CONNECTION_ESTABLISHED'
  | 'PLAYER_HACKED_OBJECT'
  | 'WORLD_STATE_CHANGED'
  | 'NULL_CORRUPTION'
  | 'SYSTEM_WARNING'
  | 'ENEMY_SPAWNED'
  | 'QUEST_UPDATED'
  | 'MEMORY_DISCOVERED'
  | 'SYSTEM_FAILURE'
  | 'PONG';

export interface GameEventMessage<T = any> {
  type: GameEventType | string;
  timestamp: string;
  payload: T;
}

export type ConnectionStatus =
  | 'DISCONNECTED'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'RECONNECTING'
  | 'FAILED';

export type EventHandler = (event: GameEventMessage) => void;

class GameWebSocketService {
  private socket: WebSocket | null = null;
  private sessionId: string | null = null;
  private listeners: Map<string, Set<EventHandler>> = new Map();
  private statusListeners: Set<(status: ConnectionStatus) => void> = new Set();
  private status: ConnectionStatus = 'DISCONNECTED';

  private reconnectTimer: any = null;
  private pingInterval: any = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private isExplicitlyClosed = false;

  private setStatus(newStatus: ConnectionStatus) {
    this.status = newStatus;
    this.statusListeners.forEach((listener) => listener(newStatus));
  }

  public getStatus(): ConnectionStatus {
    return this.status;
  }

  public connect(sessionId?: string) {
    this.isExplicitlyClosed = false;
    this.sessionId = sessionId || ApiClient.getSessionId();

    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.setStatus(this.reconnectAttempts > 0 ? 'RECONNECTING' : 'CONNECTING');

    const rawApiUrl = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';
    const wsProtocol = rawApiUrl.startsWith('https') ? 'wss:' : 'ws:';
    const host = rawApiUrl.replace(/^https?:\/\//, '');

    const token = ApiClient.getToken();
    const tokenQuery = token ? `?token=${encodeURIComponent(token)}` : '';
    const wsUrl = `${wsProtocol}//${host}/api/ws/game/${encodeURIComponent(this.sessionId)}${tokenQuery}`;

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        this.reconnectAttempts = 0;
        this.setStatus('CONNECTED');
        this.startHeartbeat();
      };

      this.socket.onmessage = (event) => {
        try {
          const data: GameEventMessage = JSON.parse(event.data);
          this.emit(data.type, data);
          this.emit('*', data);
        } catch (e) {
          console.warn('[NULL//ROOT WS] Failed to parse message:', event.data);
        }
      };

      this.socket.onerror = () => {
        // Handled in onclose
      };

      this.socket.onclose = () => {
        this.stopHeartbeat();
        this.socket = null;

        if (!this.isExplicitlyClosed) {
          this.setStatus('DISCONNECTED');
          this.scheduleReconnect();
        } else {
          this.setStatus('DISCONNECTED');
        }
      };
    } catch (e) {
      this.setStatus('DISCONNECTED');
      this.scheduleReconnect();
    }
  }

  private startHeartbeat() {
    this.stopHeartbeat();
    this.pingInterval = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send(JSON.stringify({ type: 'PING' }));
      }
    }, 15000);
  }

  private stopHeartbeat() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private scheduleReconnect() {
    if (this.isExplicitlyClosed || this.reconnectTimer) return;

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.setStatus('FAILED');
      return;
    }

    this.reconnectAttempts++;
    const delay = Math.min(10000, 1000 * Math.pow(1.5, this.reconnectAttempts));

    this.setStatus('RECONNECTING');
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (!this.isExplicitlyClosed) {
        this.connect(this.sessionId || undefined);
      }
    }, delay);
  }

  public disconnect() {
    this.isExplicitlyClosed = true;
    this.stopHeartbeat();

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }

    this.setStatus('DISCONNECTED');
  }

  public send(type: string, payload: any = {}) {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify({ type, payload }));
    }
  }

  public on(eventType: string, handler: EventHandler): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(handler);

    return () => {
      this.off(eventType, handler);
    };
  }

  public off(eventType: string, handler: EventHandler) {
    const handlers = this.listeners.get(eventType);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.listeners.delete(eventType);
      }
    }
  }

  public onStatusChange(listener: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.add(listener);
    listener(this.status);
    return () => {
      this.statusListeners.delete(listener);
    };
  }

  private emit(eventType: string, event: GameEventMessage) {
    const handlers = this.listeners.get(eventType);
    if (handlers) {
      handlers.forEach((h) => {
        try {
          h(event);
        } catch (e) {
          console.error(`[WS Error in handler for ${eventType}]:`, e);
        }
      });
    }
  }
}

export const gameWs = new GameWebSocketService();
