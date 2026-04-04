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

const STAGES: { key: PipelineStage; label: string; icon: string }[] = [
  { key: 'routing', label: 'Routing', icon: '→' },
  { key: 'planning', label: 'Planning', icon: '◇' },
  { key: 'executing', label: 'Executing', icon: '⚡' },
  { key: 'synthesizing', label: 'Synthesizing', icon: '✦' },
];

const StepTracker: React.FC<StepTrackerProps> = ({ stage, toolName, elapsed }) => {
  const stageOrder = STAGES.map(s => s.key);
  const activeIdx = stageOrder.indexOf(stage);

  if (stage === 'idle') return null;

  return (
    <Box sx={{
      width: 220, height: '100vh', borderLeft: '1px solid', borderColor: '#2D2D2D',
      bgcolor: '#1E1E1E', p: 2, display: 'flex', flexDirection: 'column',
    }}>
      <Typography sx={{ mb: 2, color: '#666', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 600 }}>
        Pipeline
      </Typography>

      {STAGES.map((s, i) => {
        const isDone = activeIdx > i || stage === 'complete';
        const isActive = s.key === stage;

        return (
          <Box key={s.key} sx={{ display: 'flex', alignItems: 'flex-start', mb: 0.25 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mr: 1.5, minWidth: 20 }}>
              {isDone ? (
                <CheckCircleIcon sx={{ fontSize: 18, color: '#00D68F' }} />
              ) : isActive ? (
                <CircularProgress size={18} thickness={5} sx={{ color: '#007AFF' }} />
              ) : (
                <RadioButtonUncheckedIcon sx={{ fontSize: 18, color: '#444' }} />
              )}
              {i < STAGES.length - 1 && (
                <Box sx={{ width: 1.5, height: 20, bgcolor: isDone ? '#00D68F' : '#333', my: 0.25, borderRadius: 1 }} />
              )}
            </Box>
            <Box sx={{ pt: 0.1 }}>
              <Typography sx={{
                fontWeight: isActive ? 600 : 400, fontSize: 12.5,
                color: isDone ? '#00D68F' : isActive ? '#E8E8E8' : '#555',
              }}>
                {s.label}
              </Typography>
              {isActive && s.key === 'executing' && toolName && (
                <Typography sx={{ fontFamily: 'monospace', color: '#007AFF', fontSize: 10.5 }}>
                  ⚡ {toolName}
                </Typography>
              )}
            </Box>
          </Box>
        );
      })}

      {stage !== 'complete' && (
        <Box sx={{ mt: 'auto', py: 1, px: 1.5, bgcolor: '#252525', borderRadius: '6px', border: '1px solid #333' }}>
          <Typography sx={{ fontSize: 11, color: '#808080', fontFamily: 'monospace' }}>
            {formatElapsed(elapsed)}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default StepTracker;
