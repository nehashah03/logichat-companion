/**
 * Group sessions ChatGPT-style: Today / Yesterday / Last 7 days / Last 30 days / Older.
 * Backend timestamps are in *seconds*.
 */
import type { SessionMeta } from '../services/api';

export type GroupKey = 'today' | 'yesterday' | 'last7' | 'last30' | 'older';

export const GROUP_LABELS: Record<GroupKey, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  last7: 'Previous 7 days',
  last30: 'Previous 30 days',
  older: 'Older',
};

const GROUP_ORDER: GroupKey[] = ['today', 'yesterday', 'last7', 'last30', 'older'];

function startOfDay(d: Date): number {
  const c = new Date(d);
  c.setHours(0, 0, 0, 0);
  return c.getTime();
}

export function groupForTimestamp(tsSec: number): GroupKey {
  const ms = tsSec * 1000;
  const today = startOfDay(new Date());
  const yesterday = today - 86_400_000;
  const last7 = today - 7 * 86_400_000;
  const last30 = today - 30 * 86_400_000;
  if (ms >= today) return 'today';
  if (ms >= yesterday) return 'yesterday';
  if (ms >= last7) return 'last7';
  if (ms >= last30) return 'last30';
  return 'older';
}

export function groupSessions(sessions: SessionMeta[]): { key: GroupKey; label: string; sessions: SessionMeta[] }[] {
  const buckets = new Map<GroupKey, SessionMeta[]>();
  for (const s of sessions) {
    const k = groupForTimestamp(s.updatedAt);
    if (!buckets.has(k)) buckets.set(k, []);
    buckets.get(k)!.push(s);
  }
  return GROUP_ORDER
    .filter(k => buckets.has(k))
    .map(k => ({ key: k, label: GROUP_LABELS[k], sessions: buckets.get(k)! }));
}

export function relativeTime(tsSec: number): string {
  const d = new Date(tsSec * 1000);
  return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}