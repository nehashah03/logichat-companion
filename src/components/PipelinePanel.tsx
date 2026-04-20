import React, { useEffect, useState } from 'react';
import { Box, Typography, Collapse, IconButton, LinearProgress, CircularProgress } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CodeOutlinedIcon from '@mui/icons-material/CodeOutlined';
import { useThemeMode } from '../contexts/ThemeModeContext';
import type { PipelinePhase, PhaseEvent } from '../features/chat/chatSlice';

/**
 * Live or recorded pipeline display.
 * - Active phase auto-expands; completed phases collapse to a one-line summary.
 * - Each event shows tool name, elapsed time, streaming detail, and an
 *   expandable "raw output" section for power users.
 */

interface Props {
  phases: PipelinePhase[];
  /** When true: live streaming mode — newest active phase auto-expands. */
  live?: boolean;
  /** When true: render compactly inside the message bubble (Events panel). */
  compact?: boolean;
  defaultOpen?: boolean;
}

function formatMs(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

const EventRow: React.FC<{ event: PhaseEvent }> = ({ event }) => {
  const { palette } = useThemeMode();
  const [rawOpen, setRawOpen] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (event.status === 'running') {
      const id = setInterval(() => setNow(Date.now()), 200);
      return () => clearInterval(id);
    }
  }, [event.status]);

  const elapsed = event.endedAt
    ? event.endedAt - event.startedAt
    : event.status === 'running' ? now - event.startedAt : event.durationMs || 0;

  return (
    <Box sx={{ pl: 3, py: 0.5, borderLeft: '2px solid', borderColor: palette.border, ml: 0.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {event.status === 'running'
          ? <CircularProgress size={11} thickness={6} sx={{ color: palette.primary }} />
          : event.status === 'error'
            ? <Box sx={{ width: 11, height: 11, borderRadius: '50%', bgcolor: palette.error }} />
            : <CheckCircleIcon sx={{ fontSize: 13, color: palette.success }} />
        }
        <Typography sx={{ fontSize: 12, color: palette.textPrimary, fontWeight: 500 }}>
          {event.label}
        </Typography>
        {event.toolName && (
          <Typography sx={{ fontSize: 10.5, fontFamily: 'monospace', color: palette.primary, bgcolor: palette.primarySoft, px: 0.75, py: 0.1, borderRadius: '4px' }}>
            {event.toolName}
          </Typography>
        )}
        <Typography sx={{ fontSize: 10.5, color: palette.textMuted, ml: 'auto', fontFamily: 'monospace' }}>
          {formatMs(elapsed)}
        </Typography>
      </Box>

      {event.detail && (
        <Box sx={{
          mt: 0.5, ml: 2.25, fontFamily: 'monospace', fontSize: 11.5,
          color: palette.textSecondary, whiteSpace: 'pre-wrap',
          maxHeight: event.status === 'running' ? 120 : 80, overflow: 'auto',
          bgcolor: palette.bgCode, borderRadius: '6px', p: 0.75,
          border: '1px solid', borderColor: palette.border,
        }}>
          {event.detail}
          {event.status === 'running' && (
            <Box component="span" sx={{
              display: 'inline-block', width: 6, height: 12, bgcolor: palette.primary,
              ml: 0.25, verticalAlign: 'middle',
              animation: 'blk 1s infinite',
              '@keyframes blk': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0 } },
            }} />
          )}
        </Box>
      )}

      {event.rawOutput && event.status !== 'running' && (
        <Box sx={{ ml: 2.25, mt: 0.5 }}>
          <Box
            onClick={() => setRawOpen(o => !o)}
            sx={{
              display: 'inline-flex', alignItems: 'center', gap: 0.5, cursor: 'pointer',
              fontSize: 10.5, color: palette.textMuted, '&:hover': { color: palette.primary },
            }}
          >
            <CodeOutlinedIcon sx={{ fontSize: 12 }} />
            {rawOpen ? 'Hide raw output' : 'Show raw output'}
          </Box>
          <Collapse in={rawOpen}>
            <Box sx={{
              mt: 0.5, p: 1, bgcolor: palette.bgCode, borderRadius: '6px',
              border: '1px solid', borderColor: palette.border,
              fontFamily: 'monospace', fontSize: 11, color: palette.textSecondary,
              whiteSpace: 'pre-wrap', maxHeight: 200, overflow: 'auto',
            }}>
              {event.rawOutput}
            </Box>
          </Collapse>
        </Box>
      )}
    </Box>
  );
};

const PhaseRow: React.FC<{ phase: PipelinePhase; live: boolean; compact: boolean }> = ({ phase, live, compact }) => {
  const { palette } = useThemeMode();
  const [open, setOpen] = useState(phase.status === 'active');

  // Auto open when active, auto collapse when completed (only in live mode)
  useEffect(() => {
    if (!live) return;
    if (phase.status === 'active') setOpen(true);
    if (phase.status === 'complete') setOpen(false);
  }, [phase.status, live]);

  const Icon = phase.status === 'complete'
    ? <CheckCircleIcon sx={{ fontSize: 17, color: palette.success }} />
    : phase.status === 'active'
      ? <CircularProgress size={14} thickness={6} sx={{ color: palette.primary }} />
      : <RadioButtonUncheckedIcon sx={{ fontSize: 17, color: palette.textMuted }} />;

  const totalMs = phase.endedAt && phase.startedAt ? phase.endedAt - phase.startedAt : 0;

  return (
    <Box sx={{ mb: compact ? 0.25 : 0.5 }}>
      <Box
        onClick={() => setOpen(o => !o)}
        sx={{
          display: 'flex', alignItems: 'center', gap: 1.25, cursor: 'pointer', py: 0.5,
          opacity: phase.status === 'pending' ? 0.55 : 1,
        }}
      >
        {Icon}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{
            fontSize: 13.5, fontWeight: 600,
            color: phase.status === 'pending' ? palette.textMuted : palette.textPrimary,
          }}>
            {phase.label}
          </Typography>
          {phase.description && (
            <Typography sx={{ fontSize: 11.5, color: palette.textMuted }}>{phase.description}</Typography>
          )}
        </Box>
        {totalMs > 0 && (
          <Typography sx={{ fontSize: 10.5, color: palette.textMuted, fontFamily: 'monospace' }}>
            {formatMs(totalMs)}
          </Typography>
        )}
        {phase.events.length > 0 && (
          <IconButton size="small" sx={{ color: palette.textMuted, p: 0.25 }}>
            {open ? <ExpandLessIcon sx={{ fontSize: 16 }} /> : <ExpandMoreIcon sx={{ fontSize: 16 }} />}
          </IconButton>
        )}
      </Box>
      <Collapse in={open}>
        <Box sx={{ mt: 0.25 }}>
          {phase.events.map(ev => <EventRow key={ev.id} event={ev} />)}
        </Box>
      </Collapse>
    </Box>
  );
};

const PipelinePanel: React.FC<Props> = ({ phases, live = false, compact = false, defaultOpen = true }) => {
  const { palette } = useThemeMode();
  const [open, setOpen] = useState(defaultOpen);

  if (!phases.length) return null;

  const completed = phases.filter(p => p.status === 'complete').length;
  const total = phases.length;
  const progress = (completed / total) * 100;
  const allDone = completed === total;

  return (
    <Box sx={{
      border: '1px solid', borderColor: palette.border, borderRadius: '10px',
      bgcolor: compact ? 'transparent' : palette.bgAssistantBubble, overflow: 'hidden',
    }}>
      <Box
        onClick={() => setOpen(o => !o)}
        sx={{
          display: 'flex', alignItems: 'center', gap: 1, px: 1.5, py: 0.85, cursor: 'pointer',
          '&:hover': { bgcolor: palette.bgHover },
        }}
      >
        {open ? <ExpandLessIcon sx={{ fontSize: 16, color: palette.textMuted }} /> : <ExpandMoreIcon sx={{ fontSize: 16, color: palette.textMuted }} />}
        <Typography sx={{ fontSize: 12.5, fontWeight: 600, color: palette.textPrimary }}>
          {live && !allDone ? 'Processing' : 'Events'}
        </Typography>
        <Typography sx={{ fontSize: 11, color: palette.textMuted }}>
          · {completed}/{total} phase{total > 1 ? 's' : ''}
        </Typography>
      </Box>
      <Collapse in={open}>
        <Box sx={{ px: 1.5, pb: 1, pt: 0.5 }}>
          {phases.map(p => <PhaseRow key={p.key} phase={p} live={live} compact={compact} />)}
        </Box>
      </Collapse>
      {live && !allDone && (
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{ height: 3, bgcolor: 'transparent', '& .MuiLinearProgress-bar': { bgcolor: palette.primary } }}
        />
      )}
    </Box>
  );
};

export default PipelinePanel;
