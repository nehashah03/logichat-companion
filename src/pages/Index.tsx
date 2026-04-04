import React from 'react';
import { Box } from '@mui/material';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { darkTheme } from '../theme';
import { Provider } from 'react-redux';
import { store } from '../store';
import SessionSidebar from '../components/SessionSidebar';
import ChatPanel from '../components/ChatPanel';
import StepTracker from '../components/StepTracker';
import { useAppSelector } from '../store/hooks';

const AppContent: React.FC = () => {
  const { pipelineStage, currentToolName, elapsedTime } = useAppSelector(s => s.chat);

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', bgcolor: 'background.default' }}>
      <SessionSidebar />
      <ChatPanel />
      {pipelineStage !== 'idle' && (
        <StepTracker stage={pipelineStage} toolName={currentToolName} elapsed={elapsedTime} />
      )}
    </Box>
  );
};

const Index: React.FC = () => (
  <Provider store={store}>
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <AppContent />
    </ThemeProvider>
  </Provider>
);

export default Index;
