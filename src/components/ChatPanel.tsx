import React, { useRef, useEffect, useCallback } from 'react';
import { Box, Typography, Alert, Snackbar, IconButton, Tooltip, Button } from '@mui/material';
import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
import StopCircleOutlinedIcon from '@mui/icons-material/StopCircleOutlined';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  addMessage, appendToMessage, setMessageStatus, setStreaming, setPipelineStage,
  setElapsedTime, setError, setMessageSources, setMessagePipeline,
  initLivePipeline, setPhaseStatus, addPhaseEvent, updatePhaseEvent,
  appendPhaseEventDetail, clearLivePipeline,
} from '../features/chat/chatSlice';
import { createSession, updateSessionMessages } from '../features/session/sessionSlice';
import { wsService, WsEvent, PhaseKey } from '../services/websocket';
import { generateId } from '../utils/helpers';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import PipelinePanel from './PipelinePanel';
import { useThemeMode } from '../contexts/ThemeModeContext';
import type { FileAttachment, PipelinePhase } from '../features/chat/chatSlice';

const PHASE_DEFS: { key: PhaseKey; label: string; description: string }[] = [
  { key: 'routing',      label: 'Routing',       description: 'Classifying intent & selecting tools' },
  { key: 'planning',     label: 'Planning',      description: 'Building the execution plan' },
  { key: 'executing',    label: 'Executing',     description: 'Running tools (Splunk, Jira, vector search…)' },
  { key: 'synthesizing', label: 'Synthesizing',  description: 'Composing the final response' },
];

const ChatPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const { palette, mode, toggle } = useThemeMode();
  const { messages, isStreaming, error, livePipeline, liveAssistantId } = useAppSelector(s => s.chat);
  const { activeSessionId, sessions } = useAppSelector(s => s.session);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);

  // Auto-scroll on every render that mutates the conversation or live pipeline
  useEffect(() => {
    if (!scrollRef.current) return;
    const el = scrollRef.current;
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
  }, [messages, livePipeline, isStreaming]);

  useEffect(() => { wsService.connect(); return () => wsService.disconnect(); }, []);

  // Persist messages to active session
  useEffect(() => {
    if (activeSessionId && messages.length > 0) {
      dispatch(updateSessionMessages({ id: activeSessionId, messages: [...messages] }));
    }
  }, [messages, activeSessionId, dispatch]);

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      dispatch(setElapsedTime(Date.now() - startTimeRef.current));
    }, 200);
  }, [dispatch]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const handleStop = useCallback(() => {
    wsService.abort();
    if (liveAssistantId) {
      dispatch(setMessageStatus({ id: liveAssistantId, status: 'complete' }));
    }
    dispatch(setStreaming(false));
    dispatch(setPipelineStage('idle'));
    dispatch(clearLivePipeline());
    stopTimer();
  }, [dispatch, liveAssistantId, stopTimer]);

  const handleSend = useCallback(async (content: string, attachments: FileAttachment[]) => {
    let sessionId = activeSessionId;
    if (!sessionId) {
      sessionId = generateId();
      dispatch(createSession({
        id: sessionId, title: content.slice(0, 50) || 'New Conversation',
        createdAt: Date.now(), updatedAt: Date.now(), messages: [],
      }));
    }

    dispatch(addMessage({
      id: generateId(), role: 'user', content, timestamp: Date.now(),
      status: 'complete', attachments,
    }));

    const assistantId = generateId();
    dispatch(addMessage({
      id: assistantId, role: 'assistant', content: '', timestamp: Date.now(), status: 'streaming',
    }));

    const initialPhases: PipelinePhase[] = PHASE_DEFS.map(p => ({
      ...p, status: 'pending', events: [],
    }));
    dispatch(initLivePipeline({ assistantId, phases: initialPhases }));
    dispatch(setStreaming(true));
    dispatch(setPipelineStage('routing'));
    startTimer();

    const off = wsService.on((ev: WsEvent) => {
      switch (ev.type) {
        case 'phase_start':
          if (ev.phase) {
            dispatch(setPhaseStatus({ phaseKey: ev.phase, status: 'active' }));
            dispatch(setPipelineStage(ev.phase));
          }
          break;
        case 'phase_event':
          if (ev.phase && ev.eventId) {
            dispatch(addPhaseEvent({
              phaseKey: ev.phase,
              event: {
                id: ev.eventId, label: ev.label || 'Step', toolName: ev.toolName,
                status: 'running', startedAt: Date.now(), detail: '',
              },
            }));
          }
          break;
        case 'event_chunk':
          if (ev.phase && ev.eventId && ev.chunk) {
            dispatch(appendPhaseEventDetail({ phaseKey: ev.phase, eventId: ev.eventId, chunk: ev.chunk }));
          }
          break;
        case 'event_done':
          if (ev.phase && ev.eventId) {
            dispatch(updatePhaseEvent({
              phaseKey: ev.phase, eventId: ev.eventId,
              patch: { status: 'done', endedAt: Date.now(), durationMs: ev.durationMs, rawOutput: ev.rawOutput },
            }));
          }
          break;
        case 'phase_done':
          if (ev.phase) dispatch(setPhaseStatus({ phaseKey: ev.phase, status: 'complete' }));
          break;
        case 'token':
          if (ev.text) {
            dispatch(setPipelineStage('streaming'));
            dispatch(appendToMessage({ id: assistantId, token: ev.text }));
          }
          break;
        case 'sources':
          dispatch(setMessageSources({
            messageId: assistantId,
            sources: ev.sources || [],
            citations: ev.citations || [],
          }));
          break;
        case 'done': {
          // snapshot the live pipeline into the message for permanent display
          const snapshot = livePipelineRef.current;
          dispatch(setMessagePipeline({ messageId: assistantId, pipeline: snapshot }));
          dispatch(setMessageStatus({ id: assistantId, status: 'complete' }));
          dispatch(setStreaming(false));
          dispatch(setPipelineStage('complete'));
          stopTimer();
          setTimeout(() => { dispatch(clearLivePipeline()); dispatch(setPipelineStage('idle')); }, 600);
          off();
          break;
        }
        case 'error':
          dispatch(setMessageStatus({ id: assistantId, status: 'error' }));
          dispatch(setError(ev.message || 'Stream error'));
          dispatch(setStreaming(false));
          dispatch(setPipelineStage('idle'));
          dispatch(clearLivePipeline());
          stopTimer();
          off();
          break;
      }
    });

    wsService.send({ content, attachments });
  }, [activeSessionId, dispatch, startTimer, stopTimer]);

  // Mutable ref to current livePipeline (for snapshotting on 'done')
  const livePipelineRef = useRef(livePipeline);
  useEffect(() => { livePipelineRef.current = livePipeline; }, [livePipeline]);

  const lastMsg = messages[messages.length - 1];
  const showLivePipeline = isStreaming && livePipeline.length > 0 && lastMsg?.role === 'assistant';
  const activeTitle = sessions.find(s => s.id === activeSessionId)?.title || 'New Conversation';

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', minWidth: 0, bgcolor: palette.bgChat }}>
      {/* Header */}
      <Box sx={{
        px: 3, py: 1.25, borderBottom: '1px solid', borderColor: palette.border,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 48,
      }}>
        <Typography noWrap sx={{ fontWeight: 600, fontSize: 14, color: palette.textPrimary }}>
          {activeTitle}
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
          {isStreaming && (
            <Button
              size="small" startIcon={<StopCircleOutlinedIcon />} onClick={handleStop}
              sx={{ color: palette.error, fontSize: 12, textTransform: 'none' }}
            >
              Stop
            </Button>
          )}
          <Tooltip title={`Switch to ${mode === 'light' ? 'Midnight' : 'Light'}`}>
            <IconButton size="small" onClick={toggle} sx={{ color: palette.textSecondary }}>
              {mode === 'light' ? <DarkModeOutlinedIcon sx={{ fontSize: 18 }} /> : <LightModeOutlinedIcon sx={{ fontSize: 18 }} />}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Messages */}
      <Box ref={scrollRef} sx={{
        flex: 1, overflow: 'auto', py: 2, px: { xs: 1.5, md: 4 },
        '&::-webkit-scrollbar': { width: 8 },
        '&::-webkit-scrollbar-thumb': { background: palette.scrollbarThumb, borderRadius: 4 },
      }}>
        {messages.length === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 2 }}>
            <Typography sx={{ fontSize: 22, fontWeight: 700, color: palette.textPrimary }}>
              What can I help you with?
            </Typography>
            <Typography variant="body2" sx={{ color: palette.textMuted, maxWidth: 480, textAlign: 'center', fontSize: 13 }}>
              Paste logs, describe a ticket, or attach system outputs. I'll route it through the right tools and explain what I find — step by step.
            </Typography>
          </Box>
        )}

        {messages.map(msg => (
          <MessageBubble
            key={msg.id} message={msg}
            onRetry={msg.status === 'error' ? () => handleSend(messages[messages.length - 2]?.content || '', []) : undefined}
          />
        ))}

        {/* Live pipeline (rendered alongside the streaming assistant bubble) */}
        {showLivePipeline && (
          <Box sx={{ display: 'flex', mb: 2, pl: { xs: 0, md: 5.5 } }}>
            <Box sx={{ width: { xs: '100%', md: '70%' }, maxWidth: '70%' }}>
              <PipelinePanel phases={livePipeline} live compact />
            </Box>
          </Box>
        )}
      </Box>

      <Snackbar open={!!error} autoHideDuration={5000} onClose={() => dispatch(setError(null))}>
        <Alert severity="error" onClose={() => dispatch(setError(null))}>{error}</Alert>
      </Snackbar>

      <ChatInput onSend={handleSend} disabled={isStreaming} />
    </Box>
  );
};

export default ChatPanel;
