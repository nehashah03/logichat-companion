/**
 * WebSocket Service (FINAL VERSION)
 * --------------------------------
 *
 * PURPOSE:
 * This file is ONLY responsible for:
 * - Connecting to backend WebSocket
 * - Sending user messages
 * - Receiving streaming events
 * - Routing events to correct session
 *
 * IMPORTANT RULES:
 * ❌ No UI logic here
 * ❌ No pipeline steps here (routing/planning/etc)
 * ❌ No hardcoded responses here
 *
 * ✅ Backend controls EVERYTHING
 * ✅ Frontend just listens & renders
 *
 * WHY THIS DESIGN?
 * - Clean separation of concerns
 * - Easy to swap mock → real backend
 * - Scalable for multi-session chats
 * - Resilient (reconnect + queue)
 */

export type PhaseKey = 'routing' | 'planning' | 'executing' | 'synthesizing';

/**
 * All possible events coming from backend
 * (Frontend MUST only rely on these)
 */
export interface WsEvent {
  type:
    | 'turn_start'
    | 'phase_start'
    | 'phase_event'
    | 'event_chunk'
    | 'event_done'
    | 'phase_done'
    | 'token'
    | 'sources'
    | 'done'
    | 'cancelled'
    | 'error';

  sessionId?: string;
  turnId?: string;

  phase?: PhaseKey;
  eventId?: string;

  label?: string;
  description?: string;
  toolName?: string;

  chunk?: string;
  text?: string;

  durationMs?: number;
  rawOutput?: string;

  sources?: any[];
  citations?: any[];

  message?: string;
}

/**
 * Payload sent from frontend → backend
 */
export interface SendPayload {
  sessionId: string;
  turnId: string;
  content: string;

  attachments?: {
    name: string;
    size: number;
    type: string;
  }[];
}

/**
 * Each session has its own listeners
 * (Important for multiple chat tabs / sessions)
 */
type SessionHandler = (event: WsEvent) => void;

/**
 * WebSocket URL (comes from env)
 */
const WS_URL =
  (import.meta as any).env?.VITE_WS_URL || 'ws://localhost:8000/ws/chat';

class WebSocketService {
  private ws: WebSocket | null = null;

  /**
   * Prevents duplicate connection attempts
   */
  private connecting = false;

  /**
   * Stores handlers per sessionId
   * Example:
   * session-1 → [handler1, handler2]
   */
  private handlers: Map<string, Set<SessionHandler>> = new Map();

  /**
   * Queue messages if socket is not ready
   */
  private outbox: string[] = [];

  /**
   * Reconnection control
   */
  private retryCount = 0;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Used to avoid reconnect when user manually disconnects
   */
  private intentionalClose = false;

  /**
   * Connect to WebSocket server
   */
  connect(): void {
    // Already connected or connecting → do nothing
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    if (this.connecting) return;

    this.connecting = true;
    this.intentionalClose = false;

    try {
      this.ws = new WebSocket(WS_URL);
    } catch {
      // If connection fails → retry
      this.connecting = false;
      this.scheduleReconnect();
      return;
    }

    /**
     * When connection opens
     */
    this.ws.onopen = () => {
      this.connecting = false;
      this.retryCount = 0;

      // Flush queued messages
      while (this.outbox.length && this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(this.outbox.shift()!);
      }
    };

    /**
     * When message is received
     */
    this.ws.onmessage = (msg) => {
      let event: WsEvent;

      try {
        event = JSON.parse(msg.data);
      } catch {
        return;
      }

      // Ignore if no sessionId
      if (!event.sessionId) return;

      // Send event only to relevant session handlers
      this.handlers.get(event.sessionId)?.forEach((handler) => {
        handler(event);
      });
    };

    /**
     * Error handling
     * (UI will show toast, not here)
     */
    this.ws.onerror = () => {
      // Let onclose handle retry
    };

    /**
     * When connection closes
     */
    this.ws.onclose = () => {
      this.ws = null;
      this.connecting = false;

      // If not intentional → reconnect
      if (!this.intentionalClose) {
        this.scheduleReconnect();
      }
    };
  }

  /**
   * Disconnect manually
   */
  disconnect(): void {
    this.intentionalClose = true;

    if (this.retryTimer) {
      clearTimeout(this.retryTimer);
      this.retryTimer = null;
    }

    this.ws?.close();
    this.ws = null;

    // Clear everything
    this.handlers.clear();
    this.outbox = [];
  }

  /**
   * Subscribe to session events
   */
  on(sessionId: string, handler: SessionHandler): () => void {
    if (!this.handlers.has(sessionId)) {
      this.handlers.set(sessionId, new Set());
    }

    this.handlers.get(sessionId)!.add(handler);

    /**
     * Return unsubscribe function
     */
    return () => {
      const set = this.handlers.get(sessionId);
      if (!set) return;

      set.delete(handler);

      if (set.size === 0) {
        this.handlers.delete(sessionId);
      }
    };
  }

  /**
   * Send user query to backend
   */
  send(payload: SendPayload): void {
    /**
     * IMPORTANT:
     * Do NOT allow sending if socket is not ready
     * UI should handle retry
     */
    if (!this.isReady()) {
      throw new Error('WebSocket is not connected');
    }

    this.sendRaw({
      type: 'message',
      ...payload,
    });
  }

  /**
   * Cancel a running stream
   */
  cancel(turnId: string): void {
    this.sendRaw({
      type: 'cancel',
      turnId,
    });
  }

  /**
   * Check if socket is ready
   */
  isReady(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Internal send (handles queueing)
   */
  private sendRaw(payload: any): void {
    const frame = JSON.stringify(payload);

    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(frame);
      return;
    }

    /**
     * If not ready → queue message
     */
    this.outbox.push(frame);
    this.connect();
  }

  /**
   * Reconnect logic (exponential backoff)
   */
  private scheduleReconnect(): void {
    if (this.retryTimer) return;

    const delay = Math.min(15000, 500 * 2 ** Math.min(this.retryCount, 5));
    this.retryCount++;

    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      this.connect();
    }, delay);
  }
}

/**
 * Singleton instance
 */
export const wsService = new WebSocketService();