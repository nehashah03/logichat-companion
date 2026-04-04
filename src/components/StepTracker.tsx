import React from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import type { PipelineStage } from '../features/chat/chatSlice';
import { formatElapsed } from '../utils/helpers';

interface StepTrackerProps {
  stage: PipelineStage;
  toolName: string | null;
  elapsed: number;
}

const STAGES: { key: PipelineStage; label: string }[] = [
  { key: 'routing', label: 'Routing' },
  { key: 'planning', label: 'Planning' },
  { key: 'executing', label: 'Executing' },
  { key: 'synthesizing', label: 'Synthesizing' },
];

const StepTracker: React.FC<StepTrackerProps> = ({ stage, toolName, elapsed }) => {
  const stageOrder = STAGES.map(s => s.key);
  const activeIdx = stageOrder.indexOf(stage);

  if (stage === 'idle') return null;

  return (
    <Box sx={{
      width: 240, height: '100vh', borderLeft: '1px solid', borderColor: 'divider',
      bgcolor: 'background.paper', p: 2, display: 'flex', flexDirection: 'column',
    }}>
      <Typography variant="subtitle2" sx={{ mb: 2, color: 'text.secondary', fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' }}>
        Pipeline
      </Typography>

      {STAGES.map((s, i) => {
        const isDone = activeIdx > i || stage === 'complete';
        const isActive = s.key === stage;

        return (
          <Box key={s.key} sx={{ display: 'flex', alignItems: 'flex-start', mb: 0.5 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mr: 1.5, minWidth: 24 }}>
              {isDone ? (
                <CheckCircleIcon sx={{ fontSize: 20, color: 'secondary.main' }} />
              ) : isActive ? (
                <CircularProgress size={20} thickness={5} sx={{ color: 'primary.main' }} />
              ) : (
                <RadioButtonUncheckedIcon sx={{ fontSize: 20, color: 'text.disabled' }} />
              )}
              {i < STAGES.length - 1 && (
                <Box sx={{ width: 2, height: 24, bgcolor: isDone ? 'secondary.main' : 'divider', my: 0.5, borderRadius: 1 }} />
              )}
            </Box>
            <Box sx={{ pt: 0.25 }}>
              <Typography variant="body2" sx={{
                fontWeight: isActive ? 600 : 400,
                color: isDone ? 'secondary.main' : isActive ? 'text.primary' : 'text.disabled',
              }}>
                {s.label}
              </Typography>
              {isActive && s.key === 'executing' && toolName && (
                <Typography variant="caption" sx={{ fontFamily: 'monospace', color: 'primary.main', fontSize: 11 }}>
                  {toolName}
                </Typography>
              )}
            </Box>
          </Box>
        );
      })}

      {stage !== 'idle' && stage !== 'complete' && (
        <Box sx={{ mt: 'auto', p: 1.5, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            Elapsed: {formatElapsed(elapsed)}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default StepTracker;
