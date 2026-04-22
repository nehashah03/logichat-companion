// // // import React, { useRef, useEffect, useCallback } from 'react';
// // // import { Box, Typography, Alert, Snackbar, IconButton, Tooltip, Button } from '@mui/material';
// // // import DarkModeOutlinedIcon from '@mui/icons-material/DarkModeOutlined';
// // // import LightModeOutlinedIcon from '@mui/icons-material/LightModeOutlined';
// // // import StopCircleOutlinedIcon from '@mui/icons-material/StopCircleOutlined';
// // // import { useAppDispatch, useAppSelector } from '../store/hooks';
// // // import {
// // //   addMessage, appendToMessage, setMessageStatus, setStreaming, setPipelineStage,
// // //   setElapsedTime, setError, setMessageSources, setMessagePipeline,
// // //   initLivePipeline, setPhaseStatus, addPhaseEvent, updatePhaseEvent,
// // //   appendPhaseEventDetail, clearLivePipeline,
// // // } from '../features/chat/chatSlice';
// // // import { createSession, updateSessionMessages } from '../features/session/sessionSlice';
// // // import { wsService, WsEvent, PhaseKey } from '../services/websocket';
// // // import { generateId } from '../utils/helpers';
// // // import MessageBubble from './MessageBubble';
// // // import ChatInput from './ChatInput';
// // // import PipelinePanel from './PipelinePanel';
// // // import { useThemeMode } from '../contexts/ThemeModeContext';
// // // import type { FileAttachment, PipelinePhase } from '../features/chat/chatSlice';

// // // const PHASE_DEFS: { key: PhaseKey; label: string; description: string }[] = [
// // //   { key: 'routing',      label: 'Routing',       description: 'Classifying intent & selecting tools' },
// // //   { key: 'planning',     label: 'Planning',      description: 'Building the execution plan' },
// // //   { key: 'executing',    label: 'Executing',     description: 'Running tools (Splunk, Jira, vector search…)' },
// // //   { key: 'synthesizing', label: 'Synthesizing',  description: 'Composing the final response' },
// // // ];

// // // const ChatPanel: React.FC = () => {
// // //   const dispatch = useAppDispatch();
// // //   const { palette, mode, toggle } = useThemeMode();
// // //   const { messages, isStreaming, error, livePipeline, liveAssistantId } = useAppSelector(s => s.chat);
// // //   const { activeSessionId, sessions } = useAppSelector(s => s.session);
// // //   const scrollRef = useRef<HTMLDivElement>(null);
// // //   const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
// // //   const startTimeRef = useRef(0);

// // //   // Auto-scroll on every render that mutates the conversation or live pipeline
// // //   useEffect(() => {
// // //     if (!scrollRef.current) return;
// // //     const el = scrollRef.current;
// // //     el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
// // //   }, [messages, livePipeline, isStreaming]);

// // //   useEffect(() => { wsService.connect(); return () => wsService.disconnect(); }, []);

// // //   // Persist messages to active session
// // //   useEffect(() => {
// // //     if (activeSessionId && messages.length > 0) {
// // //       dispatch(updateSessionMessages({ id: activeSessionId, messages: [...messages] }));
// // //     }
// // //   }, [messages, activeSessionId, dispatch]);

// // //   const startTimer = useCallback(() => {
// // //     startTimeRef.current = Date.now();
// // //     timerRef.current = setInterval(() => {
// // //       dispatch(setElapsedTime(Date.now() - startTimeRef.current));
// // //     }, 200);
// // //   }, [dispatch]);

// // //   const stopTimer = useCallback(() => {
// // //     if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
// // //   }, []);

// // //   const handleStop = useCallback(() => {
// // //     wsService.abort();
// // //     if (liveAssistantId) {
// // //       dispatch(setMessageStatus({ id: liveAssistantId, status: 'complete' }));
// // //     }
// // //     dispatch(setStreaming(false));
// // //     dispatch(setPipelineStage('idle'));
// // //     dispatch(clearLivePipeline());
// // //     stopTimer();
// // //   }, [dispatch, liveAssistantId, stopTimer]);

// // //   const handleSend = useCallback(async (content: string, attachments: FileAttachment[]) => {
// // //     let sessionId = activeSessionId;
// // //     if (!sessionId) {
// // //       sessionId = generateId();
// // //       dispatch(createSession({
// // //         id: sessionId, title: content.slice(0, 50) || 'New Conversation',
// // //         createdAt: Date.now(), updatedAt: Date.now(), messages: [],
// // //       }));
// // //     }

// // //     dispatch(addMessage({
// // //       id: generateId(), role: 'user', content, timestamp: Date.now(),
// // //       status: 'complete', attachments,
// // //     }));

// // //     const assistantId = generateId();
// // //     dispatch(addMessage({
// // //       id: assistantId, role: 'assistant', content: '', timestamp: Date.now(), status: 'streaming',
// // //     }));

// // //     const initialPhases: PipelinePhase[] = PHASE_DEFS.map(p => ({
// // //       ...p, status: 'pending', events: [],
// // //     }));
// // //     dispatch(initLivePipeline({ assistantId, phases: initialPhases }));
// // //     dispatch(setStreaming(true));
// // //     dispatch(setPipelineStage('routing'));
// // //     startTimer();

// // //     const off = wsService.on((ev: WsEvent) => {
// // //       switch (ev.type) {
// // //         case 'phase_start':
// // //           if (ev.phase) {
// // //             dispatch(setPhaseStatus({ phaseKey: ev.phase, status: 'active' }));
// // //             dispatch(setPipelineStage(ev.phase));
// // //           }
// // //           break;
// // //         case 'phase_event':
// // //           if (ev.phase && ev.eventId) {
// // //             dispatch(addPhaseEvent({
// // //               phaseKey: ev.phase,
// // //               event: {
// // //                 id: ev.eventId, label: ev.label || 'Step', toolName: ev.toolName,
// // //                 status: 'running', startedAt: Date.now(), detail: '',
// // //               },
// // //             }));
// // //           }
// // //           break;
// // //         case 'event_chunk':
// // //           if (ev.phase && ev.eventId && ev.chunk) {
// // //             dispatch(appendPhaseEventDetail({ phaseKey: ev.phase, eventId: ev.eventId, chunk: ev.chunk }));
// // //           }
// // //           break;
// // //         case 'event_done':
// // //           if (ev.phase && ev.eventId) {
// // //             dispatch(updatePhaseEvent({
// // //               phaseKey: ev.phase, eventId: ev.eventId,
// // //               patch: { status: 'done', endedAt: Date.now(), durationMs: ev.durationMs, rawOutput: ev.rawOutput },
// // //             }));
// // //           }
// // //           break;
// // //         case 'phase_done':
// // //           if (ev.phase) dispatch(setPhaseStatus({ phaseKey: ev.phase, status: 'complete' }));
// // //           break;
// // //         case 'token':
// // //           if (ev.text) {
// // //             dispatch(setPipelineStage('streaming'));
// // //             dispatch(appendToMessage({ id: assistantId, token: ev.text }));
// // //           }
// // //           break;
// // //         case 'sources':
// // //           dispatch(setMessageSources({
// // //             messageId: assistantId,
// // //             sources: ev.sources || [],
// // //             citations: ev.citations || [],
// // //           }));
// // //           break;
// // //         case 'done': {
// // //           // snapshot the live pipeline into the message for permanent display
// // //           const snapshot = livePipelineRef.current;
// // //           dispatch(setMessagePipeline({ messageId: assistantId, pipeline: snapshot }));
// // //           dispatch(setMessageStatus({ id: assistantId, status: 'complete' }));
// // //           dispatch(setStreaming(false));
// // //           dispatch(setPipelineStage('complete'));
// // //           stopTimer();
// // //           setTimeout(() => { dispatch(clearLivePipeline()); dispatch(setPipelineStage('idle')); }, 600);
// // //           off();
// // //           break;
// // //         }
// // //         case 'error':
// // //           dispatch(setMessageStatus({ id: assistantId, status: 'error' }));
// // //           dispatch(setError(ev.message || 'Stream error'));
// // //           dispatch(setStreaming(false));
// // //           dispatch(setPipelineStage('idle'));
// // //           dispatch(clearLivePipeline());
// // //           stopTimer();
// // //           off();
// // //           break;
// // //       }
// // //     });

// // //     wsService.send({ content, attachments });
// // //   }, [activeSessionId, dispatch, startTimer, stopTimer]);

// // //   // Mutable ref to current livePipeline (for snapshotting on 'done')
// // //   const livePipelineRef = useRef(livePipeline);
// // //   useEffect(() => { livePipelineRef.current = livePipeline; }, [livePipeline]);

// // //   const activeTitle = sessions.find(s => s.id === activeSessionId)?.title || 'New Conversation';

// // //   return (
// // //     <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', minWidth: 0, bgcolor: palette.bgChat }}>
// // //       {/* Header */}
// // //       <Box sx={{
// // //         px: 3, py: 1.25, borderBottom: '1px solid', borderColor: palette.border,
// // //         display: 'flex', alignItems: 'center', justifyContent: 'space-between', minHeight: 48,
// // //       }}>
// // //         <Typography noWrap sx={{ fontWeight: 600, fontSize: 14, color: palette.textPrimary }}>
// // //           {activeTitle}
// // //         </Typography>
// // //         <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
// // //           {isStreaming && (
// // //             <Button
// // //               size="small" startIcon={<StopCircleOutlinedIcon />} onClick={handleStop}
// // //               sx={{ color: palette.error, fontSize: 12, textTransform: 'none' }}
// // //             >
// // //               Stop
// // //             </Button>
// // //           )}
// // //           <Tooltip title={`Switch to ${mode === 'light' ? 'dark' : 'Light'}`}>
// // //             <IconButton size="small" onClick={toggle} sx={{ color: palette.textSecondary }}>
// // //               {mode === 'light' ? <DarkModeOutlinedIcon sx={{ fontSize: 18 }} /> : <LightModeOutlinedIcon sx={{ fontSize: 18 }} />}
// // //             </IconButton>
// // //           </Tooltip>
// // //         </Box>
// // //       </Box>

// // //       {/* Messages */}
// // //       <Box ref={scrollRef} sx={{
// // //         flex: 1, overflow: 'auto', py: 2, px: { xs: 1.5, md: 4 },
// // //         '&::-webkit-scrollbar': { width: 8 },
// // //         '&::-webkit-scrollbar-thumb': { background: palette.scrollbarThumb, borderRadius: 4 },
// // //       }}>
// // //         {messages.length === 0 && (
// // //           <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 2 }}>
// // //             <Typography sx={{ fontSize: 22, fontWeight: 700, color: palette.textPrimary }}>
// // //               What can I help you with?
// // //             </Typography>
// // //             <Typography variant="body2" sx={{ color: palette.textMuted, maxWidth: 480, textAlign: 'center', fontSize: 13 }}>
// // //               Paste logs, describe a ticket, or attach system outputs. I'll route it through the right tools and explain what I find — step by step.
// // //             </Typography>
// // //           </Box>
// // //         )}

// // //         {messages.map((msg, i) => {
// // //           const isLastAssistant = i === messages.length - 1 && msg.role === 'assistant';
// // //           const isLiveBubble = isLastAssistant && isStreaming && msg.id === liveAssistantId;
// // //           // While streaming AND no tokens have arrived yet → show ONLY the live pipeline in place of the empty bubble.
// // //           if (isLiveBubble && msg.content.length === 0) {
// // //             return (
// // //               <Box key={msg.id} sx={{ display: 'flex', mb: 2, pl: { xs: 0, md: 5.5 } }}>
// // //                 <Box sx={{ width: { xs: '100%', md: '70%' }, maxWidth: '70%' }}>
// // //                   <PipelinePanel phases={livePipeline} live compact />
// // //                 </Box>
// // //               </Box>
// // //             );
// // //           }
// // //           return (
// // //             <MessageBubble
// // //               key={msg.id} message={msg}
// // //               onRetry={msg.status === 'error' ? () => handleSend(messages[messages.length - 2]?.content || '', []) : undefined}
// // //             />
// // //           );
// // //         })}
// // //       </Box>

// // //       <Snackbar open={!!error} autoHideDuration={5000} onClose={() => dispatch(setError(null))}>
// // //         <Alert severity="error" onClose={() => dispatch(setError(null))}>{error}</Alert>
// // //       </Snackbar>

// // //       <ChatInput onSend={handleSend} disabled={isStreaming} />
// // //     </Box>
// // //   );
// // // };

// // // export default ChatPanel;

// // import React, { useRef, useEffect, useCallback, useMemo, useState } from "react";
// // import {
// //   Box,
// //   Typography,
// //   Alert,
// //   Snackbar,
// //   IconButton,
// //   Tooltip,
// //   Button,
// //   Divider,
// //   TextField,
// // } from "@mui/material";

// // import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
// // import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
// // import StopCircleOutlinedIcon from "@mui/icons-material/StopCircleOutlined";
// // import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
// // import EditOutlinedIcon from "@mui/icons-material/EditOutlined";

// // import { useAppDispatch, useAppSelector } from "../store/hooks";

// // import {
// //   addMessage,
// //   appendToMessage,
// //   setMessageStatus,
// //   setStreaming,
// //   setPipelineStage,
// //   setElapsedTime,
// //   setError,
// //   setMessageSources,
// //   setMessagePipeline,
// //   initLivePipeline,
// //   setPhaseStatus,
// //   addPhaseEvent,
// //   updatePhaseEvent,
// //   appendPhaseEventDetail,
// //   clearLivePipeline,
// // } from "../features/chat/chatSlice";

// // import {
// //   createSession,
// //   updateSessionMessages,
// //   renameSession,
// // } from "../features/session/sessionSlice";

// // import { wsService, WsEvent, PhaseKey } from "../services/websocket";
// // import { generateId } from "../utils/helpers";

// // import MessageBubble from "./MessageBubble";
// // import ChatInput from "./ChatInput";
// // import PipelinePanel from "./PipelinePanel";

// // import { useThemeMode } from "../contexts/ThemeModeContext";
// // import { useSettingsUi } from "../contexts/SettingsUiContext";

// // import type { FileAttachment, PipelinePhase } from "../features/chat/chatSlice";

// // /* ============================================================
// //    PIPELINE PHASE DEFINITIONS
// //    ============================================================ */

// // const PHASE_DEFS: { key: PhaseKey; label: string; description: string }[] = [
// //   {
// //     key: "routing",
// //     label: "Routing",
// //     description: "Classifying intent & selecting tools",
// //   },
// //   {
// //     key: "planning",
// //     label: "Planning",
// //     description: "Building the execution plan",
// //   },
// //   {
// //     key: "executing",
// //     label: "Executing",
// //     description: "Running tools (Splunk, Jira, vector search…)",
// //   },
// //   {
// //     key: "synthesizing",
// //     label: "Synthesizing",
// //     description: "Composing the final response",
// //   },
// // ];

// // /* ============================================================
// //    COMPONENT
// //    ============================================================ */

// // const ChatPanel: React.FC = () => {
// //   // Redux dispatch
// //   const dispatch = useAppDispatch();

// //   // Theme tools
// //   const { palette, mode, toggle } = useThemeMode();

// //   // Settings drawer controls
// //   const { openSettings } = useSettingsUi();

// //   // Chat state from redux
// //   const {
// //     messages,
// //     isStreaming,
// //     error,
// //     livePipeline,
// //     liveAssistantId,
// //   } = useAppSelector((s) => s.chat);

// //   // Session state from redux
// //   const { activeSessionId, sessions } = useAppSelector((s) => s.session);

// //   // Scroll container
// //   const scrollRef = useRef<HTMLDivElement>(null);

// //   // Timer refs for elapsed time
// //   const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
// //   const startTimeRef = useRef(0);

// //   // Live pipeline snapshot ref
// //   const livePipelineRef = useRef(livePipeline);

// //   // Local state for title edit mode
// //   const [titleEditing, setTitleEditing] = useState(false);

// //   // Local state for title text while editing
// //   const [titleDraft, setTitleDraft] = useState("");

// //   /* ============================================================
// //      ACTIVE TITLE
// //      ============================================================ */

// //   // Read current active session title
// //   const activeTitle = useMemo(() => {
// //     return sessions.find((s) => s.id === activeSessionId)?.title || "New Conversation";
// //   }, [sessions, activeSessionId]);

// //   // Keep draft synced when not editing
// //   useEffect(() => {
// //     if (!titleEditing) {
// //       setTitleDraft(activeTitle);
// //     }
// //   }, [activeTitle, titleEditing]);

// //   /* ============================================================
// //      AUTO SCROLL
// //      ============================================================ */

// //   // Smooth auto scroll when messages/pipeline change
// //   useEffect(() => {
// //     if (!scrollRef.current) return;

// //     const el = scrollRef.current;
// //     el.scrollTo({
// //       top: el.scrollHeight,
// //       behavior: "smooth",
// //     });
// //   }, [messages, livePipeline, isStreaming]);

// //   /* ============================================================
// //      WEBSOCKET LIFECYCLE
// //      ============================================================ */

// //   // Keep your websocket logic
// //   useEffect(() => {
// //     wsService.connect();

// //     return () => {
// //       wsService.disconnect();
// //     };
// //   }, []);

// //   /* ============================================================
// //      KEEP SESSION MESSAGES IN SYNC
// //      ============================================================ */

// //   // Persist current chat messages to active session
// //   useEffect(() => {
// //     if (activeSessionId && messages.length > 0) {
// //       dispatch(
// //         updateSessionMessages({
// //           id: activeSessionId,
// //           messages: [...messages],
// //         }),
// //       );
// //     }
// //   }, [messages, activeSessionId, dispatch]);

// //   /* ============================================================
// //      TIMER HELPERS
// //      ============================================================ */

// //   // Start elapsed timer
// //   const startTimer = useCallback(() => {
// //     startTimeRef.current = Date.now();

// //     timerRef.current = setInterval(() => {
// //       dispatch(setElapsedTime(Date.now() - startTimeRef.current));
// //     }, 200);
// //   }, [dispatch]);

// //   // Stop elapsed timer
// //   const stopTimer = useCallback(() => {
// //     if (timerRef.current) {
// //       clearInterval(timerRef.current);
// //       timerRef.current = null;
// //     }
// //   }, []);

// //   /* ============================================================
// //      STOP STREAM
// //      ============================================================ */

// //   const handleStop = useCallback(() => {
// //     // Keep your websocket abort behavior
// //     wsService.abort();

// //     // If current live assistant exists, mark complete
// //     if (liveAssistantId) {
// //       dispatch(
// //         setMessageStatus({
// //           id: liveAssistantId,
// //           status: "complete",
// //         }),
// //       );
// //     }

// //     // Reset live state
// //     dispatch(setStreaming(false));
// //     dispatch(setPipelineStage("idle"));
// //     dispatch(clearLivePipeline());

// //     // Stop timer
// //     stopTimer();
// //   }, [dispatch, liveAssistantId, stopTimer]);

// //   /* ============================================================
// //      RENAME CHAT TITLE
// //      ============================================================ */

// //   const commitTitle = useCallback(() => {
// //     if (!activeSessionId) {
// //       setTitleEditing(false);
// //       return;
// //     }

// //     const finalTitle = titleDraft.trim() || "Untitled chat";

// //     dispatch(
// //       renameSession({
// //         id: activeSessionId,
// //         title: finalTitle,
// //       }),
// //     );

// //     setTitleEditing(false);
// //   }, [activeSessionId, titleDraft, dispatch]);

// //   /* ============================================================
// //      SEND MESSAGE
// //      ============================================================ */

// //   const handleSend = useCallback(
// //     async (content: string, attachments: FileAttachment[]) => {
// //       // Resolve current session
// //       let sessionId = activeSessionId;

// //       // If no session exists, create one first
// //       if (!sessionId) {
// //         sessionId = generateId();

// //         dispatch(
// //           createSession({
// //             id: sessionId,
// //             // Name starts from first user input
// //             title: content.slice(0, 50) || "New Conversation",
// //             createdAt: Date.now(),
// //             updatedAt: Date.now(),
// //             messages: [],
// //           }),
// //         );
// //       }

// //       // Add user message
// //       dispatch(
// //         addMessage({
// //           id: generateId(),
// //           role: "user",
// //           content,
// //           timestamp: Date.now(),
// //           status: "complete",
// //           attachments,
// //         }),
// //       );

// //       // Create assistant placeholder
// //       const assistantId = generateId();

// //       dispatch(
// //         addMessage({
// //           id: assistantId,
// //           role: "assistant",
// //           content: "",
// //           timestamp: Date.now(),
// //           status: "streaming",
// //         }),
// //       );

// //       // Build initial live pipeline
// //       const initialPhases: PipelinePhase[] = PHASE_DEFS.map((phase) => ({
// //         ...phase,
// //         status: "pending",
// //         events: [],
// //       }));

// //       dispatch(
// //         initLivePipeline({
// //           assistantId,
// //           phases: initialPhases,
// //         }),
// //       );

// //       // Set stream flags
// //       dispatch(setStreaming(true));
// //       dispatch(setPipelineStage("routing"));

// //       // Start elapsed timer
// //       startTimer();

// //       // Listen to websocket events
// //       const off = wsService.on((ev: WsEvent) => {
// //         switch (ev.type) {
// //           case "phase_start":
// //             if (ev.phase) {
// //               dispatch(
// //                 setPhaseStatus({
// //                   phaseKey: ev.phase,
// //                   status: "active",
// //                 }),
// //               );
// //               dispatch(setPipelineStage(ev.phase));
// //             }
// //             break;

// //           case "phase_event":
// //             if (ev.phase && ev.eventId) {
// //               dispatch(
// //                 addPhaseEvent({
// //                   phaseKey: ev.phase,
// //                   event: {
// //                     id: ev.eventId,
// //                     label: ev.label || "Step",
// //                     toolName: ev.toolName,
// //                     status: "running",
// //                     startedAt: Date.now(),
// //                     detail: "",
// //                   },
// //                 }),
// //               );
// //             }
// //             break;

// //           case "event_chunk":
// //             if (ev.phase && ev.eventId && ev.chunk) {
// //               dispatch(
// //                 appendPhaseEventDetail({
// //                   phaseKey: ev.phase,
// //                   eventId: ev.eventId,
// //                   chunk: ev.chunk,
// //                 }),
// //               );
// //             }
// //             break;

// //           case "event_done":
// //             if (ev.phase && ev.eventId) {
// //               dispatch(
// //                 updatePhaseEvent({
// //                   phaseKey: ev.phase,
// //                   eventId: ev.eventId,
// //                   patch: {
// //                     status: "done",
// //                     endedAt: Date.now(),
// //                     durationMs: ev.durationMs,
// //                     rawOutput: ev.rawOutput,
// //                   },
// //                 }),
// //               );
// //             }
// //             break;

// //           case "phase_done":
// //             if (ev.phase) {
// //               dispatch(
// //                 setPhaseStatus({
// //                   phaseKey: ev.phase,
// //                   status: "complete",
// //                 }),
// //               );
// //             }
// //             break;

// //           case "token":
// //             if (ev.text) {
// //               dispatch(setPipelineStage("streaming"));
// //               dispatch(
// //                 appendToMessage({
// //                   id: assistantId,
// //                   token: ev.text,
// //                 }),
// //               );
// //             }
// //             break;

// //           case "sources":
// //             dispatch(
// //               setMessageSources({
// //                 messageId: assistantId,
// //                 sources: ev.sources || [],
// //                 citations: ev.citations || [],
// //               }),
// //             );
// //             break;

// //           case "done": {
// //             // Snapshot live pipeline into final assistant message
// //             const snapshot = livePipelineRef.current;

// //             dispatch(
// //               setMessagePipeline({
// //                 messageId: assistantId,
// //                 pipeline: snapshot,
// //               }),
// //             );

// //             dispatch(
// //               setMessageStatus({
// //                 id: assistantId,
// //                 status: "complete",
// //               }),
// //             );

// //             dispatch(setStreaming(false));
// //             dispatch(setPipelineStage("complete"));

// //             stopTimer();

// //             setTimeout(() => {
// //               dispatch(clearLivePipeline());
// //               dispatch(setPipelineStage("idle"));
// //             }, 600);

// //             off();
// //             break;
// //           }

// //           case "error":
// //             dispatch(
// //               setMessageStatus({
// //                 id: assistantId,
// //                 status: "error",
// //               }),
// //             );

// //             dispatch(setError(ev.message || "Stream error"));
// //             dispatch(setStreaming(false));
// //             dispatch(setPipelineStage("idle"));
// //             dispatch(clearLivePipeline());

// //             stopTimer();
// //             off();
// //             break;
// //         }
// //       });

// //       // Keep your send shape
// //       wsService.send({ content, attachments });
// //     },
// //     [activeSessionId, dispatch, startTimer, stopTimer],
// //   );

// //   /* ============================================================
// //      KEEP PIPELINE SNAPSHOT UPDATED
// //      ============================================================ */

// //   useEffect(() => {
// //     livePipelineRef.current = livePipeline;
// //   }, [livePipeline]);

// //   /* ============================================================
// //      RENDER
// //      ============================================================ */

// //   return (
// //     <Box
// //       sx={{
// //         flex: 1,
// //         display: "flex",
// //         flexDirection: "column",
// //         height: "100vh",
// //         minWidth: 0,
// //         bgcolor: palette.bgChat,
// //       }}
// //     >
// //       {/* ======================================================
// //          HEADER AREA
// //          First row = actions/settings
// //          Second row = chat title
// //          This matches the better structure from first panel
// //          ====================================================== */}

// //       <Box
// //         sx={{
// //           bgcolor: palette.bgChat,
// //           borderBottom: "1px solid",
// //           borderColor: palette.border,
// //         }}
// //       >
// //         {/* Top utility row */}
// //         <Box
// //           sx={{
// //             px: 2,
// //             py: 0.75,
// //             display: "flex",
// //             alignItems: "center",
// //             justifyContent: "flex-end",
// //             gap: 0.5,
// //             minHeight: 44,
// //           }}
// //         >
// //           {/* Stop only while streaming */}
// //           {isStreaming && (
// //             <Button
// //               size="small"
// //               startIcon={<StopCircleOutlinedIcon />}
// //               onClick={handleStop}
// //               sx={{
// //                 color: palette.error,
// //                 fontSize: 12,
// //                 textTransform: "none",
// //               }}
// //             >
// //               Stop
// //             </Button>
// //           )}

// //           {/* Theme toggle */}
// //           <Tooltip title={`Switch to ${mode === "light" ? "dark" : "Light"} theme`}>
// //             <IconButton
// //               size="small"
// //               onClick={toggle}
// //               sx={{ color: palette.textSecondary }}
// //             >
// //               {mode === "light" ? (
// //                 <DarkModeOutlinedIcon sx={{ fontSize: 18 }} />
// //               ) : (
// //                 <LightModeOutlinedIcon sx={{ fontSize: 18 }} />
// //               )}
// //             </IconButton>
// //           </Tooltip>

// //           {/* Settings button */}
// //           <Tooltip title="Settings">
// //             <IconButton
// //               size="small"
// //               onClick={openSettings}
// //               aria-label="Open settings"
// //               sx={{ color: palette.textSecondary }}
// //             >
// //               <SettingsOutlinedIcon fontSize="small" />
// //             </IconButton>
// //           </Tooltip>
// //         </Box>

// //         {/* Show title row only after conversation has started */}
// //         {messages.length > 0 && (
// //           <>
// //             <Divider sx={{ borderColor: palette.border }} />

// //             <Box
// //               sx={{
// //                 px: 2,
// //                 py: 1.25,
// //                 display: "flex",
// //                 alignItems: "center",
// //                 gap: 1,
// //                 flexWrap: "wrap",
// //                 maxWidth: 920,
// //                 mx: "auto",
// //                 width: "100%",
// //                 boxSizing: "border-box",
// //               }}
// //             >
// //               <Box sx={{ minWidth: 0, flex: "1 1 200px" }}>
// //                 {titleEditing && activeSessionId ? (
// //                   <TextField
// //                     autoFocus
// //                     size="small"
// //                     fullWidth
// //                     value={titleDraft}
// //                     onChange={(e) => setTitleDraft(e.target.value)}
// //                     onBlur={commitTitle}
// //                     onKeyDown={(e) => {
// //                       if (e.key === "Enter") {
// //                         commitTitle();
// //                       }

// //                       if (e.key === "Escape") {
// //                         setTitleDraft(activeTitle || "Untitled chat");
// //                         setTitleEditing(false);
// //                       }
// //                     }}
// //                     placeholder="Chat name"
// //                     sx={{
// //                       maxWidth: 480,
// //                       "& .MuiInputBase-input": {
// //                         fontSize: 14,
// //                         fontWeight: 600,
// //                       },
// //                     }}
// //                   />
// //                 ) : (
// //                   <Box
// //                     sx={{
// //                       display: "flex",
// //                       alignItems: "center",
// //                       gap: 0.5,
// //                       minWidth: 0,
// //                       "& .chat-title-edit-btn": {
// //                         opacity: 0,
// //                         transition: "opacity 0.15s",
// //                       },
// //                       "&:hover .chat-title-edit-btn": {
// //                         opacity: activeSessionId ? 1 : 0,
// //                       },
// //                       "&:focus-within .chat-title-edit-btn": {
// //                         opacity: activeSessionId ? 1 : 0,
// //                       },
// //                     }}
// //                   >
// //                     <Typography
// //                       noWrap
// //                       sx={{
// //                         fontWeight: 600,
// //                         fontSize: 15,
// //                         color: palette.textPrimary,
// //                       }}
// //                     >
// //                       {activeTitle || "Untitled chat"}
// //                     </Typography>

// //                     {activeSessionId && (
// //                       <Tooltip title="Rename chat">
// //                         <IconButton
// //                           className="chat-title-edit-btn"
// //                           size="small"
// //                           aria-label="Rename chat"
// //                           onClick={() => setTitleEditing(true)}
// //                           sx={{ color: palette.textSecondary }}
// //                         >
// //                           <EditOutlinedIcon fontSize="small" />
// //                         </IconButton>
// //                       </Tooltip>
// //                     )}
// //                   </Box>
// //                 )}
// //               </Box>
// //             </Box>

// //             <Divider sx={{ borderColor: palette.border }} />
// //           </>
// //         )}
// //       </Box>

// //       {/* ======================================================
// //          BODY
// //          Empty state = centered hero input
// //          Chat started = messages list
// //          ====================================================== */}

// //       {messages.length === 0 ? (
// //         <Box
// //           sx={{
// //             flex: 1,
// //             minHeight: 0,
// //             display: "flex",
// //             flexDirection: "column",
// //             alignItems: "center",
// //             justifyContent: "center",
// //             px: { xs: 2, sm: 4 },
// //             py: 4,
// //             overflow: "auto",
// //           }}
// //         >
// //           {/* Hero heading */}
// //           <Typography
// //             component="h1"
// //             sx={{
// //               fontWeight: 500,
// //               fontSize: { xs: "1.85rem", sm: "2.75rem" },
// //               color: palette.textPrimary,
// //               textAlign: "center",
// //               lineHeight: 1.2,
// //               maxWidth: 640,
// //               fontFamily:
// //                 mode === "dark"
// //                   ? '"Georgia", "Times New Roman", serif'
// //                   : undefined,
// //             }}
// //           >
// //             What can I help you with?
// //           </Typography>

// //           {/* Hero subtitle */}
// //           <Typography
// //             sx={{
// //               mt: 1.5,
// //               color: palette.textSecondary,
// //               fontSize: 15,
// //               textAlign: "center",
// //               maxWidth: 560,
// //               lineHeight: 1.6,
// //             }}
// //           >
// //             Paste logs, describe a ticket, or upload files — I&apos;ll analyze and help.
// //           </Typography>

// //           {/* Centered hero ChatInput */}
// //           <Box sx={{ width: "100%", maxWidth: 860, mt: 4 }}>
// //             <ChatInput
// //               variant="hero"
// //               onSend={handleSend}
// //               disabled={isStreaming}
// //               placeholder="Ask Logic Chat something..."
// //             />
// //           </Box>
// //         </Box>
// //       ) : (
// //         <Box
// //           ref={scrollRef}
// //           sx={{
// //             flex: 1,
// //             overflowY: "auto",
// //             overflowX: "hidden",
// //             py: 1,
// //             minHeight: 0,
// //             minWidth: 0,
// //             width: "100%",
// //             display: "flex",
// //             flexDirection: "column",
// //             alignItems: "center",
// //             "&::-webkit-scrollbar": {
// //               width: 8,
// //             },
// //             "&::-webkit-scrollbar-thumb": {
// //               background: palette.scrollbarThumb,
// //               borderRadius: 4,
// //             },
// //           }}
// //         >
// //           <Box
// //             sx={{
// //               width: "100%",
// //               maxWidth: 920,
// //               flex: "1 1 auto",
// //               minHeight: 0,
// //               minWidth: 0,
// //               boxSizing: "border-box",
// //             }}
// //           >
// //             {messages.map((msg, index) => {
// //               const isLastAssistant =
// //                 index === messages.length - 1 && msg.role === "assistant";

// //               const isLiveBubble =
// //                 isLastAssistant && isStreaming && msg.id === liveAssistantId;

// //               // While streaming and no assistant token yet,
// //               // show pipeline panel in place of empty assistant bubble
// //               if (isLiveBubble && msg.content.length === 0) {
// //                 return (
// //                   <Box
// //                     key={msg.id}
// //                     sx={{
// //                       display: "flex",
// //                       mb: 2,
// //                       pl: { xs: 0, md: 5.5 },
// //                     }}
// //                   >
// //                     <Box
// //                       sx={{
// //                         width: { xs: "100%", md: "70%" },
// //                         maxWidth: "70%",
// //                       }}
// //                     >
// //                       <PipelinePanel phases={livePipeline} live compact />
// //                     </Box>
// //                   </Box>
// //                 );
// //               }

// //               return (
// //                 <MessageBubble
// //                   key={msg.id}
// //                   message={msg}
// //                   onRetry={
// //                     msg.status === "error"
// //                       ? () =>
// //                           handleSend(
// //                             messages[messages.length - 2]?.content || "",
// //                             [],
// //                           )
// //                       : undefined
// //                   }
// //                 />
// //               );
// //             })}
// //           </Box>
// //         </Box>
// //       )}

// //       {/* ======================================================
// //          ERROR TOAST
// //          ====================================================== */}

// //       <Snackbar
// //         open={!!error}
// //         autoHideDuration={5000}
// //         onClose={() => dispatch(setError(null))}
// //       >
// //         <Alert severity="error" onClose={() => dispatch(setError(null))}>
// //           {error}
// //         </Alert>
// //       </Snackbar>

// //       {/* ======================================================
// //          FOOTER INPUT
// //          Only show after conversation exists
// //          ====================================================== */}

// //       {messages.length > 0 && (
// //         <Box
// //           sx={{
// //             flexShrink: 0,
// //             width: "100%",
// //             display: "flex",
// //             justifyContent: "center",
// //             minWidth: 0,
// //           }}
// //         >
// //           <Box
// //             sx={{
// //               width: "100%",
// //               maxWidth: 920,
// //               minWidth: 0,
// //             }}
// //           >
// //             <ChatInput
// //               variant="footer"
// //               onSend={handleSend}
// //               disabled={isStreaming}
// //               placeholder="Ask anything — paste logs, attach files, drop screenshots..."
// //             />
// //           </Box>
// //         </Box>
// //       )}
// //     </Box>
// //   );
// // };

// // export default ChatPanel;

// import React, { useRef, useEffect, useCallback, useMemo, useState } from "react";
// import {
//   Box,
//   Typography,
//   Alert,
//   Snackbar,
//   IconButton,
//   Tooltip,
//   Button,
//   Divider,
//   TextField,
// } from "@mui/material";

// import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
// import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
// import StopCircleOutlinedIcon from "@mui/icons-material/StopCircleOutlined";
// import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
// import EditOutlinedIcon from "@mui/icons-material/EditOutlined";

// import { useAppDispatch, useAppSelector } from "../store/hooks";
// import {
//   addMessage,
//   appendToMessage,
//   setMessageStatus,
//   setStreaming,
//   setPipelineStage,
//   setElapsedTime,
//   setError,
//   setMessageSources,
//   setMessagePipeline,
//   initLivePipeline,
//   setPhaseStatus,
//   addPhaseEvent,
//   updatePhaseEvent,
//   appendPhaseEventDetail,
//   clearLivePipeline,
// } from "../features/chat/chatSlice";

// import {
//   createSession,
//   updateSessionMessages,
//   renameSession,
// } from "../features/session/sessionSlice";

// import { wsService, WsEvent, PhaseKey } from "../services/websocket";
// import { generateId } from "../utils/helpers";

// import MessageBubble from "./MessageBubble";
// import ChatInput from "./ChatInput";
// import PipelinePanel from "./PipelinePanel";

// import { useThemeMode } from "../contexts/ThemeModeContext";
// import { useSettingsUi } from "../contexts/SettingsUiContext";

// import type { FileAttachment, PipelinePhase } from "../features/chat/chatSlice";

// /* ============================================================
//    PHASE DEFINITIONS
//    ============================================================ */

// const PHASE_DEFS: { key: PhaseKey; label: string; description: string }[] = [
//   {
//     key: "routing",
//     label: "Routing",
//     description: "Classifying intent & selecting tools",
//   },
//   {
//     key: "planning",
//     label: "Planning",
//     description: "Building the execution plan",
//   },
//   {
//     key: "executing",
//     label: "Executing",
//     description: "Running tools (Splunk, Jira, vector search…)",
//   },
//   {
//     key: "synthesizing",
//     label: "Synthesizing",
//     description: "Composing the final response",
//   },
// ];

// const ChatPanel: React.FC = () => {
//   /* ============================================================
//      GLOBAL HOOKS
//      ============================================================ */

//   const dispatch = useAppDispatch();
//   const { palette, mode, toggle } = useThemeMode();
//   const { openSettings } = useSettingsUi();

//   const {
//     messages,
//     isStreaming,
//     error,
//     livePipeline,
//     liveAssistantId,
//   } = useAppSelector((s) => s.chat);

//   const { activeSessionId, sessions } = useAppSelector((s) => s.session);

//   /* ============================================================
//      LOCAL STATE
//      ============================================================ */

//   const scrollRef = useRef<HTMLDivElement>(null);
//   const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
//   const startTimeRef = useRef(0);
//   const livePipelineRef = useRef(livePipeline);

//   const [titleEditing, setTitleEditing] = useState(false);
//   const [titleDraft, setTitleDraft] = useState("");

//   /* ============================================================
//      ACTIVE TITLE
//      ============================================================ */

//   const activeTitle = useMemo(() => {
//     return sessions.find((s) => s.id === activeSessionId)?.title || "New Conversation";
//   }, [sessions, activeSessionId]);

//   useEffect(() => {
//     if (!titleEditing) {
//       setTitleDraft(activeTitle);
//     }
//   }, [activeTitle, titleEditing]);

//   /* ============================================================
//      AUTO SCROLL
//      Keep your current body behavior
//      ============================================================ */

//   useEffect(() => {
//     if (!scrollRef.current) return;
//     const el = scrollRef.current;
//     el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
//   }, [messages, livePipeline, isStreaming]);

//   /* ============================================================
//      WEBSOCKET LIFECYCLE
//      Keep your websocket code
//      ============================================================ */

//   useEffect(() => {
//     wsService.connect();
//     return () => wsService.disconnect();
//   }, []);

//   /* ============================================================
//      SESSION MESSAGE PERSIST
//      ============================================================ */

//   useEffect(() => {
//     if (activeSessionId && messages.length > 0) {
//       dispatch(updateSessionMessages({ id: activeSessionId, messages: [...messages] }));
//     }
//   }, [messages, activeSessionId, dispatch]);

//   /* ============================================================
//      TIMER HELPERS
//      ============================================================ */

//   const startTimer = useCallback(() => {
//     startTimeRef.current = Date.now();
//     timerRef.current = setInterval(() => {
//       dispatch(setElapsedTime(Date.now() - startTimeRef.current));
//     }, 200);
//   }, [dispatch]);

//   const stopTimer = useCallback(() => {
//     if (timerRef.current) {
//       clearInterval(timerRef.current);
//       timerRef.current = null;
//     }
//   }, []);

//   /* ============================================================
//      STOP STREAM
//      ============================================================ */

//   const handleStop = useCallback(() => {
//     wsService.abort();

//     if (liveAssistantId) {
//       dispatch(setMessageStatus({ id: liveAssistantId, status: "complete" }));
//     }

//     dispatch(setStreaming(false));
//     dispatch(setPipelineStage("idle"));
//     dispatch(clearLivePipeline());
//     stopTimer();
//   }, [dispatch, liveAssistantId, stopTimer]);

//   /* ============================================================
//      RENAME TITLE
//      ============================================================ */

//   const commitTitle = useCallback(() => {
//     if (!activeSessionId) {
//       setTitleEditing(false);
//       return;
//     }

//     const finalTitle = titleDraft.trim() || "Untitled chat";

//     dispatch(renameSession({ id: activeSessionId, title: finalTitle }));
//     setTitleEditing(false);
//   }, [activeSessionId, titleDraft, dispatch]);

//   /* ============================================================
//      SEND MESSAGE
//      Keep your flow
//      ============================================================ */

//   const handleSend = useCallback(
//     async (content: string, attachments: FileAttachment[]) => {
//       let sessionId = activeSessionId;

//       if (!sessionId) {
//         sessionId = generateId();

//         dispatch(
//           createSession({
//             id: sessionId,
//             title: content.slice(0, 50) || "New Conversation",
//             createdAt: Date.now(),
//             updatedAt: Date.now(),
//             messages: [],
//           }),
//         );
//       }

//       dispatch(
//         addMessage({
//           id: generateId(),
//           role: "user",
//           content,
//           timestamp: Date.now(),
//           status: "complete",
//           attachments,
//         }),
//       );

//       const assistantId = generateId();

//       dispatch(
//         addMessage({
//           id: assistantId,
//           role: "assistant",
//           content: "",
//           timestamp: Date.now(),
//           status: "streaming",
//         }),
//       );

//       const initialPhases: PipelinePhase[] = PHASE_DEFS.map((p) => ({
//         ...p,
//         status: "pending",
//         events: [],
//       }));

//       dispatch(initLivePipeline({ assistantId, phases: initialPhases }));
//       dispatch(setStreaming(true));
//       dispatch(setPipelineStage("routing"));
//       startTimer();

//       const off = wsService.on((ev: WsEvent) => {
//         switch (ev.type) {
//           case "phase_start":
//             if (ev.phase) {
//               dispatch(setPhaseStatus({ phaseKey: ev.phase, status: "active" }));
//               dispatch(setPipelineStage(ev.phase));
//             }
//             break;

//           case "phase_event":
//             if (ev.phase && ev.eventId) {
//               dispatch(
//                 addPhaseEvent({
//                   phaseKey: ev.phase,
//                   event: {
//                     id: ev.eventId,
//                     label: ev.label || "Step",
//                     toolName: ev.toolName,
//                     status: "running",
//                     startedAt: Date.now(),
//                     detail: "",
//                   },
//                 }),
//               );
//             }
//             break;

//           case "event_chunk":
//             if (ev.phase && ev.eventId && ev.chunk) {
//               dispatch(
//                 appendPhaseEventDetail({
//                   phaseKey: ev.phase,
//                   eventId: ev.eventId,
//                   chunk: ev.chunk,
//                 }),
//               );
//             }
//             break;

//           case "event_done":
//             if (ev.phase && ev.eventId) {
//               dispatch(
//                 updatePhaseEvent({
//                   phaseKey: ev.phase,
//                   eventId: ev.eventId,
//                   patch: {
//                     status: "done",
//                     endedAt: Date.now(),
//                     durationMs: ev.durationMs,
//                     rawOutput: ev.rawOutput,
//                   },
//                 }),
//               );
//             }
//             break;

//           case "phase_done":
//             if (ev.phase) {
//               dispatch(setPhaseStatus({ phaseKey: ev.phase, status: "complete" }));
//             }
//             break;

//           case "token":
//             if (ev.text) {
//               dispatch(setPipelineStage("streaming"));
//               dispatch(appendToMessage({ id: assistantId, token: ev.text }));
//             }
//             break;

//           case "sources":
//             dispatch(
//               setMessageSources({
//                 messageId: assistantId,
//                 sources: ev.sources || [],
//                 citations: ev.citations || [],
//               }),
//             );
//             break;

//           case "done": {
//             const snapshot = livePipelineRef.current;

//             dispatch(setMessagePipeline({ messageId: assistantId, pipeline: snapshot }));
//             dispatch(setMessageStatus({ id: assistantId, status: "complete" }));
//             dispatch(setStreaming(false));
//             dispatch(setPipelineStage("complete"));

//             stopTimer();

//             setTimeout(() => {
//               dispatch(clearLivePipeline());
//               dispatch(setPipelineStage("idle"));
//             }, 600);

//             off();
//             break;
//           }

//           case "error":
//             dispatch(setMessageStatus({ id: assistantId, status: "error" }));
//             dispatch(setError(ev.message || "Stream error"));
//             dispatch(setStreaming(false));
//             dispatch(setPipelineStage("idle"));
//             dispatch(clearLivePipeline());
//             stopTimer();
//             off();
//             break;
//         }
//       });

//       wsService.send({ content, attachments });
//     },
//     [activeSessionId, dispatch, startTimer, stopTimer],
//   );

//   useEffect(() => {
//     livePipelineRef.current = livePipeline;
//   }, [livePipeline]);

//   /* ============================================================
//      RENDER
//      ============================================================ */

//   return (
//     <Box
//       sx={{
//         flex: 1,
//         display: "flex",
//         flexDirection: "column",
//         height: "100vh",
//         minWidth: 0,
//         bgcolor: palette.bgChat,
//       }}
//     >
//       {/* ======================================================
//          HEADER
//          Better from first file:
//          Row 1 = actions
//          Row 2 = title
//          ====================================================== */}
//       <Box
//         sx={{
//           borderBottom: "1px solid",
//           borderColor: palette.border,
//           bgcolor: palette.bgChat,
//         }}
//       >
//         {/* Utility row */}
//         <Box
//           sx={{
//             px: 2,
//             py: 0.75,
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "flex-end",
//             gap: 0.5,
//             minHeight: 44,
//           }}
//         >
//           {isStreaming && (
//             <Button
//               size="small"
//               startIcon={<StopCircleOutlinedIcon />}
//               onClick={handleStop}
//               sx={{
//                 color: palette.error,
//                 fontSize: 12,
//                 textTransform: "none",
//               }}
//             >
//               Stop
//             </Button>
//           )}

//           <Tooltip title={`Switch to ${mode === "light" ? "dark" : "Light"} theme`}>
//             <IconButton size="small" onClick={toggle} sx={{ color: palette.textSecondary }}>
//               {mode === "light" ? (
//                 <DarkModeOutlinedIcon sx={{ fontSize: 18 }} />
//               ) : (
//                 <LightModeOutlinedIcon sx={{ fontSize: 18 }} />
//               )}
//             </IconButton>
//           </Tooltip>

//           <Tooltip title="Settings">
//             <IconButton size="small" onClick={openSettings} sx={{ color: palette.textSecondary }}>
//               <SettingsOutlinedIcon fontSize="small" />
//             </IconButton>
//           </Tooltip>
//         </Box>

//         {/* Title row */}
//         {messages.length > 0 && (
//           <>
//             <Divider sx={{ borderColor: palette.border }} />

//             <Box
//               sx={{
//                 px: 3,
//                 py: 1.1,
//                 display: "flex",
//                 alignItems: "center",
//                 minHeight: 52,
//               }}
//             >
//               <Box sx={{ minWidth: 0, flex: 1 }}>
//                 {titleEditing && activeSessionId ? (
//                   <TextField
//                     autoFocus
//                     size="small"
//                     fullWidth
//                     value={titleDraft}
//                     onChange={(e) => setTitleDraft(e.target.value)}
//                     onBlur={commitTitle}
//                     onKeyDown={(e) => {
//                       if (e.key === "Enter") commitTitle();
//                       if (e.key === "Escape") {
//                         setTitleDraft(activeTitle);
//                         setTitleEditing(false);
//                       }
//                     }}
//                     placeholder="Chat name"
//                     sx={{
//                       maxWidth: 480,
//                       "& .MuiInputBase-input": {
//                         fontSize: 14,
//                         fontWeight: 600,
//                       },
//                     }}
//                   />
//                 ) : (
//                   <Box
//                     sx={{
//                       display: "flex",
//                       alignItems: "center",
//                       gap: 0.5,
//                       minWidth: 0,
//                       "& .chat-title-edit-btn": {
//                         opacity: 0,
//                         transition: "opacity 0.15s",
//                       },
//                       "&:hover .chat-title-edit-btn": {
//                         opacity: activeSessionId ? 1 : 0,
//                       },
//                     }}
//                   >
//                     <Typography
//                       noWrap
//                       sx={{
//                         fontWeight: 600,
//                         fontSize: 15,
//                         color: palette.textPrimary,
//                       }}
//                     >
//                       {activeTitle || "Untitled chat"}
//                     </Typography>

//                     {activeSessionId && (
//                       <Tooltip title="Rename chat">
//                         <IconButton
//                           className="chat-title-edit-btn"
//                           size="small"
//                           onClick={() => setTitleEditing(true)}
//                           sx={{ color: palette.textSecondary }}
//                         >
//                           <EditOutlinedIcon fontSize="small" />
//                         </IconButton>
//                       </Tooltip>
//                     )}
//                   </Box>
//                 )}
//               </Box>
//             </Box>

//             <Divider sx={{ borderColor: palette.border }} />
//           </>
//         )}
//       </Box>

//       {/* ======================================================
//          BODY
//          Keep your better body/message skeleton
//          ====================================================== */}
//       {messages.length === 0 ? (
//         <Box
//           sx={{
//             flex: 1,
//             minHeight: 0,
//             display: "flex",
//             flexDirection: "column",
//             alignItems: "center",
//             justifyContent: "center",
//             px: { xs: 2, sm: 4 },
//             py: 4,
//             overflow: "auto",
//           }}
//         >
//           <Typography
//             component="h1"
//             sx={{
//               fontSize: 22,
//               fontWeight: 700,
//               color: palette.textPrimary,
//               textAlign: "center",
//             }}
//           >
//             What can I help you with?
//           </Typography>

//           <Typography
//             sx={{
//               mt: 1.5,
//               color: palette.textMuted,
//               maxWidth: 520,
//               textAlign: "center",
//               fontSize: 13,
//               lineHeight: 1.6,
//             }}
//           >
//             Paste logs, describe a ticket, or attach system outputs. I&apos;ll route it through the right tools and explain what I find — step by step.
//           </Typography>

//           {/* Hero input should stay centered here */}
//           <Box sx={{ width: "100%", maxWidth: 860, mt: 4 }}>
//             <ChatInput
//               variant="hero"
//               onSend={handleSend}
//               disabled={isStreaming}
//               placeholder="Ask Logic Chat something..."
//             />
//           </Box>
//         </Box>
//       ) : (
//         <Box
//           ref={scrollRef}
//           sx={{
//             flex: 1,
//             overflow: "auto",
//             py: 2,
//             px: { xs: 1.5, md: 4 },
//             "&::-webkit-scrollbar": {
//               width: 8,
//             },
//             "&::-webkit-scrollbar-thumb": {
//               background: palette.scrollbarThumb,
//               borderRadius: 4,
//             },
//           }}
//         >
//           {messages.map((msg, i) => {
//             const isLastAssistant =
//               i === messages.length - 1 &&
//               msg.role === "assistant";

//             const isLiveBubble =
//               isLastAssistant &&
//               isStreaming &&
//               msg.id === liveAssistantId;

//             if (isLiveBubble && msg.content.length === 0) {
//               return (
//                 <Box
//                   key={msg.id}
//                   sx={{
//                     display: "flex",
//                     mb: 2,
//                     pl: { xs: 0, md: 5.5 },
//                   }}
//                 >
//                   <Box
//                     sx={{
//                       width: { xs: "100%", md: "70%" },
//                       maxWidth: "70%",
//                     }}
//                   >
//                     <PipelinePanel phases={livePipeline} live compact />
//                   </Box>
//                 </Box>
//               );
//             }

//             return (
//               <MessageBubble
//                 key={msg.id}
//                 message={msg}
//                 onRetry={
//                   msg.status === "error"
//                     ? () =>
//                         handleSend(
//                           messages[messages.length - 2]?.content || "",
//                           [],
//                         )
//                     : undefined
//                 }
//               />
//             );
//           })}
//         </Box>
//       )}

//       {/* ======================================================
//          ERROR TOAST
//          ====================================================== */}
//       <Snackbar
//         open={!!error}
//         autoHideDuration={5000}
//         onClose={() => dispatch(setError(null))}
//       >
//         <Alert severity="error" onClose={() => dispatch(setError(null))}>
//           {error}
//         </Alert>
//       </Snackbar>

//       {/* ======================================================
//          FOOTER INPUT
//          Full-width occupancy like your code
//          ====================================================== */}
//       {messages.length > 0 && (
//         <Box sx={{ flexShrink: 0 }}>
//           <ChatInput
//             variant="footer"
//             onSend={handleSend}
//             disabled={isStreaming}
//             placeholder="Ask anything — paste logs, attach files, drop screenshots..."
//           />
//         </Box>
//       )}
//     </Box>
//   );
// };

// export default ChatPanel;

// import React, { useRef, useEffect, useCallback, useMemo, useState } from "react";
// import {
//   Box,
//   Typography,
//   Alert,
//   Snackbar,
//   IconButton,
//   Tooltip,
//   Button,
//   Divider,
//   TextField,
// } from "@mui/material";

// // Theme toggle icons
// import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
// import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";

// // Stop streaming icon
// import StopCircleOutlinedIcon from "@mui/icons-material/StopCircleOutlined";

// // Settings + rename icons
// import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
// import EditOutlinedIcon from "@mui/icons-material/EditOutlined";

// // Redux hooks
// import { useAppDispatch, useAppSelector } from "../store/hooks";

// // Chat slice actions
// import {
//   addMessage,
//   appendToMessage,
//   setMessageStatus,
//   setStreaming,
//   setPipelineStage,
//   setElapsedTime,
//   setError,
//   setMessageSources,
//   setMessagePipeline,
//   initLivePipeline,
//   setPhaseStatus,
//   addPhaseEvent,
//   updatePhaseEvent,
//   appendPhaseEventDetail,
//   clearLivePipeline,
// } from "../features/chat/chatSlice";

// // Session slice actions
// import {
//   createSession,
//   updateSessionMessages,
//   renameSession,
// } from "../features/session/sessionSlice";

// // Websocket service + event types
// import { wsService, WsEvent, PhaseKey } from "../services/websocket";

// // Utility helper for ids
// import { generateId } from "../utils/helpers";

// // Child UI components
// import MessageBubble from "./MessageBubble";
// import ChatInput from "./ChatInput";
// import PipelinePanel from "./PipelinePanel";

// // Theme + settings contexts
// import { useThemeMode } from "../contexts/ThemeModeContext";
// import { useSettingsUi } from "../contexts/SettingsUiContext";

// // Type imports
// import type { FileAttachment, PipelinePhase } from "../features/chat/chatSlice";

// /* ============================================================
//    PIPELINE DEFINITIONS
//    These are the streaming stages shown while assistant is working.
//    ============================================================ */
// const PHASE_DEFS: { key: PhaseKey; label: string; description: string }[] = [
//   {
//     key: "routing",
//     label: "Routing",
//     description: "Classifying intent & selecting tools",
//   },
//   {
//     key: "planning",
//     label: "Planning",
//     description: "Building the execution plan",
//   },
//   {
//     key: "executing",
//     label: "Executing",
//     description: "Running tools (Splunk, Jira, vector search…)",
//   },
//   {
//     key: "synthesizing",
//     label: "Synthesizing",
//     description: "Composing the final response",
//   },
// ];

// /* ============================================================
//    MAIN CHAT PANEL COMPONENT
//    ============================================================ */
// const ChatPanel: React.FC = () => {
//   /* ------------------------------------------------------------
//      GLOBAL HOOKS
//      ------------------------------------------------------------ */

//   // Redux dispatch function
//   const dispatch = useAppDispatch();

//   // Theme context:
//   // palette -> custom colors
//   // mode    -> light/dark
//   // toggle  -> switches theme
//   const { palette, mode, toggle } = useThemeMode();

//   // Settings drawer opener
//   const { openSettings } = useSettingsUi();

//   /* ------------------------------------------------------------
//      REDUX STATE
//      ------------------------------------------------------------ */

//   // Chat-level state
//   const {
//     messages,        // all current chat messages rendered in panel
//     isStreaming,     // whether assistant is currently streaming
//     error,           // global chat error shown in snackbar
//     livePipeline,    // live pipeline data while assistant is working
//     liveAssistantId, // assistant message currently streaming
//   } = useAppSelector((s) => s.chat);

//   // Session-level state
//   const {
//     activeSessionId, // current selected conversation id
//     sessions,        // all conversations in sidebar/session store
//   } = useAppSelector((s) => s.session);

//   /* ------------------------------------------------------------
//      LOCAL REFS
//      ------------------------------------------------------------ */

//   // Scroll container ref for message area
//   const scrollRef = useRef<HTMLDivElement>(null);

//   // Timer ref for elapsed time updates
//   const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

//   // Stores timestamp when current run started
//   const startTimeRef = useRef(0);

//   // Mutable ref that always holds the latest live pipeline snapshot
//   // Helpful because websocket "done" handler may need latest value
//   const livePipelineRef = useRef(livePipeline);

//   /* ------------------------------------------------------------
//      LOCAL UI STATE
//      ------------------------------------------------------------ */

//   // Whether the conversation title is being edited
//   const [titleEditing, setTitleEditing] = useState(false);

//   // Temporary title text while editing
//   const [titleDraft, setTitleDraft] = useState("");

//   /* ------------------------------------------------------------
//      DERIVED VALUES
//      ------------------------------------------------------------ */

//   // Resolve current active title from session store.
//   // If no session exists yet, show default title.
//   const activeTitle = useMemo(() => {
//     return sessions.find((s) => s.id === activeSessionId)?.title || "New Conversation";
//   }, [sessions, activeSessionId]);

//   /* ------------------------------------------------------------
//      KEEP TITLE DRAFT IN SYNC
//      When user is not editing, always mirror current session title
//      into the input draft.
//      ------------------------------------------------------------ */
//   useEffect(() => {
//     if (!titleEditing) {
//       setTitleDraft(activeTitle);
//     }
//   }, [activeTitle, titleEditing]);

//   /* ------------------------------------------------------------
//      AUTO SCROLL
//      Keep current behavior:
//      whenever messages or pipeline change, scroll to bottom.
//      ------------------------------------------------------------ */
//   useEffect(() => {
//     if (!scrollRef.current) return;

//     const el = scrollRef.current;

//     el.scrollTo({
//       top: el.scrollHeight,
//       behavior: "smooth",
//     });
//   }, [messages, livePipeline, isStreaming]);

//   /* ------------------------------------------------------------
//      WEBSOCKET LIFECYCLE
//      Connect on mount, disconnect on unmount.
//      ------------------------------------------------------------ */
//   useEffect(() => {
//     wsService.connect();

//     return () => {
//       wsService.disconnect();
//     };
//   }, []);

//   /* ------------------------------------------------------------
//      PERSIST CURRENT MESSAGES INTO ACTIVE SESSION
//      This keeps the session store updated with current message list.
//      ------------------------------------------------------------ */
//   useEffect(() => {
//     if (activeSessionId && messages.length > 0) {
//       dispatch(
//         updateSessionMessages({
//           id: activeSessionId,
//           messages: [...messages],
//         }),
//       );
//     }
//   }, [messages, activeSessionId, dispatch]);

//   /* ------------------------------------------------------------
//      TIMER HELPERS
//      These update elapsed time while assistant is processing.
//      ------------------------------------------------------------ */

//   // Start elapsed-time timer
//   const startTimer = useCallback(() => {
//     startTimeRef.current = Date.now();

//     timerRef.current = setInterval(() => {
//       dispatch(setElapsedTime(Date.now() - startTimeRef.current));
//     }, 200);
//   }, [dispatch]);

//   // Stop elapsed-time timer
//   const stopTimer = useCallback(() => {
//     if (timerRef.current) {
//       clearInterval(timerRef.current);
//       timerRef.current = null;
//     }
//   }, []);

//   /* ------------------------------------------------------------
//      STOP CURRENT STREAM
//      Used when user presses the Stop button.
//      ------------------------------------------------------------ */
//   const handleStop = useCallback(() => {
//     // Abort websocket streaming
//     wsService.abort();

//     // If assistant message is currently live, mark it complete
//     if (liveAssistantId) {
//       dispatch(
//         setMessageStatus({
//           id: liveAssistantId,
//           status: "complete",
//         }),
//       );
//     }

//     // Reset live state
//     dispatch(setStreaming(false));
//     dispatch(setPipelineStage("idle"));
//     dispatch(clearLivePipeline());

//     // Stop elapsed timer
//     stopTimer();
//   }, [dispatch, liveAssistantId, stopTimer]);

//   /* ------------------------------------------------------------
//      COMMIT TITLE RENAME
//      Saves the edited conversation title into session store.
//      ------------------------------------------------------------ */
//   const commitTitle = useCallback(() => {
//     // If there is no active session, just close edit mode
//     if (!activeSessionId) {
//       setTitleEditing(false);
//       return;
//     }

//     // Prevent empty title
//     const finalTitle = titleDraft.trim() || "Untitled chat";

//     // Update session title in redux
//     dispatch(
//       renameSession({
//         id: activeSessionId,
//         title: finalTitle,
//       }),
//     );

//     // Exit edit mode
//     setTitleEditing(false);
//   }, [activeSessionId, titleDraft, dispatch]);

//   /* ------------------------------------------------------------
//      SEND MESSAGE
//      This is the most important flow:
//      1. create session if needed
//      2. add user message
//      3. add assistant placeholder
//      4. initialize pipeline
//      5. listen to websocket events
//      ------------------------------------------------------------ */
//   const handleSend = useCallback(
//     async (content: string, attachments: FileAttachment[]) => {
//       // Resolve current session id
//       let sessionId = activeSessionId;

//       // If there is no active conversation yet, create one first
//       if (!sessionId) {
//         sessionId = generateId();

//         dispatch(
//           createSession({
//             id: sessionId,
//             title: content.slice(0, 50) || "New Conversation",
//             createdAt: Date.now(),
//             updatedAt: Date.now(),
//             messages: [],
//           }),
//         );
//       }

//       // Add the user's message immediately
//       dispatch(
//         addMessage({
//           id: generateId(),
//           role: "user",
//           content,
//           timestamp: Date.now(),
//           status: "complete",
//           attachments,
//         }),
//       );

//       // Create an assistant placeholder bubble
//       // This will receive streaming content
//       const assistantId = generateId();

//       dispatch(
//         addMessage({
//           id: assistantId,
//           role: "assistant",
//           content: "",
//           timestamp: Date.now(),
//           status: "streaming",
//         }),
//       );

//       // Build the initial pipeline state
//       const initialPhases: PipelinePhase[] = PHASE_DEFS.map((phase) => ({
//         ...phase,
//         status: "pending",
//         events: [],
//       }));

//       dispatch(
//         initLivePipeline({
//           assistantId,
//           phases: initialPhases,
//         }),
//       );

//       // Mark streaming started
//       dispatch(setStreaming(true));
//       dispatch(setPipelineStage("routing"));

//       // Start timer
//       startTimer();

//       // Subscribe to websocket events for this request
//       const off = wsService.on((ev: WsEvent) => {
//         switch (ev.type) {
//           // A major phase started
//           case "phase_start":
//             if (ev.phase) {
//               dispatch(
//                 setPhaseStatus({
//                   phaseKey: ev.phase,
//                   status: "active",
//                 }),
//               );
//               dispatch(setPipelineStage(ev.phase));
//             }
//             break;

//           // A detailed step inside a phase started
//           case "phase_event":
//             if (ev.phase && ev.eventId) {
//               dispatch(
//                 addPhaseEvent({
//                   phaseKey: ev.phase,
//                   event: {
//                     id: ev.eventId,
//                     label: ev.label || "Step",
//                     toolName: ev.toolName,
//                     status: "running",
//                     startedAt: Date.now(),
//                     detail: "",
//                   },
//                 }),
//               );
//             }
//             break;

//           // Append streaming detail to a phase event
//           case "event_chunk":
//             if (ev.phase && ev.eventId && ev.chunk) {
//               dispatch(
//                 appendPhaseEventDetail({
//                   phaseKey: ev.phase,
//                   eventId: ev.eventId,
//                   chunk: ev.chunk,
//                 }),
//               );
//             }
//             break;

//           // Mark a phase event completed
//           case "event_done":
//             if (ev.phase && ev.eventId) {
//               dispatch(
//                 updatePhaseEvent({
//                   phaseKey: ev.phase,
//                   eventId: ev.eventId,
//                   patch: {
//                     status: "done",
//                     endedAt: Date.now(),
//                     durationMs: ev.durationMs,
//                     rawOutput: ev.rawOutput,
//                   },
//                 }),
//               );
//             }
//             break;

//           // Mark a whole phase complete
//           case "phase_done":
//             if (ev.phase) {
//               dispatch(
//                 setPhaseStatus({
//                   phaseKey: ev.phase,
//                   status: "complete",
//                 }),
//               );
//             }
//             break;

//           // Assistant text token arrived
//           case "token":
//             if (ev.text) {
//               dispatch(setPipelineStage("streaming"));
//               dispatch(
//                 appendToMessage({
//                   id: assistantId,
//                   token: ev.text,
//                 }),
//               );
//             }
//             break;

//           // Sources/citations arrived
//           case "sources":
//             dispatch(
//               setMessageSources({
//                 messageId: assistantId,
//                 sources: ev.sources || [],
//                 citations: ev.citations || [],
//               }),
//             );
//             break;

//           // Stream finished successfully
//           case "done": {
//             // Snapshot live pipeline onto the assistant message
//             const snapshot = livePipelineRef.current;

//             dispatch(
//               setMessagePipeline({
//                 messageId: assistantId,
//                 pipeline: snapshot,
//               }),
//             );

//             // Mark final assistant message complete
//             dispatch(
//               setMessageStatus({
//                 id: assistantId,
//                 status: "complete",
//               }),
//             );

//             // Stop live state
//             dispatch(setStreaming(false));
//             dispatch(setPipelineStage("complete"));

//             // Stop timer
//             stopTimer();

//             // Clear live pipeline shortly after completion
//             setTimeout(() => {
//               dispatch(clearLivePipeline());
//               dispatch(setPipelineStage("idle"));
//             }, 600);

//             // Remove websocket listener
//             off();
//             break;
//           }

//           // Stream failed
//           case "error":
//             dispatch(
//               setMessageStatus({
//                 id: assistantId,
//                 status: "error",
//               }),
//             );

//             dispatch(setError(ev.message || "Stream error"));
//             dispatch(setStreaming(false));
//             dispatch(setPipelineStage("idle"));
//             dispatch(clearLivePipeline());

//             stopTimer();
//             off();
//             break;
//         }
//       });

//       // Send request through websocket
//       wsService.send({ content, attachments });
//     },
//     [activeSessionId, dispatch, startTimer, stopTimer],
//   );

//   /* ------------------------------------------------------------
//      KEEP LIVE PIPELINE REF IN SYNC
//      ------------------------------------------------------------ */
//   useEffect(() => {
//     livePipelineRef.current = livePipeline;
//   }, [livePipeline]);

//   /* ============================================================
//      RENDER
//      ============================================================ */
//   return (
//     <Box
//       sx={{
//         flex: 1,
//         display: "flex",
//         flexDirection: "column",
//         height: "100vh",
//         minWidth: 0,
//         bgcolor: palette.bgChat,
//       }}
//     >
//       {/* ======================================================
//          HEADER
//          Row 1 = utility actions
//          Row 2 = conversation title
//          This is the better flow you liked.
//          ====================================================== */}
//       <Box
//         sx={{
//           borderBottom: "1px solid",
//           borderColor: palette.border,
//           bgcolor: palette.bgChat,
//         }}
//       >
//         {/* Top utility row */}
//         <Box
//           sx={{
//             px: 2,
//             py: 0.75,
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "flex-end",
//             gap: 0.5,
//             minHeight: 44,
//           }}
//         >
//           {/* Stop button while assistant is streaming */}
//           {isStreaming && (
//             <Button
//               size="small"
//               startIcon={<StopCircleOutlinedIcon />}
//               onClick={handleStop}
//               sx={{
//                 color: palette.error,
//                 fontSize: 12,
//                 textTransform: "none",
//               }}
//             >
//               Stop
//             </Button>
//           )}

//           {/* Theme toggle */}
//           <Tooltip title={`Switch to ${mode === "light" ? "dark" : "Light"} theme`}>
//             <IconButton
//               size="small"
//               onClick={toggle}
//               sx={{ color: palette.textSecondary }}
//             >
//               {mode === "light" ? (
//                 <DarkModeOutlinedIcon sx={{ fontSize: 18 }} />
//               ) : (
//                 <LightModeOutlinedIcon sx={{ fontSize: 18 }} />
//               )}
//             </IconButton>
//           </Tooltip>

//           {/* Settings drawer button */}
//           <Tooltip title="Settings">
//             <IconButton
//               size="small"
//               onClick={openSettings}
//               sx={{ color: palette.textSecondary }}
//             >
//               <SettingsOutlinedIcon fontSize="small" />
//             </IconButton>
//           </Tooltip>
//         </Box>

//         {/* Title row only after conversation starts */}
//         {messages.length > 0 && (
//           <>
//             <Divider sx={{ borderColor: palette.border }} />

//             <Box
//               sx={{
//                 px: 3,
//                 py: 1.1,
//                 display: "flex",
//                 alignItems: "center",
//                 minHeight: 52,
//               }}
//             >
//               <Box sx={{ minWidth: 0, flex: 1 }}>
//                 {/* Editable title input */}
//                 {titleEditing && activeSessionId ? (
//                   <TextField
//                     autoFocus
//                     size="small"
//                     fullWidth
//                     value={titleDraft}
//                     onChange={(e) => setTitleDraft(e.target.value)}
//                     onBlur={commitTitle}
//                     onKeyDown={(e) => {
//                       if (e.key === "Enter") commitTitle();

//                       if (e.key === "Escape") {
//                         setTitleDraft(activeTitle);
//                         setTitleEditing(false);
//                       }
//                     }}
//                     placeholder="Chat name"
//                     sx={{
//                       maxWidth: 480,
//                       "& .MuiInputBase-input": {
//                         fontSize: 14,
//                         fontWeight: 600,
//                       },
//                     }}
//                   />
//                 ) : (
//                   <Box
//                     sx={{
//                       display: "flex",
//                       alignItems: "center",
//                       gap: 0.5,
//                       minWidth: 0,
//                       "& .chat-title-edit-btn": {
//                         opacity: 0,
//                         transition: "opacity 0.15s",
//                       },
//                       "&:hover .chat-title-edit-btn": {
//                         opacity: activeSessionId ? 1 : 0,
//                       },
//                     }}
//                   >
//                     {/* Current chat title */}
//                     <Typography
//                       noWrap
//                       sx={{
//                         fontWeight: 600,
//                         fontSize: 15,
//                         color: palette.textPrimary,
//                       }}
//                     >
//                       {activeTitle || "Untitled chat"}
//                     </Typography>

//                     {/* Rename icon */}
//                     {activeSessionId && (
//                       <Tooltip title="Rename chat">
//                         <IconButton
//                           className="chat-title-edit-btn"
//                           size="small"
//                           onClick={() => setTitleEditing(true)}
//                           sx={{ color: palette.textSecondary }}
//                         >
//                           <EditOutlinedIcon fontSize="small" />
//                         </IconButton>
//                       </Tooltip>
//                     )}
//                   </Box>
//                 )}
//               </Box>
//             </Box>

//             <Divider sx={{ borderColor: palette.border }} />
//           </>
//         )}
//       </Box>

//       {/* ======================================================
//          BODY
//          Empty state = centered hero input
//          Started chat = message list
//          ====================================================== */}
//       {messages.length === 0 ? (
//         <Box
//           sx={{
//             flex: 1,
//             minHeight: 0,
//             display: "flex",
//             flexDirection: "column",
//             alignItems: "center",
//             justifyContent: "center",
//             px: { xs: 2, sm: 4 },
//             py: 4,
//             overflow: "auto",
//           }}
//         >
//           {/* Empty state heading */}
//           <Typography
//             component="h1"
//             sx={{
//               fontSize: 22,
//               fontWeight: 700,
//               color: palette.textPrimary,
//               textAlign: "center",
//             }}
//           >
//             What can I help you with?
//           </Typography>

//           {/* Empty state subtitle */}
//           <Typography
//             sx={{
//               mt: 1.5,
//               color: palette.textMuted,
//               maxWidth: 520,
//               textAlign: "center",
//               fontSize: 13,
//               lineHeight: 1.6,
//             }}
//           >
//             Paste logs, describe a ticket, or attach system outputs. I&apos;ll route
//             it through the right tools and explain what I find — step by step.
//           </Typography>

//           {/* Centered hero-style input */}
//           <Box sx={{ width: "100%", maxWidth: 860, mt: 4 }}>
//             <ChatInput
//               variant="hero"
//               onSend={handleSend}
//               disabled={isStreaming}
//               placeholder="Ask Logic Chat something..."
//             />
//           </Box>
//         </Box>
//       ) : (
//         <Box
//           ref={scrollRef}
//           sx={{
//             flex: 1,
//             overflow: "auto",
//             py: 2,
//             px: { xs: 1.5, md: 4 },
//             "&::-webkit-scrollbar": {
//               width: 8,
//             },
//             "&::-webkit-scrollbar-thumb": {
//               background: palette.scrollbarThumb,
//               borderRadius: 4,
//             },
//           }}
//         >
//           {/* Render all messages */}
//           {messages.map((msg, index) => {
//             // Detect whether this is the last assistant message
//             const isLastAssistant =
//               index === messages.length - 1 && msg.role === "assistant";

//             // Detect whether this message is the current live/streaming assistant
//             const isLiveBubble =
//               isLastAssistant && isStreaming && msg.id === liveAssistantId;

//             // If assistant bubble exists but has no text yet,
//             // show live pipeline panel instead
//             if (isLiveBubble && msg.content.length === 0) {
//               return (
//                 <Box
//                   key={msg.id}
//                   sx={{
//                     display: "flex",
//                     mb: 2,
//                     pl: { xs: 0, md: 5.5 },
//                   }}
//                 >
//                   <Box
//                     sx={{
//                       width: { xs: "100%", md: "70%" },
//                       maxWidth: "70%",
//                     }}
//                   >
//                     <PipelinePanel phases={livePipeline} live compact />
//                   </Box>
//                 </Box>
//               );
//             }

//             // Normal message bubble
//             return (
//               <MessageBubble
//                 key={msg.id}
//                 message={msg}
//                 onRetry={
//                   msg.status === "error"
//                     ? () =>
//                         handleSend(
//                           messages[messages.length - 2]?.content || "",
//                           [],
//                         )
//                     : undefined
//                 }
//               />
//             );
//           })}
//         </Box>
//       )}

//       {/* ======================================================
//          ERROR SNACKBAR
//          ====================================================== */}
//       <Snackbar
//         open={!!error}
//         autoHideDuration={5000}
//         onClose={() => dispatch(setError(null))}
//       >
//         <Alert severity="error" onClose={() => dispatch(setError(null))}>
//           {error}
//         </Alert>
//       </Snackbar>

//       {/* ======================================================
//          FOOTER INPUT
//          Show normal docked input only after chat starts.
//          Keep full-width occupancy like your original code.
//          ====================================================== */}
//       {messages.length > 0 && (
//         <Box sx={{ flexShrink: 0 }}>
//           <ChatInput
//             variant="footer"
//             onSend={handleSend}
//             disabled={isStreaming}
//             placeholder="Ask anything — paste logs, attach files, drop screenshots..."
//           />
//         </Box>
//       )}
//     </Box>
//   );
// };

// export default ChatPanel;

import React, { useRef, useEffect, useCallback, useMemo, useState } from "react";
import {
  Box,
  Typography,
  Alert,
  Snackbar,
  IconButton,
  Tooltip,
  Divider,
  TextField,
} from "@mui/material";

// Theme toggle icons
import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";

// Settings + rename icons
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";

// Redux hooks
import { useAppDispatch, useAppSelector } from "../store/hooks";

// Chat slice actions
import {
  addMessage,
  appendToMessage,
  setMessageStatus,
  setStreaming,
  setPipelineStage,
  setElapsedTime,
  setError,
  setMessageSources,
  setMessagePipeline,
  initLivePipeline,
  setPhaseStatus,
  addPhaseEvent,
  updatePhaseEvent,
  appendPhaseEventDetail,
  clearLivePipeline,
} from "../features/chat/chatSlice";

// Session slice actions
import {
  createSession,
  updateSessionMessages,
  renameSession,
} from "../features/session/sessionSlice";

// Websocket service + event types
import { wsService, WsEvent, PhaseKey } from "../services/websocket";

// Utility helper for ids
import { generateId } from "../utils/helpers";

// Child UI components
import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import PipelinePanel from "./PipelinePanel";

// Theme + settings contexts
import { useThemeMode } from "../contexts/ThemeModeContext";
import { useSettingsUi } from "../contexts/SettingsUiContext";

// Type imports
import type { FileAttachment, PipelinePhase } from "../features/chat/chatSlice";

/* ============================================================
   PIPELINE DEFINITIONS
   These are the streaming stages shown while assistant is working.
   ============================================================ */
const PHASE_DEFS: { key: PhaseKey; label: string; description: string }[] = [
  {
    key: "routing",
    label: "Routing",
    description: "Classifying intent & selecting tools",
  },
  {
    key: "planning",
    label: "Planning",
    description: "Building the execution plan",
  },
  {
    key: "executing",
    label: "Executing",
    description: "Running tools (Splunk, Jira, vector search…)",
  },
  {
    key: "synthesizing",
    label: "Synthesizing",
    description: "Composing the final response",
  },
];

/* ============================================================
   MAIN CHAT PANEL COMPONENT
   ============================================================ */
const ChatPanel: React.FC = () => {
  /* ------------------------------------------------------------
     GLOBAL HOOKS
     ------------------------------------------------------------ */

  // Redux dispatch function
  const dispatch = useAppDispatch();

  // Theme context:
  // palette -> custom colors
  // mode    -> light/dark
  // toggle  -> switches theme
  const { palette, mode, toggle } = useThemeMode();

  // Settings drawer opener
  const { openSettings } = useSettingsUi();

  /* ------------------------------------------------------------
     REDUX STATE
     ------------------------------------------------------------ */

  // Chat-level state
  const {
    messages,        // all current chat messages rendered in panel
    isStreaming,     // whether assistant is currently streaming
    error,           // global chat error shown in snackbar
    livePipeline,    // live pipeline data while assistant is working
    liveAssistantId, // assistant message currently streaming
  } = useAppSelector((s) => s.chat);

  // Session-level state
  const {
    activeSessionId, // current selected conversation id
    sessions,        // all conversations in sidebar/session store
  } = useAppSelector((s) => s.session);

  /* ------------------------------------------------------------
     LOCAL REFS
     ------------------------------------------------------------ */

  // Scroll container ref for message area
  const scrollRef = useRef<HTMLDivElement>(null);

  // Timer ref for elapsed time updates
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Stores timestamp when current run started
  const startTimeRef = useRef(0);

  // Mutable ref that always holds the latest live pipeline snapshot
  // Helpful because websocket "done" handler may need latest value
  const livePipelineRef = useRef(livePipeline);

  /* ------------------------------------------------------------
     LOCAL UI STATE
     ------------------------------------------------------------ */

  // Whether the conversation title is being edited
  const [titleEditing, setTitleEditing] = useState(false);

  // Temporary title text while editing
  const [titleDraft, setTitleDraft] = useState("");

  /* ------------------------------------------------------------
     DERIVED VALUES
     ------------------------------------------------------------ */

  // Resolve current active title from session store.
  // If no session exists yet, show default title.
  const activeTitle = useMemo(() => {
    return sessions.find((s) => s.id === activeSessionId)?.title || "New Conversation";
  }, [sessions, activeSessionId]);

  /* ------------------------------------------------------------
     KEEP TITLE DRAFT IN SYNC
     When user is not editing, always mirror current session title
     into the input draft.
     ------------------------------------------------------------ */
  useEffect(() => {
    if (!titleEditing) {
      setTitleDraft(activeTitle);
    }
  }, [activeTitle, titleEditing]);

  /* ------------------------------------------------------------
     AUTO SCROLL
     Keep current behavior:
     whenever messages or pipeline change, scroll to bottom.
     ------------------------------------------------------------ */
  useEffect(() => {
    if (!scrollRef.current) return;

    const el = scrollRef.current;

    el.scrollTo({
      top: el.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, livePipeline, isStreaming]);

  /* ------------------------------------------------------------
     WEBSOCKET LIFECYCLE
     Connect on mount, disconnect on unmount.
     ------------------------------------------------------------ */
  useEffect(() => {
    wsService.connect();

    return () => {
      wsService.disconnect();
    };
  }, []);

  /* ------------------------------------------------------------
     PERSIST CURRENT MESSAGES INTO ACTIVE SESSION
     This keeps the session store updated with current message list.
     ------------------------------------------------------------ */
  useEffect(() => {
    if (activeSessionId && messages.length > 0) {
      dispatch(
        updateSessionMessages({
          id: activeSessionId,
          messages: [...messages],
        }),
      );
    }
  }, [messages, activeSessionId, dispatch]);

  /* ------------------------------------------------------------
     TIMER HELPERS
     These update elapsed time while assistant is processing.
     ------------------------------------------------------------ */

  // Start elapsed-time timer
  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();

    timerRef.current = setInterval(() => {
      dispatch(setElapsedTime(Date.now() - startTimeRef.current));
    }, 200);
  }, [dispatch]);

  // Stop elapsed-time timer
  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  /* ------------------------------------------------------------
     STOP CURRENT STREAM
     Used when user presses the Stop button.
     ------------------------------------------------------------ */
  const handleStop = useCallback(() => {
    // Abort websocket streaming
    wsService.abort();

    // If assistant message is currently live, mark it complete
    if (liveAssistantId) {
      dispatch(
        setMessageStatus({
          id: liveAssistantId,
          status: "complete",
        }),
      );
    }

    // Reset live state
    dispatch(setStreaming(false));
    dispatch(setPipelineStage("idle"));
    dispatch(clearLivePipeline());

    // Stop elapsed timer
    stopTimer();
  }, [dispatch, liveAssistantId, stopTimer]);

  /* ------------------------------------------------------------
     COMMIT TITLE RENAME
     Saves the edited conversation title into session store.
     ------------------------------------------------------------ */
  const commitTitle = useCallback(() => {
    // If there is no active session, just close edit mode
    if (!activeSessionId) {
      setTitleEditing(false);
      return;
    }

    // Prevent empty title
    const finalTitle = titleDraft.trim() || "Untitled chat";

    // Update session title in redux
    dispatch(
      renameSession({
        id: activeSessionId,
        title: finalTitle,
      }),
    );

    // Exit edit mode
    setTitleEditing(false);
  }, [activeSessionId, titleDraft, dispatch]);

  /* ------------------------------------------------------------
     SEND MESSAGE
     This is the most important flow:
     1. create session if needed
     2. add user message
     3. add assistant placeholder
     4. initialize pipeline
     5. listen to websocket events
     ------------------------------------------------------------ */
  const handleSend = useCallback(
    async (content: string, attachments: FileAttachment[]) => {
      // Resolve current session id
      let sessionId = activeSessionId;

      // If there is no active conversation yet, create one first
      if (!sessionId) {
        sessionId = generateId();

        dispatch(
          createSession({
            id: sessionId,
            title: content.slice(0, 50) || "New Conversation",
            createdAt: Date.now(),
            updatedAt: Date.now(),
            messages: [],
          }),
        );
      }

      // Add the user's message immediately
      dispatch(
        addMessage({
          id: generateId(),
          role: "user",
          content,
          timestamp: Date.now(),
          status: "complete",
          attachments,
        }),
      );

      // Create an assistant placeholder bubble
      // This will receive streaming content
      const assistantId = generateId();

      dispatch(
        addMessage({
          id: assistantId,
          role: "assistant",
          content: "",
          timestamp: Date.now(),
          status: "streaming",
        }),
      );

      // Build the initial pipeline state
      const initialPhases: PipelinePhase[] = PHASE_DEFS.map((phase) => ({
        ...phase,
        status: "pending",
        events: [],
      }));

      dispatch(
        initLivePipeline({
          assistantId,
          phases: initialPhases,
        }),
      );

      // Mark streaming started
      dispatch(setStreaming(true));
      dispatch(setPipelineStage("routing"));

      // Start timer
      startTimer();

      // Subscribe to websocket events for this request
      const off = wsService.on((ev: WsEvent) => {
        switch (ev.type) {
          // A major phase started
          case "phase_start":
            if (ev.phase) {
              dispatch(
                setPhaseStatus({
                  phaseKey: ev.phase,
                  status: "active",
                }),
              );
              dispatch(setPipelineStage(ev.phase));
            }
            break;

          // A detailed step inside a phase started
          case "phase_event":
            if (ev.phase && ev.eventId) {
              dispatch(
                addPhaseEvent({
                  phaseKey: ev.phase,
                  event: {
                    id: ev.eventId,
                    label: ev.label || "Step",
                    toolName: ev.toolName,
                    status: "running",
                    startedAt: Date.now(),
                    detail: "",
                  },
                }),
              );
            }
            break;

          // Append streaming detail to a phase event
          case "event_chunk":
            if (ev.phase && ev.eventId && ev.chunk) {
              dispatch(
                appendPhaseEventDetail({
                  phaseKey: ev.phase,
                  eventId: ev.eventId,
                  chunk: ev.chunk,
                }),
              );
            }
            break;

          // Mark a phase event completed
          case "event_done":
            if (ev.phase && ev.eventId) {
              dispatch(
                updatePhaseEvent({
                  phaseKey: ev.phase,
                  eventId: ev.eventId,
                  patch: {
                    status: "done",
                    endedAt: Date.now(),
                    durationMs: ev.durationMs,
                    rawOutput: ev.rawOutput,
                  },
                }),
              );
            }
            break;

          // Mark a whole phase complete
          case "phase_done":
            if (ev.phase) {
              dispatch(
                setPhaseStatus({
                  phaseKey: ev.phase,
                  status: "complete",
                }),
              );
            }
            break;

          // Assistant text token arrived
          case "token":
            if (ev.text) {
              dispatch(setPipelineStage("streaming"));
              dispatch(
                appendToMessage({
                  id: assistantId,
                  token: ev.text,
                }),
              );
            }
            break;

          // Sources/citations arrived
          case "sources":
            dispatch(
              setMessageSources({
                messageId: assistantId,
                sources: ev.sources || [],
                citations: ev.citations || [],
              }),
            );
            break;

          // Stream finished successfully
          case "done": {
            // Snapshot live pipeline onto the assistant message
            const snapshot = livePipelineRef.current;

            dispatch(
              setMessagePipeline({
                messageId: assistantId,
                pipeline: snapshot,
              }),
            );

            // Mark final assistant message complete
            dispatch(
              setMessageStatus({
                id: assistantId,
                status: "complete",
              }),
            );

            // Stop live state
            dispatch(setStreaming(false));
            dispatch(setPipelineStage("complete"));

            // Stop timer
            stopTimer();

            // Clear live pipeline shortly after completion
            setTimeout(() => {
              dispatch(clearLivePipeline());
              dispatch(setPipelineStage("idle"));
            }, 600);

            // Remove websocket listener
            off();
            break;
          }

          // Stream failed
          case "error":
            dispatch(
              setMessageStatus({
                id: assistantId,
                status: "error",
              }),
            );

            dispatch(setError(ev.message || "Stream error"));
            dispatch(setStreaming(false));
            dispatch(setPipelineStage("idle"));
            dispatch(clearLivePipeline());

            stopTimer();
            off();
            break;
        }
      });

      // Send request through websocket
      wsService.send({ content, attachments });
    },
    [activeSessionId, dispatch, startTimer, stopTimer],
  );

  /* ------------------------------------------------------------
     KEEP LIVE PIPELINE REF IN SYNC
     ------------------------------------------------------------ */
  useEffect(() => {
    livePipelineRef.current = livePipeline;
  }, [livePipeline]);

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        minWidth: 0,
        bgcolor: palette.bgChat,
      }}
    >
      {/* ======================================================
         HEADER
         Row 1 = utility actions
         Row 2 = conversation title
         ====================================================== */}
      <Box
        sx={{
          borderBottom: "1px solid",
          borderColor: palette.border,
          bgcolor: palette.bgChat,
        }}
      >
        {/* Top utility row */}
        <Box
          sx={{
            px: 2,
            py: 0.75,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            gap: 0.5,
            minHeight: 44,
          }}
        >
          {/* Theme toggle */}
          <Tooltip title={`Switch to ${mode === "light" ? "dark" : "Light"} theme`}>
            <IconButton
              size="small"
              onClick={toggle}
              sx={{ color: palette.textSecondary }}
            >
              {mode === "light" ? (
                <DarkModeOutlinedIcon sx={{ fontSize: 18 }} />
              ) : (
                <LightModeOutlinedIcon sx={{ fontSize: 18 }} />
              )}
            </IconButton>
          </Tooltip>

          {/* Settings drawer button */}
          <Tooltip title="Settings">
            <IconButton
              size="small"
              onClick={openSettings}
              sx={{ color: palette.textSecondary }}
            >
              <SettingsOutlinedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        {/* Title row only after conversation starts */}
        {messages.length > 0 && (
          <>
            <Divider sx={{ borderColor: palette.border }} />

            <Box
              sx={{
                px: 3,
                py: 1.1,
                display: "flex",
                alignItems: "center",
                minHeight: 52,
              }}
            >
              <Box sx={{ minWidth: 0, flex: 1 }}>
                {/* Editable title input */}
                {titleEditing && activeSessionId ? (
                  <TextField
                    autoFocus
                    size="small"
                    fullWidth
                    value={titleDraft}
                    onChange={(e) => setTitleDraft(e.target.value)}
                    onBlur={commitTitle}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitTitle();

                      if (e.key === "Escape") {
                        setTitleDraft(activeTitle);
                        setTitleEditing(false);
                      }
                    }}
                    placeholder="Chat name"
                    sx={{
                      maxWidth: 480,
                      "& .MuiInputBase-input": {
                        fontSize: 14,
                        fontWeight: 600,
                      },
                    }}
                  />
                ) : (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      minWidth: 0,
                      "& .chat-title-edit-btn": {
                        opacity: 0,
                        transition: "opacity 0.15s",
                      },
                      "&:hover .chat-title-edit-btn": {
                        opacity: activeSessionId ? 1 : 0,
                      },
                    }}
                  >
                    {/* Current chat title */}
                    <Typography
                      noWrap
                      sx={{
                        fontWeight: 600,
                        fontSize: 15,
                        color: palette.textPrimary,
                      }}
                    >
                      {activeTitle || "Untitled chat"}
                    </Typography>

                    {/* Rename icon */}
                    {activeSessionId && (
                      <Tooltip title="Rename chat">
                        <IconButton
                          className="chat-title-edit-btn"
                          size="small"
                          onClick={() => setTitleEditing(true)}
                          sx={{ color: palette.textSecondary }}
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                )}
              </Box>
            </Box>

            <Divider sx={{ borderColor: palette.border }} />
          </>
        )}
      </Box>

      {/* ======================================================
         BODY
         Empty state = centered hero input
         Started chat = message list
         ====================================================== */}
      {messages.length === 0 ? (
        <Box
          sx={{
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            px: { xs: 2, sm: 4 },
            py: 4,
            overflow: "auto",
          }}
        >
          {/* Empty state heading */}
          <Typography
            component="h1"
            sx={{
              fontSize: 22,
              fontWeight: 700,
              color: palette.textPrimary,
              textAlign: "center",
            }}
          >
            What can I help you with?
          </Typography>

          {/* Empty state subtitle */}
          <Typography
            sx={{
              mt: 1.5,
              color: palette.textMuted,
              maxWidth: 520,
              textAlign: "center",
              fontSize: 13,
              lineHeight: 1.6,
            }}
          >
            Paste logs, describe a ticket, or attach system outputs. I&apos;ll route
            it through the right tools and explain what I find — step by step.
          </Typography>

          {/* Centered hero-style input */}
          <Box sx={{ width: "100%", maxWidth: 860, mt: 4 }}>
            <ChatInput
              variant="hero"
              onSend={handleSend}
              disabled={isStreaming}
              isStreaming={isStreaming}
              onStop={handleStop}
              placeholder="Ask Logic Chat something..."
            />
          </Box>
        </Box>
      ) : (
        <Box
          ref={scrollRef}
          sx={{
            flex: 1,
            overflow: "auto",
            py: 2,
            px: { xs: 1.5, md: 4 },
            "&::-webkit-scrollbar": {
              width: 8,
            },
            "&::-webkit-scrollbar-thumb": {
              background: palette.scrollbarThumb,
              borderRadius: 4,
            },
          }}
        >
          {/* Render all messages */}
          {messages.map((msg, index) => {
            // Detect whether this is the last assistant message
            const isLastAssistant =
              index === messages.length - 1 && msg.role === "assistant";

            // Detect whether this message is the current live/streaming assistant
            const isLiveBubble =
              isLastAssistant && isStreaming && msg.id === liveAssistantId;

            // If assistant bubble exists but has no text yet,
            // show live pipeline panel instead
            if (isLiveBubble && msg.content.length === 0) {
              return (
                <Box
                  key={msg.id}
                  sx={{
                    display: "flex",
                    mb: 2,
                    pl: { xs: 0, md: 5.5 },
                  }}
                >
                  <Box
                    sx={{
                      width: { xs: "100%", md: "70%" },
                      maxWidth: "70%",
                    }}
                  >
                    <PipelinePanel phases={livePipeline} live compact />
                  </Box>
                </Box>
              );
            }

            // Normal message bubble
            return (
              <MessageBubble
                key={msg.id}
                message={msg}
                onRetry={
                  msg.status === "error"
                    ? () =>
                        handleSend(
                          messages[messages.length - 2]?.content || "",
                          [],
                        )
                    : undefined
                }
              />
            );
          })}
        </Box>
      )}

      {/* ======================================================
         ERROR SNACKBAR
         ====================================================== */}
      <Snackbar
        open={!!error}
        autoHideDuration={5000}
        onClose={() => dispatch(setError(null))}
      >
        <Alert severity="error" onClose={() => dispatch(setError(null))}>
          {error}
        </Alert>
      </Snackbar>

      {/* ======================================================
         FOOTER INPUT
         Show normal docked input only after chat starts.
         Keep full-width occupancy like your original code.
         ====================================================== */}
      {messages.length > 0 && (
        <Box sx={{ flexShrink: 0 }}>
          <ChatInput
            variant="footer"
            onSend={handleSend}
            disabled={isStreaming}
            isStreaming={isStreaming}
            onStop={handleStop}
            placeholder="Ask anything — paste logs, attach files, drop screenshots..."
          />
        </Box>
      )}
    </Box>
  );
};

export default ChatPanel;