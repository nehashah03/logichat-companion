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
  { key: 'analyzing', label: 'Analyzing Query' },
  { key: 'searching', label: 'Searching Documents' },
  { key: 'extracting', label: 'Extracting Details' },
  { key: 'generating', label: 'Generating Response' },
];

const StepTracker: React.FC<StepTrackerProps> = ({ stage, toolName, elapsed }) => {
  const stageOrder = STAGES.map(s => s.key);
  const activeIdx = stageOrder.indexOf(stage);

  if (stage === 'idle') return null;

  return (
    <Box sx={{
      width: 220, height: '100vh', borderLeft: '1px solid', borderColor: '#E5E7EB',
      bgcolor: '#F9FAFB', p: 2, display: 'flex', flexDirection: 'column',
    }}>
      <Typography sx={{ mb: 2, color: '#999', fontSize: 10, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 600 }}>
        Pipeline
      </Typography>

      {STAGES.map((s, i) => {
        const isDone = activeIdx > i || stage === 'complete';
        const isActive = s.key === stage;

        return (
          <Box key={s.key} sx={{ display: 'flex', alignItems: 'flex-start', mb: 0.25 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mr: 1.5, minWidth: 20 }}>
              {isDone ? (
                <CheckCircleIcon sx={{ fontSize: 18, color: '#2e7d32' }} />
              ) : isActive ? (
                <CircularProgress size={18} thickness={5} sx={{ color: '#1976d2' }} />
              ) : (
                <RadioButtonUncheckedIcon sx={{ fontSize: 18, color: '#ddd' }} />
              )}
              {i < STAGES.length - 1 && (
                <Box sx={{ width: 1.5, height: 20, bgcolor: isDone ? '#2e7d32' : '#E5E7EB', my: 0.25, borderRadius: 1 }} />
              )}
            </Box>
            <Box sx={{ pt: 0.1 }}>
              <Typography sx={{
                fontWeight: isActive ? 600 : 400, fontSize: 12.5,
                color: isDone ? '#2e7d32' : isActive ? '#333' : '#bbb',
              }}>
                {s.label}
              </Typography>
              {isActive && toolName && (
                <Typography sx={{ color: '#1976d2', fontSize: 10.5 }}>
                  {toolName}
                </Typography>
              )}
            </Box>
          </Box>
        );
      })}

      {stage !== 'complete' && (
        <Box sx={{ mt: 'auto', py: 1, px: 1.5, bgcolor: '#F3F4F6', borderRadius: '6px', border: '1px solid #E5E7EB' }}>
          <Typography sx={{ fontSize: 11, color: '#666', fontFamily: 'monospace' }}>
            {formatElapsed(elapsed)}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default StepTracker;
