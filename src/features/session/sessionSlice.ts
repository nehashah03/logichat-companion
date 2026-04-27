import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { ChatMessage } from "../chat/chatSlice";

/* ============================================================
   SESSION TYPES
   ============================================================ */

export interface Session {
  id: string;
  title: string;

  /**
   * Backend uses seconds from time.time().
   * Frontend-created temporary sessions may use Date.now().
   * UI should only use this for sorting/display.
   */
  createdAt: number;
  updatedAt: number;

  /**
   * Full messages are optional for sidebar sessions.
   * Backend /api/sessions returns metadata only.
   * /api/sessions/:id returns full session with messages.
   */
  messages?: ChatMessage[];

  favorite?: boolean;

  /**
   * Backend sidebar fields.
   */
  messageCount?: number;
  preview?: string;
  matchSnippet?: string;
}

interface SessionState {
  sessions: Session[];
  activeSessionId: string | null;

  /**
   * Used for sidebar skeleton loading.
   */
  isLoading: boolean;

  /**
   * Used when loading one selected conversation.
   */
  isLoadingActiveSession: boolean;

  error: string | null;
}

const initialState: SessionState = {
  sessions: [],
  activeSessionId: null,
  isLoading: false,
  isLoadingActiveSession: false,
  error: null,
};

/* ============================================================
   HELPERS
   ============================================================ */

function sortSessions(sessions: Session[]) {
  sessions.sort((a, b) => b.updatedAt - a.updatedAt);
}

function createTitleFromMessages(messages: ChatMessage[]) {
  const firstUserMessage = messages.find((message) => message.role === "user");

  if (!firstUserMessage?.content?.trim()) {
    return "New Conversation";
  }

  const content = firstUserMessage.content.trim();

  return content.slice(0, 50) + (content.length > 50 ? "..." : "");
}

function shouldAutoRename(title: string) {
  return !title || title === "New Conversation";
}

/* ============================================================
   SLICE
   ============================================================ */

const sessionSlice = createSlice({
  name: "session",
  initialState,
  reducers: {
    /* ========================================================
       LOADING / ERROR
       ======================================================== */

    setSessionsLoading(state, action: PayloadAction<boolean>) {
      state.isLoading = action.payload;
    },

    setActiveSessionLoading(state, action: PayloadAction<boolean>) {
      state.isLoadingActiveSession = action.payload;
    },

    setSessionError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },

    /* ========================================================
       BACKEND SESSION LIST
       ======================================================== */

    setSessions(state, action: PayloadAction<Session[]>) {
      state.sessions = action.payload;
      sortSessions(state.sessions);
      state.error = null;

      /**
       * Keep active session if it still exists.
       * Otherwise select newest session.
       */
      if (
        state.activeSessionId &&
        !state.sessions.some((session) => session.id === state.activeSessionId)
      ) {
        state.activeSessionId = state.sessions[0]?.id || null;
      }
    },

    upsertSession(state, action: PayloadAction<Session>) {
      const index = state.sessions.findIndex(
        (session) => session.id === action.payload.id,
      );

      if (index >= 0) {
        state.sessions[index] = {
          ...state.sessions[index],
          ...action.payload,
        };
      } else {
        state.sessions.unshift(action.payload);
      }

      sortSessions(state.sessions);
    },

    /* ========================================================
       CREATE / ACTIVE
       ======================================================== */

    createSession(state, action: PayloadAction<Session>) {
      const existing = state.sessions.find(
        (session) => session.id === action.payload.id,
      );

      if (!existing) {
        state.sessions.unshift(action.payload);
      }

      state.activeSessionId = action.payload.id;
      sortSessions(state.sessions);
    },

    setActiveSession(state, action: PayloadAction<string | null>) {
      state.activeSessionId = action.payload;
      state.error = null;
    },

    /* ========================================================
       FULL SESSION LOAD
       ======================================================== */

    setFullSession(state, action: PayloadAction<Session>) {
      const incoming = action.payload;

      const index = state.sessions.findIndex(
        (session) => session.id === incoming.id,
      );

      if (index >= 0) {
        state.sessions[index] = {
          ...state.sessions[index],
          ...incoming,
        };
      } else {
        state.sessions.unshift(incoming);
      }

      state.activeSessionId = incoming.id;
      state.isLoadingActiveSession = false;
      state.error = null;

      sortSessions(state.sessions);
    },

    updateSessionMessages(
      state,
      action: PayloadAction<{
        id: string;
        messages: ChatMessage[];
      }>,
    ) {
      const session = state.sessions.find(
        (item) => item.id === action.payload.id,
      );

      if (!session) return;

      session.messages = action.payload.messages;
      session.messageCount = action.payload.messages.length;
      session.updatedAt = Date.now();

      const firstUserMessage = action.payload.messages.find(
        (message) => message.role === "user",
      );

      if (firstUserMessage) {
        session.preview = firstUserMessage.content.slice(0, 120);
      }

      if (shouldAutoRename(session.title)) {
        session.title = createTitleFromMessages(action.payload.messages);
      }

      sortSessions(state.sessions);
    },

    /* ========================================================
       RENAME / FAVORITE
       ======================================================== */

    renameSession(
      state,
      action: PayloadAction<{
        id: string;
        title: string;
      }>,
    ) {
      const session = state.sessions.find(
        (item) => item.id === action.payload.id,
      );

      if (!session) return;

      const cleanTitle = action.payload.title.trim();

      if (cleanTitle) {
        session.title = cleanTitle;
        session.updatedAt = Date.now();
      }

      sortSessions(state.sessions);
    },

    setFavorite(
      state,
      action: PayloadAction<{
        id: string;
        favorite: boolean;
      }>,
    ) {
      const session = state.sessions.find(
        (item) => item.id === action.payload.id,
      );

      if (!session) return;

      session.favorite = action.payload.favorite;
      session.updatedAt = Date.now();

      sortSessions(state.sessions);
    },

    toggleFavorite(state, action: PayloadAction<string>) {
      const session = state.sessions.find(
        (item) => item.id === action.payload,
      );

      if (!session) return;

      session.favorite = !session.favorite;
      session.updatedAt = Date.now();

      sortSessions(state.sessions);
    },

    /* ========================================================
       DELETE / RESET
       ======================================================== */

    deleteSession(state, action: PayloadAction<string>) {
      state.sessions = state.sessions.filter(
        (session) => session.id !== action.payload,
      );

      if (state.activeSessionId === action.payload) {
        state.activeSessionId = state.sessions[0]?.id || null;
      }
    },

    clearAllSessions(state) {
      state.sessions = [];
      state.activeSessionId = null;
      state.isLoading = false;
      state.isLoadingActiveSession = false;
      state.error = null;
    },
  },
});

/* ============================================================
   EXPORTS
   ============================================================ */

export const {
  setSessionsLoading,
  setActiveSessionLoading,
  setSessionError,

  setSessions,
  upsertSession,

  createSession,
  setActiveSession,

  setFullSession,
  updateSessionMessages,

  renameSession,
  setFavorite,
  toggleFavorite,

  deleteSession,
  clearAllSessions,
} = sessionSlice.actions;

export default sessionSlice.reducer;