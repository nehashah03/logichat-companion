import type { Session } from '../features/session/sessionSlice';
import type { ChatMessage } from '../features/chat/chatSlice';

export type ExportFormat = 'md' | 'txt' | 'json';

function fmtDate(ts: number) {
  return new Date(ts).toLocaleString();
}

function toMarkdown(session: Session): string {
  const lines: string[] = [];
  lines.push(`# ${session.title}`);
  lines.push('');
  lines.push(`_Created: ${fmtDate(session.createdAt)} • Updated: ${fmtDate(session.updatedAt)}_`);
  lines.push('');
  for (const m of session.messages) {
    lines.push(`---`);
    lines.push(`### ${m.role === 'user' ? '👤 You' : '🤖 Assistant'}  \n_${fmtDate(m.timestamp)}_`);
    lines.push('');
    if (m.attachments?.length) {
      lines.push(`**Attachments:** ${m.attachments.map(a => a.name).join(', ')}`);
      lines.push('');
    }
    lines.push(m.content || '_(empty)_');
    lines.push('');
    if (m.sources?.length) {
      lines.push(`**Sources:**`);
      m.sources.forEach((s, i) => lines.push(`- [${i + 1}] ${s.name} — ${s.snippet}`));
      lines.push('');
    }
  }
  return lines.join('\n');
}

function toText(session: Session): string {
  const lines: string[] = [];
  lines.push(session.title);
  lines.push('='.repeat(session.title.length));
  lines.push('');
  for (const m of session.messages) {
    lines.push(`[${m.role === 'user' ? 'You' : 'Assistant'}] ${fmtDate(m.timestamp)}`);
    lines.push(m.content);
    lines.push('');
    lines.push('---');
    lines.push('');
  }
  return lines.join('\n');
}

function toJSON(session: Session): string {
  return JSON.stringify(session, null, 2);
}

export function exportSession(session: Session, format: ExportFormat) {
  let content = '';
  let mime = 'text/plain';
  let ext = 'txt';
  if (format === 'md') { content = toMarkdown(session); mime = 'text/markdown'; ext = 'md'; }
  else if (format === 'json') { content = toJSON(session); mime = 'application/json'; ext = 'json'; }
  else { content = toText(session); }
  const safeTitle = session.title.replace(/[^a-z0-9-_]+/gi, '_').slice(0, 60) || 'conversation';
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${safeTitle}.${ext}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function searchSessions(sessions: Session[], q: string): Session[] {
  if (!q.trim()) return sessions;
  const needle = q.toLowerCase();
  return sessions.filter(s => {
    if (s.title.toLowerCase().includes(needle)) return true;
    return s.messages.some((m: ChatMessage) => m.content.toLowerCase().includes(needle));
  });
}
