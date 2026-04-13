// Mock WebSocket service for development
// Simulates token-by-token streaming with processing pipeline steps

type EventHandler = (data: any) => void;

interface WSHandlers {
  message: EventHandler;
  progress: EventHandler;
  complete: EventHandler;
  error: EventHandler;
  step: EventHandler;
}

const MOCK_RESPONSE = `## Analysis Complete

Here's what I found in the uploaded documents:

### Key Findings

1. **Memory leak detected** in the authentication service — RSS growing ~50MB/hour [1]
2. **Slow queries** on the \`user_sessions\` table — P99 latency at 2.3s [2]
3. **Connection pool exhaustion** — max connections hit 47 times in the last 24h [1]

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

> **Note**: The memory issue is the most critical. I recommend addressing it before the next deployment window. [2]

### Additional Resources

For more details, see the [PostgreSQL Documentation](https://www.postgresql.org/docs/) and the [Node.js Memory Management Guide](https://nodejs.org/en/docs/guides/diagnostics/memory).

Let me know if you'd like me to dig deeper into any of these findings.`;

const MOCK_SOURCES = [
  { name: 'system_logs_march_2024.pdf', url: '#', snippet: 'Authentication service RSS memory growing at approximately 50MB/hour. Connection pool reaching maximum capacity of 100 connections repeatedly...' },
  { name: 'performance_metrics_report.docx', url: '#', snippet: 'P99 latency for user_sessions table queries measured at 2.3 seconds. Database connection pool exhaustion events recorded 47 times in 24-hour window...' },
];

const MOCK_CITATIONS = [
  { index: 1, text: 'Memory leak detected in authentication service', source: 'system_logs_march_2024.pdf' },
  { index: 2, text: 'Slow queries on user_sessions table — P99 at 2.3s', source: 'performance_metrics_report.docx' },
];

const PROCESSING_STEPS = [
  { id: 'step-1', label: 'Analyzing your query', description: 'Determining Next Steps' },
  { id: 'step-2', label: 'Searching your documents', description: 'Looking up' },
  { id: 'step-3', label: 'Extracting key details', description: 'Processing document content' },
  { id: 'step-4', label: 'Generating a response', description: 'Preparing a final response' },
];

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
  private abortController: AbortController | null = null;

  connect() {
    this.connected = true;
    console.log('[WS] Connected (mock)');
  }

  disconnect() {
    this.connected = false;
    this.abort();
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

    try {
      // Processing steps — streamed one by one
      for (let i = 0; i < PROCESSING_STEPS.length; i++) {
        if (signal.aborted) return;
        const step = PROCESSING_STEPS[i];

        this.handlers.step?.({
          messageId,
          step: { ...step, status: 'active' },
          allSteps: PROCESSING_STEPS.map((s, j) => ({
            ...s,
            status: j < i ? 'complete' : j === i ? 'active' : 'pending',
          })),
        });

        // Simulate sub-tasks for searching step
        if (step.id === 'step-2') {
          await this.delay(500, signal);
          this.handlers.progress?.({
            stage: 'searching',
            messageId,
            detail: 'What is the system performance?',
          });
          await this.delay(600, signal);
          this.handlers.progress?.({
            stage: 'searching',
            messageId,
            detail: 'Found passages from 2 documents',
          });
          await this.delay(400, signal);
        } else {
          await this.delay(800 + Math.random() * 400, signal);
        }

        // Mark step complete
        this.handlers.step?.({
          messageId,
          step: { ...step, status: 'complete' },
          allSteps: PROCESSING_STEPS.map((s, j) => ({
            ...s,
            status: j <= i ? 'complete' : 'pending',
          })),
        });
      }

      // Send tool outputs
      for (const tool of TOOL_OUTPUTS) {
        if (signal.aborted) return;
        this.handlers.message?.({ type: 'tool_output', messageId, output: tool });
        await this.delay(200, signal);
      }

      // Stream tokens
      const tokens = MOCK_RESPONSE.split('');
      let buffer = '';
      for (let i = 0; i < tokens.length; i++) {
        if (signal.aborted) return;
        buffer += tokens[i];
        if (buffer.length >= 3 || i === tokens.length - 1) {
          this.handlers.message?.({ type: 'token', messageId, token: buffer });
          buffer = '';
          await this.delay(8, signal);
        }
      }

      // Send sources and citations
      if (!signal.aborted) {
        this.handlers.message?.({
          type: 'sources',
          messageId,
          sources: MOCK_SOURCES,
          citations: MOCK_CITATIONS,
        });
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
