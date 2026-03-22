import RNEventSource from 'react-native-sse';
import { getAuthToken, getApiBase, type SSEEvent, type SSEEventType } from '@enzyme/api-client';

type EventHandler<T extends SSEEvent = SSEEvent> = (event: T) => void;

// Extract a specific event type from the SSEEvent union by its type property
type SSEEventByType<T extends SSEEventType> = Extract<SSEEvent, { type: T }>;

export class SSEConnection {
  private eventSource: RNEventSource | null = null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handlers: Map<SSEEventType | '*', EventHandler<any>[]> = new Map();
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private reconnectDelay = 3000;
  private _isConnecting = false;
  private workspaceId: string;
  private onDisconnectCallback?: () => void;
  private onForbiddenCallback?: () => void;

  constructor(workspaceId: string) {
    this.workspaceId = workspaceId;
  }

  setOnDisconnect(callback: () => void): void {
    this.onDisconnectCallback = callback;
  }

  setOnForbidden(callback: () => void): void {
    this.onForbiddenCallback = callback;
  }

  connect(): void {
    if (this.eventSource || this._isConnecting) {
      return;
    }

    this._isConnecting = true;
    const url = `${getApiBase()}/workspaces/${this.workspaceId}/events`;
    const token = getAuthToken();

    this.eventSource = new RNEventSource(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    this.eventSource.addEventListener('open', () => {
      this._isConnecting = false;
      console.log('[SSE] Connected to', url);
    });

    this.eventSource.addEventListener('message', (event) => {
      if (!event.data) return;
      try {
        const data = JSON.parse(event.data) as SSEEvent;
        this.dispatch(data);
      } catch (e) {
        console.error('[SSE] Failed to parse event:', e);
      }
    });

    this.eventSource.addEventListener('error', (event) => {
      if (event.type === 'error' && 'xhrStatus' in event && event.xhrStatus === 403) {
        console.error('[SSE] 403 Forbidden — stopping reconnection');
        this.onDisconnectCallback?.();
        this.disconnect();
        this.onForbiddenCallback?.();
        return;
      }
      console.error('[SSE] Connection error, reconnecting...');
      this.onDisconnectCallback?.();
      this.disconnect();
      this.scheduleReconnect();
    });
  }

  disconnect(): void {
    this._isConnecting = false;
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimeout) {
      return;
    }
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectTimeout = null;
      this.connect();
    }, this.reconnectDelay);
  }

  on<T extends SSEEventType>(eventType: T, handler: EventHandler<SSEEventByType<T>>): () => void;
  on(eventType: '*', handler: EventHandler<SSEEvent>): () => void;
  on(eventType: SSEEventType | '*', handler: EventHandler): () => void {
    const handlers = this.handlers.get(eventType) || [];
    handlers.push(handler);
    this.handlers.set(eventType, handlers);

    return () => {
      const idx = handlers.indexOf(handler);
      if (idx !== -1) {
        handlers.splice(idx, 1);
      }
    };
  }

  private dispatch(event: SSEEvent): void {
    // Call specific handlers
    const specificHandlers = this.handlers.get(event.type) || [];
    specificHandlers.forEach((handler) => handler(event));

    // Call wildcard handlers
    const wildcardHandlers = this.handlers.get('*') || [];
    wildcardHandlers.forEach((handler) => handler(event));
  }

  get isConnected(): boolean {
    return this.eventSource !== null && !this._isConnecting;
  }
}
