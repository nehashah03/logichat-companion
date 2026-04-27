import { createSlice, PayloadAction } from "@reduxjs/toolkit";

/* ============================================================
   MESSAGE TYPES
   ============================================================ */

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;

  status:
    | "sending"
    | "streaming"
    | "complete"
    | "error"
    | "cancelled";

  retryQuery?: string;
  error?: string;

  toolOutputs?: ToolOutput[];
  attachments?: FileAttachment[];
  sources?: SourceDoc[];
  citations?: Citation[];
  pipeline?: PipelinePhase[];
  pasteSnippets?: PasteSnippet[];
}

export interface FileAttachment {
  id?: string;
  name: string;
  size: number;
  type: string;
  preview?: string;
  textPreview?: string;
  objectUrl?: string;
  rawText?: string;
}

export interface ToolOutput {
  id: string;
  name: string;
  content: string;
  type: "text" | "table" | "code";
  status?: "running" | "done" | "error";
  startedAt?: number;
  durationMs?: number;
}

export interface PasteSnippet {
  id: string;
  language: string;
  content: string;
  lines: number;
}

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

export type PhaseStatus =
  | "pending"
  | "active"
  | "complete"
  | "error";

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

  /**
   * Always keep this as an array.
   * Older backend/persisted pipeline data may miss it, so we normalize it.
   */
  events: PhaseEvent[];
}

export type PipelineStage =
  | "idle"
  | PhaseKey
  | "streaming"
  | "complete"
  | "error"
  | "cancelled";

/* ============================================================
   BACKEND WEBSOCKET EVENT TYPE
   ============================================================ */

export interface BackendWsEvent {
  type:
    | "turn_start"
    | "phase_start"
    | "phase_event"
    | "event_chunk"
    | "event_done"
    | "phase_done"
    | "token"
    | "sources"
    | "done"
    | "cancelled"
    | "error";

  sessionId?: string;
  turnId?: string;
  userMessageId?: string;

  phase?: PhaseKey;
  eventId?: string;

  label?: string;
  description?: string;
  toolName?: string;

  chunk?: string;
  text?: string;

  durationMs?: number;
  rawOutput?: string;

  sources?: SourceDoc[];
  citations?: Citation[];

  message?: string;
}

/* ============================================================
   STATE
   ============================================================ */

interface ChatState {
  messages: ChatMessage[];
  isStreaming: boolean;
  pipelineStage: PipelineStage;
  livePipeline: PipelinePhase[];
  liveAssistantId: string | null;
  liveTurnId: string | null;
  elapsedTime: number;
  error: string | null;
}

const initialState: ChatState = {
  messages: [],
  isStreaming: false,
  pipelineStage: "idle",
  livePipeline: [],
  liveAssistantId: null,
  liveTurnId: null,
  elapsedTime: 0,
  error: null,
};

/* ============================================================
   HELPERS
   ============================================================ */

function findMessage(state: ChatState, id: string) {
  return state.messages.find((message) => message.id === id);
}

function findPhase(state: ChatState, phaseKey: PhaseKey) {
  return state.livePipeline.find((phase) => phase.key === phaseKey);
}

// /**
//  * This is important.
//  *
//  * Backend/persisted assistant messages may contain pipeline phases without
//  * `events`. PipelinePanel expects events to be an array.
//  */
// function normalizePipeline(phases?: PipelinePhase[]): PipelinePhase[] {
//   if (!Array.isArray(phases)) return [];

//   return phases.map((phase) => ({
//     ...phase,
//     label: phase.label || phase.key,
//     description: phase.description || "",
//     status: phase.status || "pending",
//     events: Array.isArray(phase.events) ? phase.events : [],
//   }));
// }
type RawPipelineEvent = {
  type?: string;
  phase?: PhaseKey;
  eventId?: string;
  label?: string;
  description?: string;
  toolName?: string | null;
  durationMs?: number;
  rawOutput?: string | null;
};

function normalizePipeline(input?: unknown): PipelinePhase[] {
  if (!Array.isArray(input)) return [];

  // Already UI-ready format
  if (input.some((item: any) => item?.key)) {
    return (input as PipelinePhase[]).map((phase) => ({
      ...phase,
      label: phase.label || phase.key,
      description: phase.description || "",
      status: phase.status || "pending",
      events: Array.isArray(phase.events) ? phase.events : [],
    }));
  }

  // Backend flat event trace format
  const phaseMap = new Map<PhaseKey, PipelinePhase>();
  const result: PipelinePhase[] = [];

  const getPhase = (
    key: PhaseKey,
    label?: string,
    description?: string,
  ): PipelinePhase => {
    let phase = phaseMap.get(key);

    if (!phase) {
      phase = {
        key,
        label: label || key,
        description: description || "",
        status: "pending",
        events: [],
      };

      phaseMap.set(key, phase);
      result.push(phase);
    }

    if (label) phase.label = label;
    if (description) phase.description = description;

    return phase;
  };

  for (const raw of input as RawPipelineEvent[]) {
    if (!raw?.phase) continue;

    const phase = getPhase(raw.phase, raw.label, raw.description);

    if (raw.type === "phase_start") {
      phase.status = "active";
    }

    if (raw.type === "phase_event" && raw.eventId) {
      if (!phase.events.some((event) => event.id === raw.eventId)) {
        phase.events.push({
          id: raw.eventId,
          label: raw.label || "Working",
          toolName: raw.toolName || undefined,
          status: "running",
          startedAt: Date.now(),
          detail: raw.toolName ? `Running ${raw.toolName}...` : "",
        });
      }
    }

    if (raw.type === "event_done" && raw.eventId) {
      const event = phase.events.find((item) => item.id === raw.eventId);

      if (event) {
        event.status = "done";
        event.durationMs = raw.durationMs;
        event.rawOutput = raw.rawOutput || undefined;
        event.endedAt = Date.now();

        // Since backend did not persist event_chunk, show a useful summary.
        if (!event.detail && raw.rawOutput) {
          event.detail = "Completed. Open raw output for details.";
        }
      }
    }

    if (raw.type === "phase_done") {
      phase.status = "complete";
      phase.endedAt = Date.now();
    }
  }

  return result;
}

/**
 * Normalize messages coming from backend/session history.
 *
 * This prevents UI crashes when older stored messages are missing optional arrays.
 */
function normalizeMessage(message: ChatMessage): ChatMessage {
  return {
    ...message,
    attachments: message.attachments || [],
    sources: message.sources || [],
    citations: message.citations || [],
    pasteSnippets: message.pasteSnippets || [],
    pipeline: normalizePipeline(message.pipeline),
  };
}

/**
 * Create or update a phase safely.
 *
 * Every created phase MUST include events: [].
 */
function ensurePhase(
  state: ChatState,
  phaseKey: PhaseKey,
  label?: string,
  description?: string,
): PipelinePhase {
  let phase = findPhase(state, phaseKey);

  if (!phase) {
    phase = {
      key: phaseKey,
      label: label || phaseKey,
      description: description || "",
      status: "pending",
      events: [],
    };

    state.livePipeline.push(phase);
  }

  if (!Array.isArray(phase.events)) {
    phase.events = [];
  }

  if (label !== undefined) {
    phase.label = label;
  }

  if (description !== undefined) {
    phase.description = description;
  }

  return phase;
}

function finishLiveStream(
  state: ChatState,
  status: "complete" | "error" | "cancelled",
) {
  state.isStreaming = false;
  state.pipelineStage = status;
  state.liveTurnId = null;

  if (state.liveAssistantId) {
    const assistantMessage = findMessage(state, state.liveAssistantId);

    if (assistantMessage) {
      assistantMessage.status = status;
      assistantMessage.pipeline = normalizePipeline(state.livePipeline);
    }
  }
}

/* ============================================================
   SLICE
   ============================================================ */

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    addMessage(state, action: PayloadAction<ChatMessage>) {
      state.messages.push(normalizeMessage(action.payload));
    },

    appendToMessage(
      state,
      action: PayloadAction<{ id: string; token: string }>,
    ) {
      const message = findMessage(state, action.payload.id);

      if (message) {
        message.content += action.payload.token;
      }
    },

    setMessageStatus(
      state,
      action: PayloadAction<{
        id: string;
        status: ChatMessage["status"];
        error?: string;
        retryQuery?: string;
      }>,
    ) {
      const message = findMessage(state, action.payload.id);

      if (!message) return;

      message.status = action.payload.status;

      if (action.payload.error !== undefined) {
        message.error = action.payload.error;
      }

      if (action.payload.retryQuery !== undefined) {
        message.retryQuery = action.payload.retryQuery;
      }
    },

    setMessageSources(
      state,
      action: PayloadAction<{
        messageId: string;
        sources: SourceDoc[];
        citations: Citation[];
      }>,
    ) {
      const message = findMessage(state, action.payload.messageId);

      if (!message) return;

      message.sources = action.payload.sources || [];
      message.citations = action.payload.citations || [];
    },

    setMessagePipeline(
      state,
      action: PayloadAction<{
        messageId: string;
        pipeline: PipelinePhase[];
      }>,
    ) {
      const message = findMessage(state, action.payload.messageId);

      if (message) {
        message.pipeline = normalizePipeline(action.payload.pipeline);
      }
    },

    initLivePipeline(
      state,
      action: PayloadAction<{
        assistantId: string;
        turnId?: string;
        phases?: PipelinePhase[];
      }>,
    ) {
      state.liveAssistantId = action.payload.assistantId;
      state.liveTurnId = action.payload.turnId || null;
      state.livePipeline = normalizePipeline(action.payload.phases);
      state.isStreaming = true;
      state.pipelineStage = "streaming";
      state.elapsedTime = 0;
      state.error = null;

      const assistantMessage = findMessage(state, action.payload.assistantId);

      if (assistantMessage) {
        assistantMessage.status = "streaming";
        assistantMessage.pipeline = [];
        assistantMessage.sources = [];
        assistantMessage.citations = [];
        assistantMessage.error = undefined;
      }
    },

    setPhaseStatus(
      state,
      action: PayloadAction<{
        phaseKey: PhaseKey;
        status: PhaseStatus;
        label?: string;
        description?: string;
      }>,
    ) {
      const phase = ensurePhase(
        state,
        action.payload.phaseKey,
        action.payload.label,
        action.payload.description,
      );

      phase.status = action.payload.status;

      if (action.payload.status === "active" && !phase.startedAt) {
        phase.startedAt = Date.now();
      }

      if (
        action.payload.status === "complete" ||
        action.payload.status === "error"
      ) {
        phase.endedAt = Date.now();
      }

      state.pipelineStage = action.payload.phaseKey;
    },

    addPhaseEvent(
      state,
      action: PayloadAction<{
        phaseKey: PhaseKey;
        event: PhaseEvent;
      }>,
    ) {
      const phase = ensurePhase(state, action.payload.phaseKey);

      const alreadyExists = phase.events.some(
        (event) => event.id === action.payload.event.id,
      );

      if (!alreadyExists) {
        phase.events.push(action.payload.event);
      }

      phase.status = "active";

      if (!phase.startedAt) {
        phase.startedAt = Date.now();
      }

      state.pipelineStage = action.payload.phaseKey;
    },

    updatePhaseEvent(
      state,
      action: PayloadAction<{
        phaseKey: PhaseKey;
        eventId: string;
        patch: Partial<PhaseEvent>;
      }>,
    ) {
      const phase = ensurePhase(state, action.payload.phaseKey);

      const event = phase.events.find(
        (item) => item.id === action.payload.eventId,
      );

      if (event) {
        Object.assign(event, action.payload.patch);
      }
    },

    appendPhaseEventDetail(
      state,
      action: PayloadAction<{
        phaseKey: PhaseKey;
        eventId: string;
        chunk: string;
      }>,
    ) {
      const phase = ensurePhase(state, action.payload.phaseKey);

      const event = phase.events.find(
        (item) => item.id === action.payload.eventId,
      );

      if (event) {
        event.detail = (event.detail || "") + action.payload.chunk;
      }
    },

    clearLivePipeline(state) {
      state.livePipeline = [];
      state.liveAssistantId = null;
      state.liveTurnId = null;
      state.pipelineStage = "idle";
      state.isStreaming = false;
      state.elapsedTime = 0;
    },

    applyBackendEvent(
      state,
      action: PayloadAction<{
        event: BackendWsEvent;
        assistantId?: string;
        retryQuery?: string;
      }>,
    ) {
      const { event, assistantId, retryQuery } = action.payload;

      const targetAssistantId = assistantId || state.liveAssistantId;

      switch (event.type) {
        case "turn_start": {
          if (event.turnId) {
            state.liveTurnId = event.turnId;
          }

          state.isStreaming = true;
          state.pipelineStage = "streaming";
          state.error = null;
          return;
        }

        case "phase_start": {
          if (!event.phase) return;

          const phase = ensurePhase(
            state,
            event.phase,
            event.label,
            event.description,
          );

          phase.status = "active";

          if (!phase.startedAt) {
            phase.startedAt = Date.now();
          }

          state.pipelineStage = event.phase;
          return;
        }

        case "phase_event": {
          if (!event.phase || !event.eventId) return;

          const phase = ensurePhase(state, event.phase);

          const alreadyExists = phase.events.some(
            (item) => item.id === event.eventId,
          );

          if (!alreadyExists) {
            phase.events.push({
              id: event.eventId,
              label: event.label || "Working",
              toolName: event.toolName,
              status: "running",
              detail: "",
              startedAt: Date.now(),
            });
          }

          phase.status = "active";
          state.pipelineStage = event.phase;
          return;
        }

        case "event_chunk": {
          if (!event.phase || !event.eventId) return;

          const phase = ensurePhase(state, event.phase);

          const phaseEvent = phase.events.find(
            (item) => item.id === event.eventId,
          );

          if (phaseEvent) {
            phaseEvent.detail =
              (phaseEvent.detail || "") + (event.chunk || "");
          }

          return;
        }

        case "event_done": {
          if (!event.phase || !event.eventId) return;

          const phase = ensurePhase(state, event.phase);

          const phaseEvent = phase.events.find(
            (item) => item.id === event.eventId,
          );

          if (phaseEvent) {
            phaseEvent.status = "done";
            phaseEvent.endedAt = Date.now();
            phaseEvent.durationMs = event.durationMs;
            phaseEvent.rawOutput = event.rawOutput;
          }

          return;
        }

        case "phase_done": {
          if (!event.phase) return;

          const phase = ensurePhase(state, event.phase);

          phase.status = "complete";
          phase.endedAt = Date.now();

          state.pipelineStage = "streaming";
          return;
        }

        case "token": {
          if (!targetAssistantId) return;

          const message = findMessage(state, targetAssistantId);

          if (message) {
            message.content += event.text || "";
            message.status = "streaming";
          }

          return;
        }

        case "sources": {
          if (!targetAssistantId) return;

          const message = findMessage(state, targetAssistantId);

          if (message) {
            message.sources = event.sources || [];
            message.citations = event.citations || [];
          }

          return;
        }

        case "done": {
          finishLiveStream(state, "complete");
          return;
        }

        case "cancelled": {
          finishLiveStream(state, "cancelled");
          return;
        }

        case "error": {
          state.error = event.message || "Streaming failed";

          if (targetAssistantId) {
            const message = findMessage(state, targetAssistantId);

            if (message) {
              message.status = "error";
              message.error = state.error;
              message.retryQuery = retryQuery;
              message.pipeline = normalizePipeline(state.livePipeline);
            }
          }

          finishLiveStream(state, "error");
          return;
        }

        default:
          return;
      }
    },

    setStreaming(state, action: PayloadAction<boolean>) {
      state.isStreaming = action.payload;

      if (!action.payload && state.pipelineStage === "streaming") {
        state.pipelineStage = "complete";
      }
    },

    setPipelineStage(state, action: PayloadAction<PipelineStage>) {
      state.pipelineStage = action.payload;
    },

    setElapsedTime(state, action: PayloadAction<number>) {
      state.elapsedTime = action.payload;
    },

    setError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },

    loadMessages(state, action: PayloadAction<ChatMessage[]>) {
      state.messages = action.payload.map(normalizeMessage);
      state.livePipeline = [];
      state.liveAssistantId = null;
      state.liveTurnId = null;
      state.isStreaming = false;
      state.pipelineStage = "idle";
      state.elapsedTime = 0;
      state.error = null;
    },

    clearMessages(state) {
      state.messages = [];
      state.isStreaming = false;
      state.pipelineStage = "idle";
      state.livePipeline = [];
      state.liveAssistantId = null;
      state.liveTurnId = null;
      state.elapsedTime = 0;
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

  applyBackendEvent,

  setStreaming,
  setPipelineStage,
  setElapsedTime,
  setError,

  loadMessages,
  clearMessages,
} = chatSlice.actions;

export default chatSlice.reducer;