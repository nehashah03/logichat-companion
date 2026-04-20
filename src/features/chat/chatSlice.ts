import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  status: 'sending' | 'streaming' | 'complete' | 'error';
  toolOutputs?: ToolOutput[];
  attachments?: FileAttachment[];
  sources?: SourceDoc[];
  citations?: Citation[];
  pipeline?: PipelinePhase[]; // persisted full pipeline trace
  pasteSnippets?: PasteSnippet[];
}

export interface ToolOutput {
  id: string;
  name: string;       // e.g. "splunk.search", "jira.query"
  content: string;
  type: 'text' | 'table' | 'code';
  status?: 'running' | 'done' | 'error';
  startedAt?: number;
  durationMs?: number;
}

export interface FileAttachment {
  name: string;
  size: number;
  type: string;
  preview?: string;       // image dataURL/objectURL
  textPreview?: string;   // first lines of text-based file
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
  index: number;          // [1], [2]…
  sourceId: string;
  text: string;
}

// ---- Pipeline (Routing → Planning → Executing → Synthesizing) ----
export type PhaseKey = 'routing' | 'planning' | 'executing' | 'synthesizing';
export type PhaseStatus = 'pending' | 'active' | 'complete';

export interface PhaseEvent {
  id: string;
  label: string;          // human readable line, e.g. "Routing query to Splunk tool"
  detail?: string;        // streaming detail text
  toolName?: string;      // e.g. "splunk.search"
  status: 'running' | 'done' | 'error';
  startedAt: number;
  endedAt?: number;
  rawOutput?: string;     // raw tool output for power-user expansion
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

export type PipelineStage = 'idle' | PhaseKey | 'streaming' | 'complete';

interface ChatState {
  messages: ChatMessage[];
  isStreaming: boolean;
  pipelineStage: PipelineStage;
  livePipeline: PipelinePhase[];      // current in-flight phases for active assistant msg
  liveAssistantId: string | null;
  elapsedTime: number;
  error: string | null;
}

const initialState: ChatState = {
  messages: [],
  isStreaming: false,
  pipelineStage: 'idle',
  livePipeline: [],
  liveAssistantId: null,
  elapsedTime: 0,
  error: null,
};

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addMessage(state, action: PayloadAction<ChatMessage>) {
      state.messages.push(action.payload);
    },
    appendToMessage(state, action: PayloadAction<{ id: string; token: string }>) {
      const msg = state.messages.find(m => m.id === action.payload.id);
      if (msg) msg.content += action.payload.token;
    },
    setMessageStatus(state, action: PayloadAction<{ id: string; status: ChatMessage['status'] }>) {
      const msg = state.messages.find(m => m.id === action.payload.id);
      if (msg) msg.status = action.payload.status;
    },
    setMessageSources(state, action: PayloadAction<{ messageId: string; sources: SourceDoc[]; citations: Citation[] }>) {
      const msg = state.messages.find(m => m.id === action.payload.messageId);
      if (msg) {
        msg.sources = action.payload.sources;
        msg.citations = action.payload.citations;
      }
    },
    setMessagePipeline(state, action: PayloadAction<{ messageId: string; pipeline: PipelinePhase[] }>) {
      const msg = state.messages.find(m => m.id === action.payload.messageId);
      if (msg) msg.pipeline = action.payload.pipeline;
    },
    // ---- Live pipeline mutations (during streaming) ----
    initLivePipeline(state, action: PayloadAction<{ assistantId: string; phases: PipelinePhase[] }>) {
      state.liveAssistantId = action.payload.assistantId;
      state.livePipeline = action.payload.phases;
    },
    setPhaseStatus(state, action: PayloadAction<{ phaseKey: PhaseKey; status: PhaseStatus }>) {
      const ph = state.livePipeline.find(p => p.key === action.payload.phaseKey);
      if (ph) {
        ph.status = action.payload.status;
        if (action.payload.status === 'active' && !ph.startedAt) ph.startedAt = Date.now();
        if (action.payload.status === 'complete') ph.endedAt = Date.now();
      }
    },
    addPhaseEvent(state, action: PayloadAction<{ phaseKey: PhaseKey; event: PhaseEvent }>) {
      const ph = state.livePipeline.find(p => p.key === action.payload.phaseKey);
      if (ph) ph.events.push(action.payload.event);
    },
    updatePhaseEvent(state, action: PayloadAction<{ phaseKey: PhaseKey; eventId: string; patch: Partial<PhaseEvent> }>) {
      const ph = state.livePipeline.find(p => p.key === action.payload.phaseKey);
      if (!ph) return;
      const ev = ph.events.find(e => e.id === action.payload.eventId);
      if (ev) Object.assign(ev, action.payload.patch);
    },
    appendPhaseEventDetail(state, action: PayloadAction<{ phaseKey: PhaseKey; eventId: string; chunk: string }>) {
      const ph = state.livePipeline.find(p => p.key === action.payload.phaseKey);
      if (!ph) return;
      const ev = ph.events.find(e => e.id === action.payload.eventId);
      if (ev) ev.detail = (ev.detail || '') + action.payload.chunk;
    },
    clearLivePipeline(state) {
      state.livePipeline = [];
      state.liveAssistantId = null;
    },
    setStreaming(state, action: PayloadAction<boolean>) {
      state.isStreaming = action.payload;
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
      state.messages = action.payload;
    },
    clearMessages(state) {
      state.messages = [];
      state.isStreaming = false;
      state.pipelineStage = 'idle';
      state.livePipeline = [];
      state.liveAssistantId = null;
      state.error = null;
    },
  },
});

export const {
  addMessage, appendToMessage, setMessageStatus,
  setMessageSources, setMessagePipeline,
  initLivePipeline, setPhaseStatus, addPhaseEvent, updatePhaseEvent,
  appendPhaseEventDetail, clearLivePipeline,
  setStreaming, setPipelineStage, setElapsedTime, setError,
  loadMessages, clearMessages,
} = chatSlice.actions;
export default chatSlice.reducer;
