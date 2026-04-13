import React from 'react';
import { Box, Typography, CircularProgress, Collapse } from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import type { ProcessingStep } from '../features/chat/chatSlice';

interface ProcessingStepsProps {
  steps: ProcessingStep[];
  isLive: boolean;
}

const ProcessingSteps: React.FC<ProcessingStepsProps> = ({ steps, isLive }) => {
  if (!steps || steps.length === 0) return null;

  return (
    <Box sx={{ my: 1.5 }}>
      {steps.map((step) => (
        <Box key={step.id} sx={{ display: 'flex', alignItems: 'flex-start', mb: 0.75 }}>
          <Box sx={{ mr: 1.5, mt: 0.25, minWidth: 20, display: 'flex', justifyContent: 'center' }}>
            {step.status === 'complete' ? (
              <CheckCircleIcon sx={{ fontSize: 18, color: '#2e7d32' }} />
            ) : step.status === 'active' ? (
              <CircularProgress size={16} thickness={5} sx={{ color: '#1976d2' }} />
            ) : (
              <RadioButtonUncheckedIcon sx={{ fontSize: 18, color: '#ccc' }} />
            )}
          </Box>
          <Box>
            <Typography sx={{
              fontSize: 13,
              fontWeight: step.status === 'active' ? 600 : 400,
              color: step.status === 'complete' ? '#2e7d32' : step.status === 'active' ? '#1a1a1a' : '#999',
            }}>
              {step.label}
            </Typography>
            {(step.status === 'active' || step.status === 'complete') && (
              <Typography sx={{ fontSize: 11.5, color: '#888', mt: 0.1 }}>
                {step.description}
              </Typography>
            )}
          </Box>
        </Box>
      ))}
    </Box>
  );
};

export default ProcessingSteps;
