/**
 * REST client for the LogicChat backend.
 *
 * IMPORTANT:
 * - This file only talks to REST endpoints.
 * - WebSocket streaming stays in websocket.ts.
 * - Every method throws on non-2xx responses.
 * - Callers should handle errors with try/catch and show toaster.
 */

const RAW_BASE =
  (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';

export const API_BASE = String(RAW_BASE).replace(/\/$/, '');

const REQUEST_TIMEOUT_MS = 20_000;

class ApiError extends Error {
  status: number;
  statusText: string;
  detail: unknown;

  constructor(status: number, statusText: string, detail: unknown) {
    super(`${status} ${statusText}: ${String(detail || 'Request failed')}`);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
    this.detail = detail;
  }
}

async function parseResponseError(res: Response): Promise<unknown> {
  const text = await res.text().catch(() => '');

  if (!text) return res.statusText;

  try {
    const parsed = JSON.parse(text);
    return parsed.detail ?? parsed.message ?? parsed;
  } catch {
    return text;
  }
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const controller = new AbortController();

  const timeout = window.setTimeout(() => {
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    const hasBody = Boolean(init.body);

    const res = await fetch(`${API_BASE}${path}`, {
      ...init,
      signal: controller.signal,

      /**
       * Only attach JSON header when body exists.
       * This keeps GET/DELETE requests cleaner.
       */
      headers: {
        ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
        ...(init.headers || {}),
      },
    });

    if (!res.ok) {
      const detail = await parseResponseError(res);
      throw new ApiError(res.status, res.statusText, detail);
    }

    /**
     * Some endpoints may return 204 No Content in future.
     */
    if (res.status === 204) {
      return undefined as T;
    }

    return res.json() as Promise<T>;
  } finally {
    window.clearTimeout(timeout);
  }
}

/**
 * Message shape stored by backend.
 */
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  status?: 'complete' | 'cancelled' | 'error';
  attachments?: {
    name: string;
    size: number;
    type: string;
  }[];
  pasteSnippets?: {
    id: string;
    language: string;
    content: string;
    lines: number;
  }[];
  sources?: unknown[];
  citations?: unknown[];
  pipeline?: unknown[];
}

/**
 * Lightweight session metadata used for sidebar.
 */
export interface SessionMeta {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  favorite: boolean;
  messageCount: number;
  preview?: string;
  matchSnippet?: string;
}

/**
 * Full session returned when user opens a conversation.
 */
export interface FullSession extends SessionMeta {
  messages: ChatMessage[];
}

export type ExportFormat = 'md' | 'txt' | 'json';

export const api = {
  health: () => request<{ ok: boolean; ts?: number }>('/api/health'),

  listSessions: () =>
    request<{ sessions: SessionMeta[] }>('/api/sessions').then(
      (response) => response.sessions
    ),

  getSession: (id: string) =>
    request<FullSession>(`/api/sessions/${encodeURIComponent(id)}`),

  createSession: (title?: string) =>
    request<FullSession>('/api/sessions', {
      method: 'POST',
      body: JSON.stringify({
        title: title?.trim() || null,
      }),
    }),

  patchSession: (
    id: string,
    patch: {
      title?: string;
      favorite?: boolean;
    }
  ) =>
    request<FullSession>(`/api/sessions/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),

  deleteSession: (id: string) =>
    request<{ ok: boolean }>(`/api/sessions/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  search: (q: string) =>
    request<{ sessions: SessionMeta[] }>(
      `/api/search?q=${encodeURIComponent(q.trim())}`
    ).then((response) => response.sessions),

  exportUrl: (id: string, fmt: ExportFormat) =>
    `${API_BASE}/api/sessions/${encodeURIComponent(id)}/export?fmt=${fmt}`,
};

export { ApiError };