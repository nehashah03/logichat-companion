// /**
//  * Mock pipeline streaming service.
//  *
//  * Mirrors a real backend that exposes a WebSocket emitting these event kinds:
//  *
//  *   { type: 'phase_start',   phase, label, description }
//  *   { type: 'phase_event',   phase, eventId, label, toolName?, status: 'running' }
//  *   { type: 'event_chunk',   phase, eventId, chunk }       // streamed live tool reveal
//  *   { type: 'event_done',    phase, eventId, durationMs, rawOutput? }
//  *   { type: 'phase_done',    phase }
//  *   { type: 'token',         text }                        // assistant token
//  *   { type: 'sources',       sources, citations }
//  *   { type: 'done' }
//  *   { type: 'error',         message }
//  *
//  * In production this connects via `new WebSocket(BACKEND_WS_URL)`.
//  * For development we simulate the same event stream locally so the UI is
//  * fully exercisable without running the Python service.
//  *
//  * To switch to the real backend, set VITE_WS_URL in .env and replace
//  * `MockTransport` with `RealTransport` in `wsService`.
//  */
// import { generateId } from '../utils/helpers';

// export type PhaseKey = 'routing' | 'planning' | 'executing' | 'synthesizing';

// export interface WsEvent {
//   type:
//     | 'phase_start' | 'phase_event' | 'event_chunk' | 'event_done' | 'phase_done'
//     | 'token' | 'sources' | 'done' | 'error';
//   phase?: PhaseKey;
//   eventId?: string;
//   label?: string;
//   description?: string;
//   toolName?: string;
//   chunk?: string;
//   durationMs?: number;
//   rawOutput?: string;
//   text?: string;
//   sources?: any[];
//   citations?: any[];
//   message?: string;
//   status?: 'running' | 'done' | 'error';
// }

// type Handler = (ev: WsEvent) => void;

// const MOCK_RESPONSE = `## Analysis Complete

// Here's what I found in the data you shared:

// ### Incident Dashboard

// ![CPU and Memory usage over 24h](https://picsum.photos/seed/logic-cpu/640/260)

// ![Error rate heatmap by service](https://picsum.photos/seed/logic-heatmap/640/260)

// ### Key Findings

// 1. **Memory leak** in the auth service — RSS growing ~50 MB / hour [1]
// 2. **Slow queries** on the \`user_sessions\` table — P99 latency at 2.3 s [2]
// 3. **Connection-pool exhaustion** — pool maxed out 47 times in the last 24 h [1]
// 4. **Disk I/O spikes** on primary nodes during peak hours [3]

// ### Recommended Actions

// \`\`\`bash
// # Check current connection pool status
// psql -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';"

// # Restart the auth service with a larger heap
// systemctl restart auth-service --env HEAP_SIZE=4096m
// \`\`\`

// ### Metrics Summary

// | Metric        | Current | Threshold | Status      |
// |---------------|---------|-----------|-------------|
// | CPU Usage     | 78%     | 85%       | ⚠️ Warning  |
// | Memory        | 92%     | 90%       | 🔴 Critical |
// | Disk I/O      | 45%     | 70%       | ✅ OK       |
// | Network       | 23%     | 60%       | ✅ OK       |

// > The memory issue is the most critical — address it before the next deploy. [1][3]

// Let me know if you'd like me to dig deeper into any of these findings.`;

// const MOCK_SOURCES = [
//   {
//     id: 'src-1',
//     name: 'system_logs_march_2024.pdf',
//     url: '#',
//     snippet: 'Authentication service RSS memory growing at approximately 50MB/hour. Connection pool reaching maximum capacity of 100 connections repeatedly throughout the observation window.',
//     page: 12,
//   },
//   {
//     id: 'src-2',
//     name: 'performance_metrics_report.docx',
//     url: '#',
//     snippet: 'P99 latency for user_sessions table queries measured at 2.3 seconds. Index scans on session_token fall back to sequential reads under high load.',
//     page: 4,
//   },
//   {
//     id: 'src-3',
//     name: 'incident_2024_03_18.json',
//     url: '#',
//     snippet: 'Disk I/O saturation observed on primary nodes between 09:00–11:00 and 18:00–20:00. Aligned with batch reconciliation jobs.',
//   },
// ];

// const MOCK_CITATIONS = [
//   { index: 1, sourceId: 'src-1', text: 'Memory leak detected in authentication service' },
//   { index: 2, sourceId: 'src-2', text: 'Slow queries on user_sessions table — P99 at 2.3s' },
//   { index: 3, sourceId: 'src-3', text: 'Disk I/O saturation on primary nodes' },
// ];

// // --- Tool reveal lines (streamed character-by-character into events) ---
// const SPLUNK_REVEAL = [
//   'index=app_logs sourcetype=auth_service ERROR',
//   '  → 14,232 events scanned',
//   '  → 47 OOM warnings detected',
//   '  → memory.rss avg=2.1GB peak=4.4GB',
// ];
// const VECTOR_REVEAL = [
//   'embedding query → 1536-d vector',
//   'top-k=8 over 12,448 chunks',
//   'matched: system_logs_march_2024.pdf (p.12)',
//   'matched: performance_metrics_report.docx (p.4)',
// ];
// const JIRA_REVEAL = [
//   'project=OPS AND status!=Done AND label=auth-svc',
//   '  → INC-1042 "Auth pod OOMKilled"',
//   '  → INC-1057 "Connection pool errors during peak"',
// ];

// interface Transport {
//   send(payload: { content: string; attachments?: any[] }, onEvent: Handler, signal: AbortSignal): Promise<void>;
// }

// class MockTransport implements Transport {
//   async send(_payload: { content: string }, emit: Handler, signal: AbortSignal): Promise<void> {
//     const sleep = (ms: number) => new Promise<void>((resolve, reject) => {
//       const t = setTimeout(resolve, ms);
//       signal.addEventListener('abort', () => { clearTimeout(t); reject(new DOMException('aborted', 'AbortError')); }, { once: true });
//     });

//     // -------- ROUTING ----------
//     emit({ type: 'phase_start', phase: 'routing', label: 'Routing', description: 'Classifying intent & selecting tools' });
//     const r1 = generateId();
//     emit({ type: 'phase_event', phase: 'routing', eventId: r1, label: 'Classifying intent', status: 'running' });
//     await sleep(450);
//     for (const c of 'intent=incident.diagnose · confidence=0.94'.split('')) {
//       if (signal.aborted) return;
//       emit({ type: 'event_chunk', phase: 'routing', eventId: r1, chunk: c });
//       await sleep(8);
//     }
//     emit({ type: 'event_done', phase: 'routing', eventId: r1, durationMs: 450 });
//     emit({ type: 'phase_done', phase: 'routing' });

//     // -------- PLANNING ----------
//     emit({ type: 'phase_start', phase: 'planning', label: 'Planning', description: 'Building execution plan' });
//     const p1 = generateId();
//     emit({ type: 'phase_event', phase: 'planning', eventId: p1, label: 'Drafting tool plan', status: 'running' });
//     const plan = '1) splunk.search auth_service errors\n2) vector.search uploaded docs\n3) jira.query open incidents';
//     for (const c of plan.split('')) {
//       if (signal.aborted) return;
//       emit({ type: 'event_chunk', phase: 'planning', eventId: p1, chunk: c });
//       await sleep(7);
//     }
//     emit({ type: 'event_done', phase: 'planning', eventId: p1, durationMs: 700 });
//     emit({ type: 'phase_done', phase: 'planning' });

//     // -------- EXECUTING (multiple tools) ----------
//     emit({ type: 'phase_start', phase: 'executing', label: 'Executing', description: 'Running tools' });

//     // Tool 1: Splunk
//     const t1 = generateId();
//     emit({ type: 'phase_event', phase: 'executing', eventId: t1, label: 'Querying Splunk', toolName: 'splunk.search', status: 'running' });
//     for (const line of SPLUNK_REVEAL) {
//       for (const c of line.split('')) {
//         if (signal.aborted) return;
//         emit({ type: 'event_chunk', phase: 'executing', eventId: t1, chunk: c });
//         await sleep(5);
//       }
//       emit({ type: 'event_chunk', phase: 'executing', eventId: t1, chunk: '\n' });
//       await sleep(120);
//     }
//     emit({
//       type: 'event_done', phase: 'executing', eventId: t1, durationMs: 1800,
//       rawOutput: JSON.stringify({
//         events_scanned: 14232,
//         oom_warnings: 47,
//         memory: { avg_gb: 2.1, peak_gb: 4.4 },
//       }, null, 2),
//     });

//     // Tool 2: Vector search
//     const t2 = generateId();
//     emit({ type: 'phase_event', phase: 'executing', eventId: t2, label: 'Searching uploaded documents', toolName: 'vector.search', status: 'running' });
//     for (const line of VECTOR_REVEAL) {
//       for (const c of line.split('')) {
//         if (signal.aborted) return;
//         emit({ type: 'event_chunk', phase: 'executing', eventId: t2, chunk: c });
//         await sleep(5);
//       }
//       emit({ type: 'event_chunk', phase: 'executing', eventId: t2, chunk: '\n' });
//       await sleep(110);
//     }
//     emit({
//       type: 'event_done', phase: 'executing', eventId: t2, durationMs: 1500,
//       rawOutput: JSON.stringify({ topk: 8, total_chunks: 12448, matches: ['system_logs_march_2024.pdf#p12', 'performance_metrics_report.docx#p4'] }, null, 2),
//     });

//     // Tool 3: Jira
//     const t3 = generateId();
//     emit({ type: 'phase_event', phase: 'executing', eventId: t3, label: 'Cross-referencing Jira', toolName: 'jira.query', status: 'running' });
//     for (const line of JIRA_REVEAL) {
//       for (const c of line.split('')) {
//         if (signal.aborted) return;
//         emit({ type: 'event_chunk', phase: 'executing', eventId: t3, chunk: c });
//         await sleep(5);
//       }
//       emit({ type: 'event_chunk', phase: 'executing', eventId: t3, chunk: '\n' });
//       await sleep(100);
//     }
//     emit({
//       type: 'event_done', phase: 'executing', eventId: t3, durationMs: 1200,
//       rawOutput: JSON.stringify({ issues: ['INC-1042', 'INC-1057'] }, null, 2),
//     });

//     emit({ type: 'phase_done', phase: 'executing' });

//     // -------- SYNTHESIZING ----------
//     emit({ type: 'phase_start', phase: 'synthesizing', label: 'Synthesizing', description: 'Composing final response' });
//     const s1 = generateId();
//     emit({ type: 'phase_event', phase: 'synthesizing', eventId: s1, label: 'Composing answer', status: 'running' });
//     await sleep(400);
//     emit({ type: 'event_done', phase: 'synthesizing', eventId: s1, durationMs: 400 });
//     emit({ type: 'phase_done', phase: 'synthesizing' });

//     // -------- TOKEN STREAM ----------
//     let buf = '';
//     for (let i = 0; i < MOCK_RESPONSE.length; i++) {
//       if (signal.aborted) return;
//       buf += MOCK_RESPONSE[i];
//       if (buf.length >= 3 || i === MOCK_RESPONSE.length - 1) {
//         emit({ type: 'token', text: buf });
//         buf = '';
//         await sleep(8);
//       }
//     }

//     emit({ type: 'sources', sources: MOCK_SOURCES, citations: MOCK_CITATIONS });
//     emit({ type: 'done' });
//   }
// }

// class WebSocketService {
//   private handlers: Set<Handler> = new Set();
//   private abortController: AbortController | null = null;
//   private transport: Transport = new MockTransport();
//   private connected = false;

//   connect() {
//     this.connected = true;
//     // For a real backend:
//     // const url = (import.meta as any).env.VITE_WS_URL;
//     // if (url) this.transport = new RealTransport(url);
//   }

//   disconnect() {
//     this.connected = false;
//     this.abort();
//   }

//   on(handler: Handler) {
//     this.handlers.add(handler);
//     return () => this.handlers.delete(handler);
//   }

//   abort() {
//     this.abortController?.abort();
//     this.abortController = null;
//   }

//   async send(payload: { content: string; attachments?: any[] }) {
//     if (!this.connected) throw new Error('WS not connected');
//     this.abort();
//     this.abortController = new AbortController();
//     const signal = this.abortController.signal;
//     const emit: Handler = (ev) => this.handlers.forEach(h => h(ev));
//     try {
//       await this.transport.send(payload, emit, signal);
//     } catch (e: any) {
//       if (e?.name !== 'AbortError') emit({ type: 'error', message: e?.message || 'unknown error' });
//     }
//   }
// }

// export const wsService = new WebSocketService();

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