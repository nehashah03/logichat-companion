import React from 'react';
import { Box, Typography } from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';

const TypingIndicator: React.FC = () => (
  <Box sx={{
    display: 'flex', gap: 1.5, px: 3, py: 2,
    animation: 'fadeIn 0.3s ease-out',
    '@keyframes fadeIn': { from: { opacity: 0, transform: 'translateY(8px)' }, to: { opacity: 1, transform: 'none' } },
  }}>
    <Box sx={{
      width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      bgcolor: 'rgba(45,212,168,0.2)', color: 'secondary.main',
    }}>
      <SmartToyIcon sx={{ fontSize: 18 }} />
    </Box>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, pt: 1 }}>
      {[0, 1, 2].map(i => (
        <Box key={i} sx={{
          width: 7, height: 7, borderRadius: '50%', bgcolor: 'text.secondary',
          animation: 'bounce 1.4s infinite ease-in-out both',
          animationDelay: `${i * 0.16}s`,
          '@keyframes bounce': { '0%,80%,100%': { transform: 'scale(0)' }, '40%': { transform: 'scale(1)' } },
        }} />
      ))}
      <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>Thinking...</Typography>
    </Box>
  </Box>
);

export default TypingIndicator;
