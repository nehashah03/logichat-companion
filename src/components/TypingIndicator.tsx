import React from 'react';
import { Box, Typography, Avatar } from '@mui/material';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';

const TypingIndicator: React.FC = () => (
  <Box sx={{
    display: 'flex', gap: 1.5, px: 3, py: 1.5,
    animation: 'fadeIn 0.2s ease-out',
    '@keyframes fadeIn': { from: { opacity: 0, transform: 'translateY(4px)' }, to: { opacity: 1, transform: 'none' } },
  }}>
    <Avatar sx={{ width: 28, height: 28, bgcolor: '#E3F2FD', color: '#1976d2' }}>
      <SmartToyOutlinedIcon sx={{ fontSize: 16 }} />
    </Avatar>
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, pt: 0.5 }}>
      {[0, 1, 2].map(i => (
        <Box key={i} sx={{
          width: 6, height: 6, borderRadius: '50%', bgcolor: '#bbb',
          animation: 'bounce 1.4s infinite ease-in-out both',
          animationDelay: `${i * 0.16}s`,
          '@keyframes bounce': { '0%,80%,100%': { transform: 'scale(0)' }, '40%': { transform: 'scale(1)' } },
        }} />
      ))}
      <Typography sx={{ ml: 1, fontSize: 12, color: '#999' }}>Thinking...</Typography>
    </Box>
  </Box>
);

export default TypingIndicator;
