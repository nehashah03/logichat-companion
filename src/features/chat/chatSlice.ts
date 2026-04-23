import { createSlice, PayloadAction } from "@reduxjs/toolkit";

/* ============================================================
   MESSAGE TYPES
   ============================================================ */

/**
 * Each chat message (user or assistant)
 */
export interface ChatMessage {
  id: string;

  // Who sent the message
  role: "user" | "assistant";

  // Main text content (markdown supported)
  content: string;

  // Timestamp (used for UI display)
  timestamp: number;

  // Message lifecycle state
  status: "sending" | "streaming" | "complete" | "error";

  // Tool outputs (future / optional)
  toolOutputs?: ToolOutput[];

  // ✅ Attachments (ENHANCED - backward compatible)
  attachments?: FileAttachment[];

  // Sources & citations (assistant only)
  sources?: SourceDoc[];
  citations?: Citation[];

  // Persisted pipeline (assistant only)
  pipeline?: PipelinePhase[];

  // Legacy paste snippets (keep for compatibility)
  pasteSnippets?: PasteSnippet[];
}

/* ============================================================
   ATTACHMENT TYPE (ENHANCED)
   ============================================================ */

/**
 * File attachment used across:
 * - ChatInput (before send)
 * - MessageBubble (after send)
 *
 * ⚠️ This is backward compatible
 */
export interface FileAttachment {
  id?: string;              // optional unique id for UI lists

  name: string;
  size: number;
  type: string;

  // Image preview (base64 or objectURL)
  preview?: string;

  // Small preview (optional)
  textPreview?: string;

  // ✅ NEW: keep object URL for preview after send
  objectUrl?: string;

  // ✅ NEW: full raw text for preview dialog
  rawText?: string;
}

/* ============================================================
   TOOL OUTPUT
   ============================================================ */

export interface ToolOutput {
  id: string;
  name: string;
  content: string;
  type: "text" | "table" | "code";
  status?: "running" | "done" | "error";
  startedAt?: number;
  durationMs?: number;
}

/* ============================================================
   PASTE SNIPPETS (LEGACY)
   ============================================================ */

export interface PasteSnippet {
  id: string;
  language: string;
  content: string;
  lines: number;
}

/* ============================================================
   SOURCES + CITATIONS
   ============================================================ */

export interface SourceDoc {
  id: string;
  name: string;
  url?: string;
  snippet: string;
  page?: number;
}

export interface Citation {
  index: number;
  sourceId: string;
  text: string;
}

/* ============================================================
   PIPELINE TYPES
   ============================================================ */

export type PhaseKey =
  | "routing"
  | "planning"
  | "executing"
  | "synthesizing";

export type PhaseStatus = "pending" | "active" | "complete";

export interface PhaseEvent {
  id: string;
  label: string;
  detail?: string;
  toolName?: string;
  status: "running" | "done" | "error";
  startedAt: number;
  endedAt?: number;
  rawOutput?: string;
  durationMs?: number;
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

export type PipelineStage =
  | "idle"
  | PhaseKey
  | "streaming"
  | "complete";

/* ============================================================
   STATE
   ============================================================ */

interface ChatState {
  messages: ChatMessage[];

  isStreaming: boolean;

  pipelineStage: PipelineStage;

  livePipeline: PipelinePhase[];

  liveAssistantId: string | null;

  elapsedTime: number;

  error: string | null;
}

const initialState: ChatState = {
  messages: [],
  isStreaming: false,
  pipelineStage: "idle",
  livePipeline: [],
  liveAssistantId: null,
  elapsedTime: 0,
  error: null,
};

/* ============================================================
   SLICE
   ============================================================ */

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    /* ========================================================
       MESSAGE OPERATIONS
       ======================================================== */

    /**
     * Add a new message (user or assistant)
     */
    addMessage(state, action: PayloadAction<ChatMessage>) {
      state.messages.push(action.payload);
    },

    /**
     * Append streaming token to assistant message
     */
    appendToMessage(
      state,
      action: PayloadAction<{ id: string; token: string }>,
    ) {
      const msg = state.messages.find(
        (m) => m.id === action.payload.id,
      );
      if (msg) msg.content += action.payload.token;
    },

    /**
     * Update message status (streaming → complete / error)
     */
    setMessageStatus(
      state,
      action: PayloadAction<{
        id: string;
        status: ChatMessage["status"];
      }>,
    ) {
      const msg = state.messages.find(
        (m) => m.id === action.payload.id,
      );
      if (msg) msg.status = action.payload.status;
    },

    /**
     * Attach sources & citations to assistant message
     */
    setMessageSources(
      state,
      action: PayloadAction<{
        messageId: string;
        sources: SourceDoc[];
        citations: Citation[];
      }>,
    ) {
      const msg = state.messages.find(
        (m) => m.id === action.payload.messageId,
      );
      if (msg) {
        msg.sources = action.payload.sources;
        msg.citations = action.payload.citations;
      }
    },

    /**
     * Persist full pipeline trace into message
     */
    setMessagePipeline(
      state,
      action: PayloadAction<{
        messageId: string;
        pipeline: PipelinePhase[];
      }>,
    ) {
      const msg = state.messages.find(
        (m) => m.id === action.payload.messageId,
      );
      if (msg) msg.pipeline = action.payload.pipeline;
    },

    /* ========================================================
       LIVE PIPELINE (STREAMING)
       ======================================================== */

    initLivePipeline(
      state,
      action: PayloadAction<{
        assistantId: string;
        phases: PipelinePhase[];
      }>,
    ) {
      state.liveAssistantId = action.payload.assistantId;
      state.livePipeline = action.payload.phases;
    },

    setPhaseStatus(
      state,
      action: PayloadAction<{
        phaseKey: PhaseKey;
        status: PhaseStatus;
      }>,
    ) {
      const phase = state.livePipeline.find(
        (p) => p.key === action.payload.phaseKey,
      );

      if (phase) {
        phase.status = action.payload.status;

        if (
          action.payload.status === "active" &&
          !phase.startedAt
        ) {
          phase.startedAt = Date.now();
        }

        if (action.payload.status === "complete") {
          phase.endedAt = Date.now();
        }
      }
    },

    addPhaseEvent(
      state,
      action: PayloadAction<{
        phaseKey: PhaseKey;
        event: PhaseEvent;
      }>,
    ) {
      const phase = state.livePipeline.find(
        (p) => p.key === action.payload.phaseKey,
      );
      if (phase) phase.events.push(action.payload.event);
    },

    updatePhaseEvent(
      state,
      action: PayloadAction<{
        phaseKey: PhaseKey;
        eventId: string;
        patch: Partial<PhaseEvent>;
      }>,
    ) {
      const phase = state.livePipeline.find(
        (p) => p.key === action.payload.phaseKey,
      );
      if (!phase) return;

      const event = phase.events.find(
        (e) => e.id === action.payload.eventId,
      );

      if (event) Object.assign(event, action.payload.patch);
    },

    appendPhaseEventDetail(
      state,
      action: PayloadAction<{
        phaseKey: PhaseKey;
        eventId: string;
        chunk: string;
      }>,
    ) {
      const phase = state.livePipeline.find(
        (p) => p.key === action.payload.phaseKey,
      );
      if (!phase) return;

      const event = phase.events.find(
        (e) => e.id === action.payload.eventId,
      );

      if (event) {
        event.detail = (event.detail || "") + action.payload.chunk;
      }
    },

    clearLivePipeline(state) {
      state.livePipeline = [];
      state.liveAssistantId = null;
    },

    /* ========================================================
       GLOBAL FLAGS
       ======================================================== */

    setStreaming(state, action: PayloadAction<boolean>) {
      state.isStreaming = action.payload;
    },

    setPipelineStage(
      state,
      action: PayloadAction<PipelineStage>,
    ) {
      state.pipelineStage = action.payload;
    },

    setElapsedTime(
      state,
      action: PayloadAction<number>,
    ) {
      state.elapsedTime = action.payload;
    },

    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },

    /* ========================================================
       LOAD / RESET
       ======================================================== */

    loadMessages(state, action: PayloadAction<ChatMessage[]>) {
      state.messages = action.payload;
    },

    clearMessages(state) {
      state.messages = [];
      state.isStreaming = false;
      state.pipelineStage = "idle";
      state.livePipeline = [];
      state.liveAssistantId = null;
      state.error = null;
    },
  },
});

/* ============================================================
   EXPORTS
   ============================================================ */

export const {
  addMessage,
  appendToMessage,
  setMessageStatus,
  setMessageSources,
  setMessagePipeline,
  initLivePipeline,
  setPhaseStatus,
  addPhaseEvent,
  updatePhaseEvent,
  appendPhaseEventDetail,
  clearLivePipeline,
  setStreaming,
  setPipelineStage,
  setElapsedTime,
  setError,
  loadMessages,
  clearMessages,
} = chatSlice.actions;

export default chatSlice.reducer;