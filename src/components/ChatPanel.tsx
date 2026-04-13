import React, { useRef, useEffect, useCallback } from 'react';
import { Box, Typography, Alert, Button, Snackbar } from '@mui/material';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  addMessage, appendToMessage, setMessageStatus, addToolOutput,
  setStreaming, setPipelineStage, setCurrentTool, setElapsedTime, setError, clearMessages,
  setProcessingSteps, updateProcessingStep, setMessageSources, setMessageCitations,
  setMessageProcessingSteps,
} from '../features/chat/chatSlice';
import { createSession, updateSessionMessages } from '../features/session/sessionSlice';
import { wsService } from '../services/websocket';
import { generateId } from '../utils/helpers';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import TypingIndicator from './TypingIndicator';
import ProcessingSteps from './ProcessingSteps';
import type { FileAttachment } from '../features/chat/chatSlice';

const ChatPanel: React.FC = () => {
  const dispatch = useAppDispatch();
  const { messages, isStreaming, error, processingSteps } = useAppSelector(s => s.chat);
  const { activeSessionId, sessions } = useAppSelector(s => s.session);
  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, processingSteps]);

  useEffect(() => {
    wsService.connect();
    return () => wsService.disconnect();
  }, []);

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
    dispatch(setProcessingSteps([]));
    startTimer();

    wsService.on('step', (data) => {
      dispatch(setProcessingSteps(data.allSteps));
    });

    wsService.on('progress', (data) => {
      dispatch(setPipelineStage(data.stage));
      dispatch(setCurrentTool(data.detail || null));
    });

    wsService.on('message', (data) => {
      if (data.type === 'token') {
        dispatch(appendToMessage({ id: assistantId, token: data.token }));
      } else if (data.type === 'tool_output') {
        dispatch(addToolOutput({ messageId: assistantId, output: data.output }));
      } else if (data.type === 'sources') {
        dispatch(setMessageSources({ messageId: assistantId, sources: data.sources }));
        dispatch(setMessageCitations({ messageId: assistantId, citations: data.citations }));
      }
    });

    wsService.on('complete', (data) => {
      // Save processing steps to the message
      const currentSteps = [...(processingSteps || [])];
      dispatch(setMessageProcessingSteps({ messageId: assistantId, steps: currentSteps }));
      dispatch(setMessageStatus({ id: assistantId, status: 'complete' }));
      dispatch(setStreaming(false));
      dispatch(setPipelineStage('complete'));
      dispatch(setCurrentTool(null));
      stopTimer();
      setTimeout(() => {
        dispatch(setPipelineStage('idle'));
        dispatch(setProcessingSteps([]));
      }, 1000);
    });

    wsService.on('error', (data) => {
      dispatch(setMessageStatus({ id: assistantId, status: 'error' }));
      dispatch(setStreaming(false));
      dispatch(setError(data.error || 'Something went wrong'));
      dispatch(setPipelineStage('idle'));
      dispatch(setProcessingSteps([]));
      stopTimer();
    });

    wsService.send(content, assistantId);
  }, [activeSessionId, dispatch, startTimer, stopTimer, processingSteps]);

  const handleExport = useCallback(() => {
    const text = messages.map(m =>
      `[${m.role === 'user' ? 'You' : 'Assistant'}] ${new Date(m.timestamp).toLocaleString()}\n${m.content}\n`
    ).join('\n---\n\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'conversation.txt'; a.click();
    URL.revokeObjectURL(url);
  }, [messages]);

  return (
    <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', minWidth: 0, bgcolor: '#FFFFFF' }}>
      {/* Header */}
      <Box sx={{
        px: 3, py: 1, borderBottom: '1px solid', borderColor: '#E5E7EB',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        bgcolor: '#FFFFFF', minHeight: 42,
      }}>
        <Typography sx={{ fontWeight: 500, fontSize: 13, color: '#666' }}>
          {sessions.find(s => s.id === activeSessionId)?.title || 'New Conversation'}
        </Typography>
        {messages.length > 0 && (
          <Button size="small" onClick={handleExport} sx={{ fontSize: 11, color: '#999', minWidth: 0, '&:hover': { color: '#333' } }}>
            Export
          </Button>
        )}
      </Box>

      {/* Messages */}
      <Box ref={scrollRef} sx={{ flex: 1, overflow: 'auto', py: 1 }}>
        {messages.length === 0 && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 2 }}>
            <Typography sx={{ fontSize: 16, fontWeight: 600, color: '#333' }}>What can I help you with?</Typography>
            <Typography variant="body2" sx={{ color: '#999', maxWidth: 420, textAlign: 'center', fontSize: 13 }}>
              Paste logs, describe a ticket, or upload system outputs. I'll analyze and debug.
            </Typography>
          </Box>
        )}

        {messages.map(msg => (
          <MessageBubble key={msg.id} message={msg}
            onRetry={msg.status === 'error' ? () => handleSend(messages[messages.length - 2]?.content || '', []) : undefined}
          />
        ))}

        {/* Live processing steps while streaming */}
        {isStreaming && processingSteps.length > 0 && (
          <Box sx={{ px: 3, py: 1 }}>
            <ProcessingSteps steps={processingSteps} isLive={true} />
          </Box>
        )}

        {isStreaming && messages[messages.length - 1]?.content === '' && processingSteps.length === 0 && <TypingIndicator />}
      </Box>

      <Snackbar open={!!error} autoHideDuration={5000} onClose={() => dispatch(setError(null))}>
        <Alert severity="error" onClose={() => dispatch(setError(null))}>
          {error}
        </Alert>
      </Snackbar>

      <ChatInput onSend={handleSend} disabled={isStreaming} />
    </Box>
  );
};

export default ChatPanel;
