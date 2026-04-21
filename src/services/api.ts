/**
 * REST client for the LogicChat backend.
 *
 * Base URL is taken from `VITE_API_URL` (falls back to http://localhost:8000
 * for local dev). Every method throws on non-2xx so callers can wrap in
 * try/catch.
 */

const RAW_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';
export const API_BASE = String(RAW_BASE).replace(/\/$/, '');

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  if (!res.ok) {
    let detail: any = await res.text().catch(() => '');
    try { detail = JSON.parse(detail).detail ?? detail; } catch { /* noop */ }
    throw new Error(`${res.status} ${res.statusText}: ${detail}`);
  }
  return res.json() as Promise<T>;
}

// ---------- Types mirrored from the backend ----------
export interface SessionMeta {
  id: string;
  title: string;
  createdAt: number;       // seconds (backend uses time.time())
  updatedAt: number;
  favorite: boolean;
  messageCount: number;
  preview?: string;
  matchSnippet?: string;
}

export interface FullSession extends SessionMeta {
  messages: any[];
}

// ---------- Endpoints ----------
export const api = {
  health: () => request<{ ok: boolean }>('/api/health'),

  listSessions: () =>
    request<{ sessions: SessionMeta[] }>('/api/sessions').then(r => r.sessions),

  getSession: (id: string) =>
    request<FullSession>(`/api/sessions/${id}`),

  createSession: (title?: string) =>
    request<FullSession>('/api/sessions', {
      method: 'POST',
      body: JSON.stringify({ title: title || null }),
    }),

  patchSession: (id: string, patch: { title?: string; favorite?: boolean }) =>
    request<FullSession>(`/api/sessions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patch),
    }),

  deleteSession: (id: string) =>
    request<{ ok: boolean }>(`/api/sessions/${id}`, { method: 'DELETE' }),

  search: (q: string) =>
    request<{ sessions: SessionMeta[] }>(
      `/api/search?q=${encodeURIComponent(q)}`,
    ).then(r => r.sessions),

  exportUrl: (id: string, fmt: 'md' | 'txt' | 'json') =>
    `${API_BASE}/api/sessions/${id}/export?fmt=${fmt}`,
};