/**
 * Chat slice.
 *
 * **Per-session state.** Every key is a `Record<sessionId, T>` so multiple
 * chats can stream concurrently without interfering with each other.
 * Selectors take a `sessionId` to read the right slice.
 *
 * No content is read from `localStorage` — Redux is the only client-side
 * source of truth. The server (`backend/storage.py`) is the durable source.
 */
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

// ---- Domain types ---------------------------------------------------------
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  status: 'sending' | 'streaming' | 'complete' | 'error' | 'cancelled';
  attachments?: FileAttachment[];
  sources?: SourceDoc[];
  citations?: Citation[];
  pipeline?: PipelinePhase[];   // persisted full pipeline trace
  pasteSnippets?: PasteSnippet[];
}

export interface FileAttachment {
  name: string;
  size: number;
  type: string;
  preview?: string;
}

export interface PasteSnippet {
  id: string;
  language: string;
  content: string;
  lines: number;
}

export interface SourceDoc { id: string; name: string; url?: string; snippet: string; page?: number; }
export interface Citation  { index: number; sourceId: string; text: string; }

// ---- Pipeline ----
export type PhaseKey = 'routing' | 'planning' | 'executing' | 'synthesizing';
export type PhaseStatus = 'pending' | 'active' | 'complete';

export interface PhaseEvent {
  id: string;
  label: string;
  detail?: string;
  toolName?: string;
  status: 'running' | 'done' | 'error';
  startedAt: number;
  endedAt?: number;
  durationMs?: number;
  rawOutput?: string;
}

export interface PipelinePhase {
  key: PhaseKey;
  label: string;
  description: string;
  status: PhaseStatus;
  startedAt?: number;
  endedAt?: number;
  events: PhaseEvent[];
}

/** Per-session live streaming state. Keyed by sessionId in the slice. */
export interface LiveTurnState {
  turnId: string;
  assistantMessageId: string;
  pipeline: PipelinePhase[];
  isStreaming: boolean;
}

interface ChatState {
  /** sessionId → ordered messages */
  messagesBySession: Record<string, ChatMessage[]>;
  /** sessionId → live turn state (only present while streaming) */
  liveBySession: Record<string, LiveTurnState | undefined>;
  /** Last-error toast text, global. */
  error: string | null;
}

const initialState: ChatState = {
  messagesBySession: {},
  liveBySession: {},
  error: null,
};

function ensureMsgs(state: ChatState, sid: string): ChatMessage[] {
  if (!state.messagesBySession[sid]) state.messagesBySession[sid] = [];
  return state.messagesBySession[sid];
}

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    /** Replace the entire message array for a session (e.g. after fetch). */
    setMessages(state, a: PayloadAction<{ sessionId: string; messages: ChatMessage[] }>) {
      state.messagesBySession[a.payload.sessionId] = a.payload.messages;
    },
    addMessage(state, a: PayloadAction<{ sessionId: string; message: ChatMessage }>) {
      ensureMsgs(state, a.payload.sessionId).push(a.payload.message);
    },
    appendToken(state, a: PayloadAction<{ sessionId: string; messageId: string; token: string }>) {
      const m = state.messagesBySession[a.payload.sessionId]?.find(x => x.id === a.payload.messageId);
      if (m) m.content += a.payload.token;
    },
    setMessageStatus(state, a: PayloadAction<{ sessionId: string; messageId: string; status: ChatMessage['status'] }>) {
      const m = state.messagesBySession[a.payload.sessionId]?.find(x => x.id === a.payload.messageId);
      if (m) m.status = a.payload.status;
    },
    setMessageSources(state, a: PayloadAction<{ sessionId: string; messageId: string; sources: SourceDoc[]; citations: Citation[] }>) {
      const m = state.messagesBySession[a.payload.sessionId]?.find(x => x.id === a.payload.messageId);
      if (m) { m.sources = a.payload.sources; m.citations = a.payload.citations; }
    },
    setMessagePipeline(state, a: PayloadAction<{ sessionId: string; messageId: string; pipeline: PipelinePhase[] }>) {
      const m = state.messagesBySession[a.payload.sessionId]?.find(x => x.id === a.payload.messageId);
      if (m) m.pipeline = a.payload.pipeline;
    },

    // ---- Live pipeline (per-session) ----
    initLive(state, a: PayloadAction<{ sessionId: string; turnId: string; assistantMessageId: string; phases: PipelinePhase[] }>) {
      state.liveBySession[a.payload.sessionId] = {
        turnId: a.payload.turnId,
        assistantMessageId: a.payload.assistantMessageId,
        pipeline: a.payload.phases,
        isStreaming: true,
      };
    },
    setPhaseStatus(state, a: PayloadAction<{ sessionId: string; phaseKey: PhaseKey; status: PhaseStatus }>) {
      const live = state.liveBySession[a.payload.sessionId];
      const ph = live?.pipeline.find(p => p.key === a.payload.phaseKey);
      if (!ph) return;
      ph.status = a.payload.status;
      if (a.payload.status === 'active' && !ph.startedAt) ph.startedAt = Date.now();
      if (a.payload.status === 'complete') ph.endedAt = Date.now();
    },
    addPhaseEvent(state, a: PayloadAction<{ sessionId: string; phaseKey: PhaseKey; event: PhaseEvent }>) {
      const live = state.liveBySession[a.payload.sessionId];
      live?.pipeline.find(p => p.key === a.payload.phaseKey)?.events.push(a.payload.event);
    },
    appendPhaseEventDetail(state, a: PayloadAction<{ sessionId: string; phaseKey: PhaseKey; eventId: string; chunk: string }>) {
      const ev = state.liveBySession[a.payload.sessionId]?.pipeline
        .find(p => p.key === a.payload.phaseKey)?.events.find(e => e.id === a.payload.eventId);
      if (ev) ev.detail = (ev.detail || '') + a.payload.chunk;
    },
    updatePhaseEvent(state, a: PayloadAction<{ sessionId: string; phaseKey: PhaseKey; eventId: string; patch: Partial<PhaseEvent> }>) {
      const ev = state.liveBySession[a.payload.sessionId]?.pipeline
        .find(p => p.key === a.payload.phaseKey)?.events.find(e => e.id === a.payload.eventId);
      if (ev) Object.assign(ev, a.payload.patch);
    },
    setLiveStreaming(state, a: PayloadAction<{ sessionId: string; isStreaming: boolean }>) {
      const live = state.liveBySession[a.payload.sessionId];
      if (live) live.isStreaming = a.payload.isStreaming;
    },
    clearLive(state, a: PayloadAction<{ sessionId: string }>) {
      delete state.liveBySession[a.payload.sessionId];
    },

    setError(state, a: PayloadAction<string | null>) { state.error = a.payload; },

    /** Wipe everything for a session (after delete). */
    dropSession(state, a: PayloadAction<string>) {
      delete state.messagesBySession[a.payload];
      delete state.liveBySession[a.payload];
    },
  },
});

export const {
  setMessages, addMessage, appendToken, setMessageStatus,
  setMessageSources, setMessagePipeline,
  initLive, setPhaseStatus, addPhaseEvent,
  appendPhaseEventDetail, updatePhaseEvent,
  setLiveStreaming, clearLive,
  setError, dropSession,
} = chatSlice.actions;

export default chatSlice.reducer;