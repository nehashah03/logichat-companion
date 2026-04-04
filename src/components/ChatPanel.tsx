import React, { useRef, useEffect, useCallback } from 'react';
import { Box, Typography, Alert, Button, Snackbar } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  addMessage, appendToMessage, setMessageStatus, addToolOutput,
  setStreaming, setPipelineStage, setCurrentTool, setElapsedTime, setError, clearMessages,
} from '../features/chat/chatSlice';
import { createSession, updateSessionMessages } from '../features/session/sessionSlice';
import { wsService } from '../services/websocket';
import { generateId } from '../utils/helpers';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import TypingIndicator from './TypingIndicator';
import type { FileAttachment } from '../features/chat/chatSlice';

const ChatPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const { messages, isStreaming, error } = useAppSelector(s => s.chat);
  const { activeSessionId, sessions } = useAppSelector(s => s.session);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    wsService.connect();
    return () => wsService.disconnect();
  }, []);

  // Save messages to session
  useEffect(() => {
    if (activeSessionId && messages.length > 0) {
      dispatch(updateSessionMessages({ id: activeSessionId, messages: [...messages] }));
    }
  }, [messages, activeSessionId, dispatch]);

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    timerRef.current = setInterval(() => {
      dispatch(setElapsedTime(Date.now() - startTimeRef.current));
    }, 100);
  }, [dispatch]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const handleSend = useCallback(async (content: string, attachments: FileAttachment[]) => {
    // Create session if needed
    let sessionId = activeSessionId;
    if (!sessionId) {
      sessionId = generateId();
      dispatch(createSession({
        id: sessionId, title: content.slice(0, 50), createdAt: Date.now(), updatedAt: Date.now(), messages: [],
      }));
    }

    const userMsg = {
      id: generateId(), role: 'user' as const, content, timestamp: Date.now(),
      status: 'complete' as const, attachments,
    };
    dispatch(addMessage(userMsg));

    const assistantId = generateId();
    dispatch(addMessage({
      id: assistantId, role: 'assistant', content: '', timestamp: Date.now(), status: 'streaming',
    }));
    dispatch(setStreaming(true));
    startTimer();

    wsService.on('progress', (data) => {
      dispatch(setPipelineStage(data.stage));
      dispatch(setCurrentTool(data.tool || null));
    });

    wsService.on('message', (data) => {
      if (data.type === 'token') {
        dispatch(appendToMessage({ id: assistantId, token: data.token }));
      } else if (data.type === 'tool_output') {
        dispatch(addToolOutput({ messageId: assistantId, output: data.output }));
      }
    });

    wsService.on('complete', () => {
      dispatch(setMessageStatus({ id: assistantId, status: 'complete' }));
      dispatch(setStreaming(false));
      dispatch(setPipelineStage('complete'));
      dispatch(setCurrentTool(null));
      stopTimer();
      setTimeout(() => dispatch(setPipelineStage('idle')), 2000);
    });

    wsService.on('error', (data) => {
      dispatch(setMessageStatus({ id: assistantId, status: 'error' }));
      dispatch(setStreaming(false));
      dispatch(setError(data.error || 'Something went wrong'));
      dispatch(setPipelineStage('idle'));
      stopTimer();
    });

    wsService.send(content, assistantId);
  }, [activeSessionId, dispatch, startTimer, stopTimer]);

  const handleExport = useCallback(() => {
    const text = messages.map(m =>
      `[${m.role === 'user' ? 'You' : 'DevAssist'}] ${new Date(m.timestamp).toLocaleString()}\n${m.content}\n`
    ).join('\n---\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'conversation.txt'; a.click();
    URL.revokeObjectURL(url);
  }, [messages]);

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', minWidth: 0 }}>
      {/* Header */}
      <Box sx={{
        px: 3, py: 1.5, borderBottom: '1px solid', borderColor: 'divider',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        bgcolor: 'background.paper',
      }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, fontSize: 14 }}>
          {sessions.find(s => s.id === activeSessionId)?.title || 'New Conversation'}
        </Typography>
        {messages.length > 0 && (
          <Button size="small" onClick={handleExport} sx={{ fontSize: 12, color: 'text.secondary' }}>
            Export
          </Button>
        )}
      </Box>

      {/* Messages */}
      <Box ref={scrollRef} sx={{ flex: 1, overflow: 'auto', py: 2 }}>
        {messages.length === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 2 }}>
            <Box sx={{
              width: 64, height: 64, borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'linear-gradient(135deg, rgba(108,142,239,0.2) 0%, rgba(45,212,168,0.2) 100%)',
            }}>
              <Typography sx={{ fontSize: 28 }}>🔍</Typography>
            </Box>
            <Typography variant="h6" sx={{ fontSize: 18 }}>What would you like to analyze?</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 400, textAlign: 'center' }}>
              Paste logs, describe a ticket, or upload system outputs. I'll help you analyze and debug.
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
              {['Analyze error logs', 'Debug a stack trace', 'Review system metrics', 'Parse ticket data'].map(s => (
                <Button key={s} size="small" variant="outlined"
                  onClick={() => handleSend(s, [])}
                  sx={{ borderColor: 'divider', color: 'text.secondary', fontSize: 12, borderRadius: 2, '&:hover': { borderColor: 'primary.main' } }}>
                  {s}
                </Button>
              ))}
            </Box>
          </Box>
        )}

        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg}
            onRetry={msg.status === 'error' ? () => handleSend(messages[messages.length - 2]?.content || '', []) : undefined}
          />
        ))}

        {isStreaming && messages[messages.length - 1]?.content === '' && <TypingIndicator />}
      </Box>

      {/* Error banner */}
      <Snackbar open={!!error} autoHideDuration={5000} onClose={() => dispatch(setError(null))}>
        <Alert severity="error" onClose={() => dispatch(setError(null))} sx={{ bgcolor: 'rgba(248,113,113,0.1)', color: 'error.main' }}>
          {error}
        </Alert>
      </Snackbar>

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={isStreaming} />
    </Box>
  );
};

export default ChatPanel;
