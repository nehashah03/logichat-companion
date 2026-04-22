import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { ChatMessage } from '../chat/chatSlice';

export interface Session {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: ChatMessage[];
  favorite?: boolean;
}

interface SessionState {
  sessions: Session[];
  activeSessionId: string | null;
}

const initialState: SessionState = {
  sessions: [],
  activeSessionId: null,
};

const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    createSession(state, action: PayloadAction<Session>) {
      state.sessions.unshift(action.payload);
      state.activeSessionId = action.payload.id;
    },
    setActiveSession(state, action: PayloadAction<string>) {
      state.activeSessionId = action.payload;
    },
    updateSessionMessages(state, action: PayloadAction<{ id: string; messages: ChatMessage[] }>) {
      const session = state.sessions.find(s => s.id === action.payload.id);
      if (session) {
        session.messages = action.payload.messages;
        session.updatedAt = Date.now();
        if (action.payload.messages.length > 0) {
          const firstUserMsg = action.payload.messages.find(m => m.role === 'user');
          // Only auto-set title if it's still the default
          if (firstUserMsg && (session.title === 'New Conversation' || session.title.startsWith(firstUserMsg.content.slice(0, 20)))) {
            session.title = firstUserMsg.content.slice(0, 50) + (firstUserMsg.content.length > 50 ? '...' : '');
          }
        }
      }
    },
    renameSession(state, action: PayloadAction<{ id: string; title: string }>) {
      const session = state.sessions.find(s => s.id === action.payload.id);
      if (session) session.title = action.payload.title.trim() || session.title;
    },
    toggleFavorite(state, action: PayloadAction<string>) {
      const session = state.sessions.find(s => s.id === action.payload);
      if (session) session.favorite = !session.favorite;
    },
    deleteSession(state, action: PayloadAction<string>) {
      state.sessions = state.sessions.filter(s => s.id !== action.payload);
      if (state.activeSessionId === action.payload) {
        state.activeSessionId = state.sessions[0]?.id || null;
      }
    },
    clearAllSessions(state) {
      state.sessions = [];
      state.activeSessionId = null;
    },
  },
});

export const {
  createSession, setActiveSession, updateSessionMessages,
  renameSession, toggleFavorite, deleteSession, clearAllSessions,
} = sessionSlice.actions;
export default sessionSlice.reducer;
