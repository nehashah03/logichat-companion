// Mock WebSocket service for development
// Simulates token-by-token streaming with pipeline stages

type EventHandler = (data: any) => void;

interface WSHandlers {
  message: EventHandler;
  progress: EventHandler;
  complete: EventHandler;
  error: EventHandler;
}

const MOCK_RESPONSES: Record<string, string> = {
  default: `## Analysis Complete

Here's what I found in the logs:

### Key Issues
1. **Memory leak detected** in the authentication service — RSS growing ~50MB/hour
2. **Slow queries** on the \`user_sessions\` table — P99 latency at 2.3s
3. **Connection pool exhaustion** — max connections hit 47 times in the last 24h

### Recommended Actions

\`\`\`bash
# Check current connection pool status
psql -c "SELECT count(*) FROM pg_stat_activity WHERE state = 'active';"

# Restart the auth service with increased heap
systemctl restart auth-service --env HEAP_SIZE=4096m
\`\`\`

### Metrics Summary

| Metric | Current | Threshold | Status |
|--------|---------|-----------|--------|
| CPU Usage | 78% | 85% | ⚠️ Warning |
| Memory | 92% | 90% | 🔴 Critical |
| Disk I/O | 45% | 70% | ✅ OK |
| Network | 23% | 60% | ✅ OK |

> **Note**: The memory issue is the most critical. I recommend addressing it before the next deployment window.

Let me know if you'd like me to dig deeper into any of these findings.`,
};

const TOOL_OUTPUTS = [
  { id: 'tool-1', name: 'log_analyzer', content: 'Scanned 14,232 log entries. Found 3 critical patterns.', type: 'text' as const },
  { id: 'tool-2', name: 'metrics_query', content: JSON.stringify([
    { metric: 'cpu', value: '78%', status: 'warning' },
    { metric: 'memory', value: '92%', status: 'critical' },
    { metric: 'disk', value: '45%', status: 'ok' },
  ], null, 2), type: 'code' as const },
];

class MockWebSocketService {
  private handlers: Partial<WSHandlers> = {};
  private connected = false;
  private reconnectAttempts = 0;
  private maxReconnect = 5;
  private abortController: AbortController | null = null;

  connect() {
    this.connected = true;
    this.reconnectAttempts = 0;
    console.log('[WS] Connected (mock)');
  }

  disconnect() {
    this.connected = false;
    this.abort();
    console.log('[WS] Disconnected');
  }

  on<K extends keyof WSHandlers>(event: K, handler: WSHandlers[K]) {
    this.handlers[event] = handler;
  }

  abort() {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  async send(message: string, messageId: string) {
    if (!this.connected) {
      this.handlers.error?.({ error: 'Not connected' });
      return;
    }

    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    const response = MOCK_RESPONSES.default;
    const stages: Array<{ stage: string; delay: number; tool?: string }> = [
      { stage: 'routing', delay: 600 },
      { stage: 'planning', delay: 800 },
      { stage: 'executing', delay: 1200, tool: 'log_analyzer' },
      { stage: 'executing', delay: 800, tool: 'metrics_query' },
      { stage: 'synthesizing', delay: 400 },
    ];

    try {
      // Pipeline stages
      for (const s of stages) {
        if (signal.aborted) return;
        this.handlers.progress?.({ stage: s.stage, tool: s.tool, messageId });
        await this.delay(s.delay, signal);
      }

      // Send tool outputs
      for (const tool of TOOL_OUTPUTS) {
        if (signal.aborted) return;
        this.handlers.message?.({ type: 'tool_output', messageId, output: tool });
        await this.delay(200, signal);
      }

      // Stream tokens
      const tokens = response.split('');
      let buffer = '';
      for (let i = 0; i < tokens.length; i++) {
        if (signal.aborted) return;
        buffer += tokens[i];
        // Send in small chunks for smoother rendering
        if (buffer.length >= 3 || i === tokens.length - 1) {
          this.handlers.message?.({ type: 'token', messageId, token: buffer });
          buffer = '';
          await this.delay(8, signal);
        }
      }

      if (!signal.aborted) {
        this.handlers.complete?.({ messageId });
      }
    } catch (e: any) {
      if (e.name !== 'AbortError') {
        this.handlers.error?.({ error: e.message, messageId });
      }
    }
  }

  private delay(ms: number, signal: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, ms);
      signal.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      }, { once: true });
    });
  }
}

export const wsService = new MockWebSocketService();
