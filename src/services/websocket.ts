/**
 * Production WebSocket client for the LogicChat backend.
 *
 * KEY DESIGN POINTS
 * -----------------
 * 1. **No hardcoded pipeline.** Every event the UI renders comes from the
 *    backend (`backend/pipeline.py`). This file is purely transport.
 *
 * 2. **Per-session turn isolation.** The frontend can send turns for many
 *    sessions in parallel; events are routed to handlers by `sessionId`.
 *    Sending a new turn in session A does NOT abort session B.
 *
 * 3. **Cancel.** A "Stop" click sends `{type:'cancel', turnId}` over the
 *    same socket — the backend cancels only that turn's asyncio.Task.
 *
 * 4. **Resilience.** Auto-reconnect with exponential backoff; a tiny
 *    outbox queues messages while the socket is reconnecting.
 *
 * 5. **Security.** No data is read from `localStorage`; the URL is taken
 *    from `VITE_WS_URL` at build time. Payloads are typed.
 */

export type PhaseKey = 'routing' | 'planning' | 'executing' | 'synthesizing';

export interface WsEvent {
  type:
    | 'turn_start'
    | 'phase_start' | 'phase_event' | 'event_chunk' | 'event_done' | 'phase_done'
    | 'token' | 'sources' | 'done' | 'cancelled' | 'error';
  sessionId?: string;
  turnId?: string;
  phase?: PhaseKey;
  eventId?: string;
  label?: string;
  description?: string;
  toolName?: string;
  chunk?: string;
  durationMs?: number;
  rawOutput?: string;
  text?: string;
  sources?: any[];
  citations?: any[];
  message?: string;
  userMessageId?: string;
}

export interface SendPayload {
  sessionId: string;
  turnId: string;
  content: string;
  attachments?: { name: string; size: number; type: string }[];
  snippets?: { id: string; language: string; content: string; lines: number }[];
}

type SessionHandler = (ev: WsEvent) => void;

const WS_URL: string =
  (import.meta as any).env?.VITE_WS_URL || 'ws://localhost:8000/ws/chat';

class WebSocketService {
  private ws: WebSocket | null = null;
  private connecting = false;
  /** Per-session handler map. Routing is keyed by `sessionId`. */
  private handlers: Map<string, Set<SessionHandler>> = new Map();
  /** Outbox of frames to send once the socket opens / reconnects. */
  private outbox: string[] = [];
  private retry = 0;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private intentionalClose = false;

  /** Subscribe to all events for a given sessionId. Returns unsubscribe. */
  on(sessionId: string, handler: SessionHandler): () => void {
    if (!this.handlers.has(sessionId)) this.handlers.set(sessionId, new Set());
    this.handlers.get(sessionId)!.add(handler);
    return () => {
      const set = this.handlers.get(sessionId);
      if (!set) return;
      set.delete(handler);
      if (set.size === 0) this.handlers.delete(sessionId);
    };
  }

  connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) return;
    if (this.connecting) return;
    this.intentionalClose = false;
    this.connecting = true;
    try {
      this.ws = new WebSocket(WS_URL);
    } catch (e) {
      this.connecting = false;
      this.scheduleReconnect();
      return;
    }
    this.ws.onopen = () => {
      this.connecting = false;
      this.retry = 0;
      // Flush any queued frames
      while (this.outbox.length && this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(this.outbox.shift()!);
      }
    };
    this.ws.onmessage = (msg) => {
      let ev: WsEvent;
      try { ev = JSON.parse(msg.data); } catch { return; }
      const sid = ev.sessionId;
      if (!sid) return;
      this.handlers.get(sid)?.forEach(h => h(ev));
    };
    this.ws.onerror = () => {/* surfaced via onclose */ };
    this.ws.onclose = () => {
      this.connecting = false;
      this.ws = null;
      if (!this.intentionalClose) this.scheduleReconnect();
    };
  }

  disconnect(): void {
    this.intentionalClose = true;
    if (this.retryTimer) { clearTimeout(this.retryTimer); this.retryTimer = null; }
    this.ws?.close();
    this.ws = null;
    this.handlers.clear();
    this.outbox = [];
  }

  private scheduleReconnect(): void {
    if (this.retryTimer) return;
    const delay = Math.min(15_000, 500 * 2 ** Math.min(this.retry, 5));
    this.retry++;
    this.retryTimer = setTimeout(() => {
      this.retryTimer = null;
      this.connect();
    }, delay);
  }

  /** Send (or queue) a frame. */
  private sendRaw(payload: any): void {
    const frame = JSON.stringify(payload);
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(frame);
    } else {
      this.outbox.push(frame);
      this.connect();
    }
  }

  /** Start a chat turn. Backend will stream events tagged with sessionId+turnId. */
  send(p: SendPayload): void {
    this.sendRaw({ type: 'message', ...p });
  }

  /** Cancel a turn (Stop button). */
  cancel(turnId: string): void {
    this.sendRaw({ type: 'cancel', turnId });
  }

  /** True when the socket is open and ready. */
  isReady(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

export const wsService = new WebSocketService();