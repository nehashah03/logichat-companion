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
  InputAdornment,
} from "@mui/material";

import DarkModeOutlinedIcon from "@mui/icons-material/DarkModeOutlined";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";

import { useAppDispatch, useAppSelector } from "../store/hooks";

import {
  addMessage,
  setMessageStatus,
  setStreaming,
  setPipelineStage,
  setElapsedTime,
  setError,
  clearLivePipeline,
  initLivePipeline,
  applyBackendEvent,
} from "../features/chat/chatSlice";

import {
  createSession,
  updateSessionMessages,
  renameSession,
} from "../features/session/sessionSlice";

import { wsService, WsEvent } from "../services/websocket";
import { generateId } from "../utils/helpers";

import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import PipelinePanel from "./PipelinePanel";

import { useThemeMode } from "../contexts/ThemeModeContext";
import { useSettingsUi } from "../contexts/SettingsUiContext";

import type { FileAttachment } from "../features/chat/chatSlice";

const ChatPanel: React.FC = () => {
  const dispatch = useAppDispatch();

  const { palette, mode, toggle } = useThemeMode();
  const { openSettings } = useSettingsUi();

  const {
    messages,
    isStreaming,
    error,
    livePipeline,
    liveAssistantId,
    liveTurnId,
  } = useAppSelector((state) => state.chat);

  const { activeSessionId, sessions } = useAppSelector((state) => state.session);

  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(0);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const [titleEditing, setTitleEditing] = useState(false);
  const [titleDraft, setTitleDraft] = useState("");
  const [chatSearch, setChatSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const activeTitle = useMemo(() => {
    return (
      sessions.find((session) => session.id === activeSessionId)?.title ||
      "New Conversation"
    );
  }, [sessions, activeSessionId]);

  useEffect(() => {
    if (!titleEditing) {
      setTitleDraft(activeTitle);
    }
  }, [activeTitle, titleEditing]);

  useEffect(() => {
    wsService.connect();

    return () => {
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
      wsService.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!scrollRef.current) return;

    scrollRef.current.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, livePipeline, isStreaming]);

  useEffect(() => {
    if (!activeSessionId || messages.length === 0) return;

    dispatch(
      updateSessionMessages({
        id: activeSessionId,
        messages: [...messages],
      }),
    );
  }, [activeSessionId, messages, dispatch]);

  const startTimer = useCallback(() => {
    startTimeRef.current = Date.now();

    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      dispatch(setElapsedTime(Date.now() - startTimeRef.current));
    }, 200);
  }, [dispatch]);

  const stopTimer = useCallback(() => {
    if (!timerRef.current) return;

    clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  const commitTitle = useCallback(() => {
    if (!activeSessionId) {
      setTitleEditing(false);
      return;
    }

    dispatch(
      renameSession({
        id: activeSessionId,
        title: titleDraft.trim() || "Untitled chat",
      }),
    );

    setTitleEditing(false);
  }, [activeSessionId, titleDraft, dispatch]);

  const handleStop = useCallback(() => {
    if (liveTurnId) {
      wsService.cancel(liveTurnId);
    }

    if (liveAssistantId) {
      dispatch(
        setMessageStatus({
          id: liveAssistantId,
          status: "cancelled",
        }),
      );
    }

    dispatch(setStreaming(false));
    dispatch(setPipelineStage("cancelled"));
    stopTimer();
  }, [dispatch, liveAssistantId, liveTurnId, stopTimer]);

  const handleSend = useCallback(
    async (content: string, attachments: FileAttachment[] = []) => {
      const cleanContent = content.trim();

      if (!cleanContent) return;

      let sessionId = activeSessionId;

      if (!sessionId) {
        sessionId = generateId();

        dispatch(
          createSession({
            id: sessionId,
            title: cleanContent.slice(0, 50) || "New Conversation",
            createdAt: Date.now(),
            updatedAt: Date.now(),
            messages: [],
            favorite: false,
          }),
        );
      }

      const turnId = generateId();
      const userMessageId = generateId();
      const assistantId = generateId();

      unsubscribeRef.current?.();
      unsubscribeRef.current = null;

      dispatch(
        addMessage({
          id: userMessageId,
          role: "user",
          content: cleanContent,
          timestamp: Date.now(),
          status: "complete",
          attachments,
        }),
      );

      dispatch(
        addMessage({
          id: assistantId,
          role: "assistant",
          content: "",
          timestamp: Date.now(),
          status: "streaming",
          retryQuery: cleanContent,
        }),
      );

      dispatch(
        initLivePipeline({
          assistantId,
          turnId,
          phases: [],
        }),
      );

      dispatch(setStreaming(true));
      dispatch(setPipelineStage("streaming"));
      dispatch(setError(null));

      startTimer();

      if (!wsService.isReady()) {
        const message = "WebSocket is not connected. Please retry.";

        dispatch(setError(message));
        dispatch(
          setMessageStatus({
            id: assistantId,
            status: "error",
            error: message,
            retryQuery: cleanContent,
          }),
        );
        dispatch(setStreaming(false));
        dispatch(setPipelineStage("error"));
        stopTimer();
        return;
      }

      unsubscribeRef.current = wsService.on(sessionId, (event: WsEvent) => {
        dispatch(
          applyBackendEvent({
            event,
            assistantId,
            retryQuery: cleanContent,
          }),
        );

        if (
          event.type === "done" ||
          event.type === "error" ||
          event.type === "cancelled"
        ) {
          stopTimer();

          if (event.type === "error") {
            dispatch(setError(event.message || "Streaming failed"));
          }

          unsubscribeRef.current?.();
          unsubscribeRef.current = null;

          setTimeout(() => {
            dispatch(clearLivePipeline());
            dispatch(setPipelineStage("idle"));
          }, 800);
        }
      });

      try {
        wsService.send({
          sessionId,
          turnId,
          content: cleanContent,
          attachments: attachments.map((file) => ({
            name: file.name,
            size: file.size,
            type: file.type,
          })),
        });
      } catch {
        const message = "Unable to start stream. Please retry.";

        unsubscribeRef.current?.();
        unsubscribeRef.current = null;

        dispatch(setError(message));
        dispatch(
          setMessageStatus({
            id: assistantId,
            status: "error",
            error: message,
            retryQuery: cleanContent,
          }),
        );
        dispatch(setStreaming(false));
        dispatch(setPipelineStage("error"));
        stopTimer();
      }
    },
    [activeSessionId, dispatch, startTimer, stopTimer],
  );

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
      <Box
        sx={{
          borderBottom: "1px solid",
          borderColor: palette.border,
          bgcolor: palette.bgChat,
        }}
      >
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
          <Tooltip title={`Switch to ${mode === "light" ? "dark" : "light"} theme`}>
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

          {messages.length > 0 &&
            (searchOpen ? (
              <TextField
                size="small"
                autoFocus
                placeholder="Search this chat…"
                value={chatSearch}
                onChange={(event) => setChatSearch(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    setChatSearch("");
                    setSearchOpen(false);
                  }
                }}
                sx={{
                  width: 240,
                  "& .MuiInputBase-root": {
                    fontSize: 13,
                    bgcolor: palette.bgInput,
                    color: palette.textPrimary,
                  },
                  "& fieldset": { borderColor: palette.border },
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon
                        sx={{ fontSize: 16, color: palette.textMuted }}
                      />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        size="small"
                        onClick={() => {
                          setChatSearch("");
                          setSearchOpen(false);
                        }}
                        sx={{ color: palette.textMuted }}
                      >
                        <CloseIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            ) : (
              <Tooltip title="Search in this chat">
                <IconButton
                  size="small"
                  onClick={() => setSearchOpen(true)}
                  sx={{ color: palette.textSecondary }}
                >
                  <SearchIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            ))}

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
                {titleEditing && activeSessionId ? (
                  <TextField
                    autoFocus
                    size="small"
                    fullWidth
                    value={titleDraft}
                    onChange={(event) => setTitleDraft(event.target.value)}
                    onBlur={commitTitle}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") commitTitle();

                      if (event.key === "Escape") {
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
            it through backend tools and stream the reasoning steps.
          </Typography>

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
            "&::-webkit-scrollbar": { width: 8 },
            "&::-webkit-scrollbar-thumb": {
              background: palette.scrollbarThumb,
              borderRadius: 4,
            },
          }}
        >
          {messages.map((message, index) => {
            const isLastAssistant =
              index === messages.length - 1 && message.role === "assistant";

            const isLiveBubble =
              isLastAssistant &&
              isStreaming &&
              message.id === liveAssistantId;

            if (isLiveBubble && message.content.length === 0) {
              return (
                <Box
                  key={message.id}
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

            return (
              <MessageBubble
                key={message.id}
                message={message}
                searchQuery={chatSearch}
                onRetry={
                  message.status === "error" && message.retryQuery
                    ? () => handleSend(message.retryQuery || "", [])
                    : undefined
                }
              />
            );
          })}
        </Box>
      )}

      <Snackbar
        open={!!error}
        autoHideDuration={5000}
        onClose={() => dispatch(setError(null))}
      >
        <Alert severity="error" onClose={() => dispatch(setError(null))}>
          {error}
        </Alert>
      </Snackbar>

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