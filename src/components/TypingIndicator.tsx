import React from 'react';
import { Box, Typography, Avatar } from '@mui/material';
import TerminalIcon from '@mui/icons-material/Terminal';

const TypingIndicator: React.FC = () => (
  <Box sx={{
    display: 'flex', gap: 1.5, px: 3, py: 1.5,
    animation: 'fadeIn 0.2s ease-out',
    '@keyframes fadeIn': { from: { opacity: 0, transform: 'translateY(4px)' }, to: { opacity: 1, transform: 'none' } },
  }}>
    <Avatar sx={{
      width: 28, height: 28, bgcolor: 'rgba(0,122,255,0.15)', color: '#007AFF',
    }}>
      <TerminalIcon sx={{ fontSize: 16 }} />
    </Avatar>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, pt: 0.5 }}>
      {[0, 1, 2].map(i => (
        <Box key={i} sx={{
          width: 5, height: 5, borderRadius: '50%', bgcolor: '#555',
          animation: 'bounce 1.4s infinite ease-in-out both',
          animationDelay: `${i * 0.16}s`,
          '@keyframes bounce': { '0%,80%,100%': { transform: 'scale(0)' }, '40%': { transform: 'scale(1)' } },
        }} />
      ))}
      <Typography sx={{ ml: 1, fontSize: 12, color: '#555' }}>Thinking...</Typography>
    </Box>
  </Box>
);

export default TypingIndicator;
