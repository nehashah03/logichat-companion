/**
 * ChatPanel — orchestrates the active session's chat view.
 *
 * Responsibilities:
 *  - Connect to the WebSocket once on mount.
 *  - On session change: fetch full message history from the backend.
 *  - On send: push a user message into Redux, register a per-session WS
 *    handler, and dispatch every backend event to the per-session
 *    pipeline + message reducers.
 *  - On Stop: send a `cancel` frame for the active turn (per-session).
 *
 * Multiple sessions can stream simultaneously — each session has its own
 * `liveBySession[sid]` slot in chatSlice, and the WS service routes
 * incoming events by `sessionId` so the panels never collide.
 */
import React, { useCallback, useEffect, useRef, useMemo } from 'react';
import { Box, Typography, Alert, Snackbar, IconButton, Tooltip, Chip } from '@mui/material';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';

import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  setMessages, addMessage, appendToken, setMessageStatus,
  setMessageSources, setMessagePipeline,
  initLive, setPhaseStatus, addPhaseEvent, appendPhaseEventDetail,
  updatePhaseEvent, clearLive, setLiveStreaming, setError,
} from '../features/chat/chatSlice';
import type { FileAttachment, PasteSnippet, PipelinePhase, ChatMessage } from '../features/chat/chatSlice';
import { touchSession, fetchSessions } from '../features/session/sessionSlice';
import { wsService, WsEvent, PhaseKey } from '../services/websocket';
import { api } from '../services/api';
import { generateId } from '../utils/helpers';
import { useThemeMode } from '../contexts/ThemeModeContext';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import PipelinePanel from './PipelinePanel';

// Pipeline scaffolding — labels only. The *content* of each phase
// (events, tool names, raw output) comes from the backend.
const PHASE_DEFS: { key: PhaseKey; label: string; description: string }[] = [
  { key: 'routing',      label: 'Routing',       description: 'Classifying intent & selecting tools' },
  { key: 'planning',     label: 'Planning',      description: 'Building the execution plan' },
  { key: 'executing',    label: 'Executing',     description: 'Running tools' },
  { key: 'synthesizing', label: 'Synthesizing',  description: 'Composing the final response' },
];

const ChatPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const { palette, mode, toggle } = useThemeMode();
  const { activeSessionId, sessions } = useAppSelector(s => s.session);
  const { messagesBySession, liveBySession, error } = useAppSelector(s => s.chat);

  const messages: ChatMessage[] = activeSessionId ? (messagesBySession[activeSessionId] || []) : [];
  const live = activeSessionId ? liveBySession[activeSessionId] : undefined;
  const isStreaming = !!live?.isStreaming;
  const liveAssistantId = live?.assistantMessageId;
  const livePipeline = live?.pipeline || [];

  const scrollRef = useRef<HTMLDivElement>(null);

  // Connect WS once
  useEffect(() => {
    wsService.connect();
    return () => wsService.disconnect();
  }, []);

  // Fetch messages on session change
  useEffect(() => {
    if (!activeSessionId) return;
    if (messagesBySession[activeSessionId]) return; // cached
    let cancelled = false;
    (async () => {
      try {
        const full = await api.getSession(activeSessionId);
        if (!cancelled) dispatch(setMessages({ sessionId: activeSessionId, messages: full.messages || [] }));
      } catch (e: any) {
        if (!cancelled) dispatch(setError(`Failed to load chat: ${e.message}`));
      }
    })();
    return () => { cancelled = true; };
  }, [activeSessionId, dispatch, messagesBySession]);

  // Auto-scroll on message / live changes
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages.length, livePipeline.length, isStreaming, live?.pipeline?.[live.pipeline.length - 1]?.events?.length]);

  // ---------- Per-session handler (created on send) ----------
  const buildHandler = useCallback((sessionId: string, turnId: string, assistantId: string) => {
    const livePipelineRef: { current: PipelinePhase[] } = { current: [] };

    const handler = (ev: WsEvent) => {
      // Defensive: ignore frames from a different turn (e.g. late arrivals
      // after we cancelled and started a new one in the same session).
      if (ev.turnId && ev.turnId !== turnId) return;

      switch (ev.type) {
        case 'phase_start':
          if (ev.phase) dispatch(setPhaseStatus({ sessionId, phaseKey: ev.phase, status: 'active' }));
          break;
        case 'phase_event':
          if (ev.phase && ev.eventId) {
            dispatch(addPhaseEvent({
              sessionId, phaseKey: ev.phase,
              event: {
                id: ev.eventId, label: ev.label || 'Step', toolName: ev.toolName,
                status: 'running', startedAt: Date.now(), detail: '',
              },
            }));
          }
          break;
        case 'event_chunk':
          if (ev.phase && ev.eventId && ev.chunk) {
            dispatch(appendPhaseEventDetail({
              sessionId, phaseKey: ev.phase, eventId: ev.eventId, chunk: ev.chunk,
            }));
          }
          break;
        case 'event_done':
          if (ev.phase && ev.eventId) {
            dispatch(updatePhaseEvent({
              sessionId, phaseKey: ev.phase, eventId: ev.eventId,
              patch: { status: 'done', endedAt: Date.now(), durationMs: ev.durationMs, rawOutput: ev.rawOutput },
            }));
          }
          break;
        case 'phase_done':
          if (ev.phase) dispatch(setPhaseStatus({ sessionId, phaseKey: ev.phase, status: 'complete' }));
          break;
        case 'token':
          if (ev.text) dispatch(appendToken({ sessionId, messageId: assistantId, token: ev.text }));
          break;
        case 'sources':
          dispatch(setMessageSources({
            sessionId, messageId: assistantId,
            sources: ev.sources || [], citations: ev.citations || [],
          }));
          break;
        case 'cancelled':
          dispatch(setMessageStatus({ sessionId, messageId: assistantId, status: 'cancelled' }));
          break;
        case 'done':
        case 'error': {
          // Snapshot the *current* live pipeline into the message so the
          // user can review it later under "Events".
          const snapshot = (livePipelineRef.current.length
            ? livePipelineRef.current
            : []) as PipelinePhase[];
          dispatch(setMessagePipeline({ sessionId, messageId: assistantId, pipeline: snapshot }));
          dispatch(setMessageStatus({
            sessionId, messageId: assistantId,
            status: ev.type === 'error' ? 'error' : 'complete',
          }));
          dispatch(setLiveStreaming({ sessionId, isStreaming: false }));
          // Brief delay so the "complete" state is visible before collapsing
          setTimeout(() => dispatch(clearLive({ sessionId })), 350);
          off();
          if (ev.type === 'error') dispatch(setError(ev.message || 'Stream error'));
          // Refresh sidebar metadata (title may have auto-updated server-side)
          dispatch(fetchSessions());
          break;
        }
      }
    };

    const off = wsService.on(sessionId, handler);

    // Track latest pipeline so we can snapshot it at done/error
    return { handler, livePipelineRef, off };
  }, [dispatch]);

  // ---------- Send ----------
  const handleSend = useCallback(async (content: string, attachments: FileAttachment[], snippets: PasteSnippet[]) => {
    if (!activeSessionId) return;
    const sessionId = activeSessionId;
    const turnId = generateId();
    const userMsg: ChatMessage = {
      id: generateId(), role: 'user', content,
      timestamp: Date.now(), status: 'complete',
      attachments, pasteSnippets: snippets,
    };
    dispatch(addMessage({ sessionId, message: userMsg }));

    const assistantId = generateId();
    dispatch(addMessage({
      sessionId,
      message: { id: assistantId, role: 'assistant', content: '', timestamp: Date.now(), status: 'streaming' },
    }));

    const initialPhases: PipelinePhase[] = PHASE_DEFS.map(p => ({ ...p, status: 'pending', events: [] }));
    dispatch(initLive({ sessionId, turnId, assistantMessageId: assistantId, phases: initialPhases }));

    // Optimistic sidebar bump
    dispatch(touchSession({ id: sessionId, preview: content.slice(0, 120) }));

    buildHandler(sessionId, turnId, assistantId);

    wsService.send({
      sessionId, turnId, content,
      attachments, snippets,
    });
  }, [activeSessionId, dispatch, buildHandler]);

  // Track latest pipeline in a ref for snapshotting (must mirror Redux)
  // We attach this via a separate effect that watches `live`.
  const liveRef = useRef(live);
  useEffect(() => { liveRef.current = live; }, [live]);

  const handleStop = useCallback(() => {
    if (!activeSessionId || !live) return;
    wsService.cancel(live.turnId);
  }, [activeSessionId, live]);

  const activeSession = useMemo(
    () => sessions.find(s => s.id === activeSessionId),
    [sessions, activeSessionId],
  );

  // Empty state when no session selected
  if (!activeSessionId) {
    return (
      <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: palette.bgChat }}>
        <Typography sx={{ color: palette.textMuted, fontSize: 14 }}>
          Click “New chat” to get started.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', minWidth: 0, bgcolor: palette.bgChat }}>
      {/* Header */}
      <Box sx={{
        px: 3, py: 1.25, borderBottom: '1px solid', borderColor: palette.border,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 48,
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 0 }}>
          <Typography noWrap sx={{ fontWeight: 600, fontSize: 14, color: palette.textPrimary }}>
            {activeSession?.title || 'Conversation'}
          </Typography>
          {isStreaming && (
            <Chip
              size="small" label="Streaming"
              sx={{
                height: 20, fontSize: 10.5, fontWeight: 600,
                bgcolor: palette.primarySoft, color: palette.primary,
              }}
            />
          )}
        </Box>
        <Tooltip title={`Switch to ${mode === 'light' ? 'Midnight' : 'Light'}`}>
          <IconButton size="small" onClick={toggle} sx={{ color: palette.textSecondary }}>
            {mode === 'light' ? <DarkModeOutlinedIcon sx={{ fontSize: 18 }} /> : <LightModeOutlinedIcon sx={{ fontSize: 18 }} />}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Messages */}
      <Box ref={scrollRef} sx={{
        flex: 1, overflow: 'auto', py: 2, px: { xs: 1.5, md: 4 },
        '&::-webkit-scrollbar': { width: 8 },
        '&::-webkit-scrollbar-thumb': { background: palette.scrollbarThumb, borderRadius: 4 },
      }}>
        {messages.length === 0 && !isStreaming && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 2 }}>
            <Typography sx={{ fontSize: 22, fontWeight: 700, color: palette.textPrimary }}>
              What can I help you with?
            </Typography>
            <Typography variant="body2" sx={{ color: palette.textMuted, maxWidth: 480, textAlign: 'center', fontSize: 13 }}>
              Paste logs, describe a ticket, or attach system outputs. I'll route it through the right tools and explain what I find — step by step.
            </Typography>
          </Box>
        )}

        {messages.map((msg, i) => {
          const isLastAssistant = i === messages.length - 1 && msg.role === 'assistant';
          const isLiveBubble = isLastAssistant && isStreaming && msg.id === liveAssistantId;
          // While streaming AND no tokens yet → show ONLY the live pipeline.
          if (isLiveBubble && msg.content.length === 0) {
            return (
              <Box key={msg.id} sx={{ display: 'flex', mb: 2, pl: { xs: 0, md: 5.5 } }}>
                <Box sx={{ width: { xs: '100%', md: '70%' }, maxWidth: '70%' }}>
                  <PipelinePanel phases={livePipeline} live compact />
                </Box>
              </Box>
            );
          }
          return <MessageBubble key={msg.id} message={msg} />;
        })}
      </Box>

      <Snackbar open={!!error} autoHideDuration={5000} onClose={() => dispatch(setError(null))}>
        <Alert severity="error" onClose={() => dispatch(setError(null))}>{error}</Alert>
      </Snackbar>

      <ChatInput
        onSend={handleSend}
        onStop={handleStop}
        isStreaming={isStreaming}
      />
    </Box>
  );
};

export default ChatPanel;