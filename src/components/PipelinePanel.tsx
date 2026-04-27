import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Collapse,
  IconButton,
  LinearProgress,
  CircularProgress,
  Tooltip,
} from "@mui/material";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import RadioButtonUncheckedIcon from "@mui/icons-material/RadioButtonUnchecked";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import CodeOutlinedIcon from "@mui/icons-material/CodeOutlined";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

import { useThemeMode } from "../contexts/ThemeModeContext";
import type { PipelinePhase, PhaseEvent } from "../features/chat/chatSlice";

interface Props {
  phases?: PipelinePhase[];
  live?: boolean;
  compact?: boolean;
  defaultOpen?: boolean;
}

function formatMs(ms: number) {
  if (!Number.isFinite(ms) || ms <= 0) return "0ms";
  if (ms < 1000) return `${Math.round(ms)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function safeEvents(phase: PipelinePhase): PhaseEvent[] {
  return Array.isArray(phase.events) ? phase.events : [];
}

function getPhaseProgress(phases: PipelinePhase[]) {
  if (!phases.length) return 0;

  const completed = phases.filter(
    (phase) => phase.status === "complete",
  ).length;

  return Math.round((completed / phases.length) * 100);
}

const EventRow: React.FC<{ event: PhaseEvent }> = ({ event }) => {
  const { palette } = useThemeMode();

  const [rawOpen, setRawOpen] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (event.status !== "running") return;

    const id = setInterval(() => {
      setNow(Date.now());
    }, 200);

    return () => clearInterval(id);
  }, [event.status]);

  const elapsed = event.endedAt
    ? event.endedAt - event.startedAt
    : event.status === "running"
      ? now - event.startedAt
      : event.durationMs || 0;

  const isError = event.status === "error";
  const isRunning = event.status === "running";

  return (
    <Box
      sx={{
        pl: 3,
        py: 0.5,
        borderLeft: "2px solid",
        borderColor: isError ? palette.error : palette.border,
        ml: 0.5,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        {isRunning ? (
          <CircularProgress
            size={11}
            thickness={6}
            sx={{ color: palette.primary }}
          />
        ) : isError ? (
          <ErrorOutlineIcon sx={{ fontSize: 14, color: palette.error }} />
        ) : (
          <CheckCircleIcon sx={{ fontSize: 13, color: palette.success }} />
        )}

        <Typography
          sx={{
            fontSize: 12,
            color: isError ? palette.error : palette.textPrimary,
            fontWeight: 500,
          }}
        >
          {event.label || "Step"}
        </Typography>

        {event.toolName && (
          <Typography
            sx={{
              fontSize: 10.5,
              fontFamily: "monospace",
              color: palette.primary,
              bgcolor: palette.primarySoft,
              px: 0.75,
              py: 0.1,
              borderRadius: "4px",
              maxWidth: 180,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {event.toolName}
          </Typography>
        )}

        <Typography
          sx={{
            fontSize: 10.5,
            color: palette.textMuted,
            ml: "auto",
            fontFamily: "monospace",
            flexShrink: 0,
          }}
        >
          {formatMs(elapsed)}
        </Typography>
      </Box>

      {event.detail && (
        <Box
          sx={{
            mt: 0.5,
            ml: 2.25,
            fontFamily: "monospace",
            fontSize: 11.5,
            color: palette.textSecondary,
            whiteSpace: "pre-wrap",
            maxHeight: isRunning ? 120 : 80,
            overflow: "auto",
            bgcolor: palette.bgCode,
            borderRadius: "6px",
            p: 0.75,
            border: "1px solid",
            borderColor: isError ? palette.error : palette.border,
          }}
        >
          {event.detail}

          {isRunning && (
            <Box
              component="span"
              sx={{
                display: "inline-block",
                width: 6,
                height: 12,
                bgcolor: palette.primary,
                ml: 0.25,
                verticalAlign: "middle",
                animation: "pipelineBlink 1s infinite",
                "@keyframes pipelineBlink": {
                  "0%,100%": { opacity: 1 },
                  "50%": { opacity: 0 },
                },
              }}
            />
          )}
        </Box>
      )}

      {event.rawOutput && !isRunning && (
        <Box sx={{ ml: 2.25, mt: 0.5 }}>
          <Box
            onClick={() => setRawOpen((open) => !open)}
            sx={{
              display: "inline-flex",
              alignItems: "center",
              gap: 0.5,
              cursor: "pointer",
              fontSize: 10.5,
              color: palette.textMuted,
              "&:hover": { color: palette.primary },
            }}
          >
            <CodeOutlinedIcon sx={{ fontSize: 12 }} />
            {rawOpen ? "Hide raw output" : "Show raw output"}
          </Box>

          <Collapse in={rawOpen}>
            <Box
              sx={{
                mt: 0.5,
                p: 1,
                bgcolor: palette.bgCode,
                borderRadius: "6px",
                border: "1px solid",
                borderColor: palette.border,
                fontFamily: "monospace",
                fontSize: 11,
                color: palette.textSecondary,
                whiteSpace: "pre-wrap",
                maxHeight: 200,
                overflow: "auto",
              }}
            >
              {event.rawOutput}
            </Box>
          </Collapse>
        </Box>
      )}
    </Box>
  );
};

const PhaseRow: React.FC<{
  phase: PipelinePhase;
  live: boolean;
  compact: boolean;
}> = ({ phase, live, compact }) => {
  const { palette } = useThemeMode();

  /**
   * Defensive fallback:
   * backend/persisted pipeline phases should include `events: []`,
   * but older saved data or partial stream state may not have it.
   */
  const events = safeEvents(phase);
  const hasEvents = events.length > 0;

  const [open, setOpen] = useState(
    phase.status === "active" || phase.status === "error",
  );

  useEffect(() => {
    if (!live) return;

    if (phase.status === "active" || phase.status === "error") {
      setOpen(true);
    }

    if (phase.status === "complete") {
      setOpen(false);
    }
  }, [phase.status, live]);

  const isComplete = phase.status === "complete";
  const isActive = phase.status === "active";
  const isError = phase.status === "error";
  const isPending = phase.status === "pending";

  const phaseIcon = isComplete ? (
    <CheckCircleIcon sx={{ fontSize: 17, color: palette.success }} />
  ) : isActive ? (
    <CircularProgress size={14} thickness={6} sx={{ color: palette.primary }} />
  ) : isError ? (
    <ErrorOutlineIcon sx={{ fontSize: 17, color: palette.error }} />
  ) : (
    <RadioButtonUncheckedIcon sx={{ fontSize: 17, color: palette.textMuted }} />
  );

  const totalMs =
    phase.endedAt && phase.startedAt ? phase.endedAt - phase.startedAt : 0;

  return (
    <Box sx={{ mb: compact ? 0.25 : 0.5 }}>
      <Box
        onClick={() => {
          if (hasEvents) {
            setOpen((value) => !value);
          }
        }}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1.25,
          cursor: hasEvents ? "pointer" : "default",
          py: 0.5,
          opacity: isPending ? 0.55 : 1,
        }}
      >
        {phaseIcon}

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography
            sx={{
              fontSize: 13.5,
              fontWeight: 600,
              color: isError
                ? palette.error
                : isPending
                  ? palette.textMuted
                  : palette.textPrimary,
            }}
          >
            {phase.label || phase.key || "Phase"}
          </Typography>

          {phase.description && (
            <Typography
              sx={{
                fontSize: 11.5,
                color: palette.textMuted,
              }}
            >
              {phase.description}
            </Typography>
          )}
        </Box>

        {totalMs > 0 && (
          <Typography
            sx={{
              fontSize: 10.5,
              color: palette.textMuted,
              fontFamily: "monospace",
              flexShrink: 0,
            }}
          >
            {formatMs(totalMs)}
          </Typography>
        )}

        {hasEvents && (
          <IconButton size="small" sx={{ color: palette.textMuted, p: 0.25 }}>
            {open ? (
              <ExpandLessIcon sx={{ fontSize: 16 }} />
            ) : (
              <ExpandMoreIcon sx={{ fontSize: 16 }} />
            )}
          </IconButton>
        )}
      </Box>

      {hasEvents && (
        <Collapse in={open}>
          <Box sx={{ mt: 0.25 }}>
            {events.map((event, index) => (
              <EventRow key={event.id || `${phase.key}-${index}`} event={event} />
            ))}
          </Box>
        </Collapse>
      )}
    </Box>
  );
};

const PipelinePanel: React.FC<Props> = ({
  phases,
  live = false,
  compact = false,
  defaultOpen = true,
}) => {
  const { palette } = useThemeMode();

  const [open, setOpen] = useState(defaultOpen);

  /**
   * Defensive fallback:
   * prevents crashes if parent passes undefined/null.
   */
  const safePhases = Array.isArray(phases) ? phases : [];

  if (!safePhases.length) return null;

  const completed = safePhases.filter(
    (phase) => phase.status === "complete",
  ).length;

  const hasError = safePhases.some((phase) => phase.status === "error");
  const hasActive = safePhases.some((phase) => phase.status === "active");

  const total = safePhases.length;
  const progress = getPhaseProgress(safePhases);
  const allDone = completed === total && total > 0;

  const title = live && !allDone ? "Processing" : "Events";

  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: hasError ? palette.error : palette.border,
        borderRadius: "10px",
        bgcolor: compact ? "transparent" : palette.bgAssistantBubble,
        overflow: "hidden",
      }}
    >
      <Box
        onClick={() => setOpen((value) => !value)}
        sx={{
          display: "flex",
          alignItems: "center",
          gap: 1,
          px: 1.5,
          py: 0.85,
          cursor: "pointer",
          "&:hover": { bgcolor: palette.bgHover },
        }}
      >
        {open ? (
          <ExpandLessIcon sx={{ fontSize: 16, color: palette.textMuted }} />
        ) : (
          <ExpandMoreIcon sx={{ fontSize: 16, color: palette.textMuted }} />
        )}

        <Typography
          sx={{
            fontSize: 12.5,
            fontWeight: 600,
            color: hasError ? palette.error : palette.textPrimary,
          }}
        >
          {title}
        </Typography>

        <Typography sx={{ fontSize: 11, color: palette.textMuted }}>
          · {completed}/{total} phase{total > 1 ? "s" : ""}
        </Typography>

        {hasActive && live && (
          <Tooltip title="Backend is streaming events">
            <CircularProgress
              size={12}
              thickness={6}
              sx={{ color: palette.primary, ml: "auto" }}
            />
          </Tooltip>
        )}
      </Box>

      <Collapse in={open}>
        <Box sx={{ px: 1.5, pb: 1, pt: 0.5 }}>
          {safePhases.map((phase, index) => (
            <PhaseRow
              key={phase.key || `phase-${index}`}
              phase={phase}
              live={live}
              compact={compact}
            />
          ))}
        </Box>
      </Collapse>

      {live && !allDone && !hasError && (
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            height: 3,
            bgcolor: "transparent",
            "& .MuiLinearProgress-bar": {
              bgcolor: palette.primary,
            },
          }}
        />
      )}
    </Box>
  );
};

export default PipelinePanel;