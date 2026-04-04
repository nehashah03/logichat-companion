import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  status: 'sending' | 'streaming' | 'complete' | 'error';
  toolOutputs?: ToolOutput[];
  attachments?: FileAttachment[];
}

export interface ToolOutput {
  id: string;
  name: string;
  content: string;
  type: 'text' | 'table' | 'code';
}

export interface FileAttachment {
  name: string;
  size: number;
  type: string;
  preview?: string;
}

export type PipelineStage = 'idle' | 'routing' | 'planning' | 'executing' | 'synthesizing' | 'complete';

interface ChatState {
  messages: ChatMessage[];
  isStreaming: boolean;
  pipelineStage: PipelineStage;
  currentToolName: string | null;
  elapsedTime: number;
  error: string | null;
}

const initialState: ChatState = {
  messages: [],
  isStreaming: false,
  pipelineStage: 'idle',
  currentToolName: null,
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
    updateMessage(state, action: PayloadAction<{ id: string; content: string; status?: ChatMessage['status'] }>) {
      const msg = state.messages.find(m => m.id === action.payload.id);
      if (msg) {
        msg.content = action.payload.content;
        if (action.payload.status) msg.status = action.payload.status;
      }
    },
    appendToMessage(state, action: PayloadAction<{ id: string; token: string }>) {
      const msg = state.messages.find(m => m.id === action.payload.id);
      if (msg) {
        msg.content += action.payload.token;
      }
    },
    setMessageStatus(state, action: PayloadAction<{ id: string; status: ChatMessage['status'] }>) {
      const msg = state.messages.find(m => m.id === action.payload.id);
      if (msg) msg.status = action.payload.status;
    },
    addToolOutput(state, action: PayloadAction<{ messageId: string; output: ToolOutput }>) {
      const msg = state.messages.find(m => m.id === action.payload.messageId);
      if (msg) {
        if (!msg.toolOutputs) msg.toolOutputs = [];
        msg.toolOutputs.push(action.payload.output);
      }
    },
    setStreaming(state, action: PayloadAction<boolean>) {
      state.isStreaming = action.payload;
    },
    setPipelineStage(state, action: PayloadAction<PipelineStage>) {
      state.pipelineStage = action.payload;
    },
    setCurrentTool(state, action: PayloadAction<string | null>) {
      state.currentToolName = action.payload;
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
      state.error = null;
    },
  },
});

export const {
  addMessage, updateMessage, appendToMessage, setMessageStatus,
  addToolOutput, setStreaming, setPipelineStage, setCurrentTool,
  setElapsedTime, setError, loadMessages, clearMessages,
} = chatSlice.actions;
export default chatSlice.reducer;
