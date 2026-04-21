/**
 * Session slice — backed by the backend (`/api/sessions`).
 *
 * The slice holds **only metadata** (id, title, dates, favorite, message
 * count). Full message bodies live in `chatSlice.messagesBySession[id]`
 * and are loaded on demand when the user opens a session.
 *
 * No localStorage — server is the source of truth.
 */
import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { api, SessionMeta } from '../../services/api';

interface SessionState {
  sessions: SessionMeta[];
  activeSessionId: string | null;
  loading: boolean;
  searchQuery: string;
  /** When set, sessions list is showing search results from the backend. */
  searchResults: SessionMeta[] | null;
  error: string | null;
}

const initialState: SessionState = {
  sessions: [],
  activeSessionId: null,
  loading: false,
  searchQuery: '',
  searchResults: null,
  error: null,
};

// ---- Async thunks --------------------------------------------------------
export const fetchSessions = createAsyncThunk('session/fetch', () => api.listSessions());

export const createSessionRemote = createAsyncThunk(
  'session/create',
  async (title?: string) => api.createSession(title),
);

export const renameSessionRemote = createAsyncThunk(
  'session/rename',
  async (p: { id: string; title: string }) => api.patchSession(p.id, { title: p.title }),
);

export const toggleFavoriteRemote = createAsyncThunk(
  'session/favorite',
  async (p: { id: string; favorite: boolean }) => api.patchSession(p.id, { favorite: p.favorite }),
);

export const deleteSessionRemote = createAsyncThunk(
  'session/delete',
  async (id: string) => { await api.deleteSession(id); return id; },
);

export const searchSessionsRemote = createAsyncThunk(
  'session/search',
  async (q: string) => api.search(q),
);

// ---- Slice ---------------------------------------------------------------
const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    setActiveSession(state, a: PayloadAction<string | null>) {
      state.activeSessionId = a.payload;
    },
    setSearchQuery(state, a: PayloadAction<string>) {
      state.searchQuery = a.payload;
      if (!a.payload.trim()) state.searchResults = null;
    },
    /** Optimistically bump a session's updatedAt + title (after a turn). */
    touchSession(state, a: PayloadAction<{ id: string; title?: string; preview?: string }>) {
      const s = state.sessions.find(x => x.id === a.payload.id);
      if (s) {
        s.updatedAt = Date.now() / 1000;
        if (a.payload.title) s.title = a.payload.title;
        if (a.payload.preview !== undefined) s.preview = a.payload.preview;
      }
    },
  },
  extraReducers: (b) => {
    b.addCase(fetchSessions.pending, (s) => { s.loading = true; s.error = null; });
    b.addCase(fetchSessions.fulfilled, (s, a) => {
      s.loading = false;
      s.sessions = a.payload;
      // Default to first session if none selected
      if (!s.activeSessionId && a.payload.length) s.activeSessionId = a.payload[0].id;
    });
    b.addCase(fetchSessions.rejected, (s, a) => { s.loading = false; s.error = a.error.message || 'Load failed'; });

    b.addCase(createSessionRemote.fulfilled, (s, a) => {
      const meta: SessionMeta = {
        id: a.payload.id, title: a.payload.title,
        createdAt: a.payload.createdAt, updatedAt: a.payload.updatedAt,
        favorite: !!a.payload.favorite, messageCount: 0, preview: '',
      };
      s.sessions.unshift(meta);
      s.activeSessionId = meta.id;
    });

    b.addCase(renameSessionRemote.fulfilled, (s, a) => {
      const x = s.sessions.find(z => z.id === a.payload.id);
      if (x) x.title = a.payload.title;
    });
    b.addCase(toggleFavoriteRemote.fulfilled, (s, a) => {
      const x = s.sessions.find(z => z.id === a.payload.id);
      if (x) x.favorite = !!a.payload.favorite;
    });
    b.addCase(deleteSessionRemote.fulfilled, (s, a) => {
      s.sessions = s.sessions.filter(z => z.id !== a.payload);
      if (s.activeSessionId === a.payload) {
        s.activeSessionId = s.sessions[0]?.id || null;
      }
    });
    b.addCase(searchSessionsRemote.fulfilled, (s, a) => {
      s.searchResults = a.payload;
    });
  },
});

export const { setActiveSession, setSearchQuery, touchSession } = sessionSlice.actions;
export default sessionSlice.reducer;