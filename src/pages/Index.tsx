import React from 'react';
import { Box } from '@mui/material';
import { Provider } from 'react-redux';
import { store } from '../store';
import SessionSidebar from '../components/SessionSidebar';
import ChatPanel from '../components/ChatPanel';
import StepTracker from '../components/StepTracker';
import { useAppSelector } from '../store/hooks';
import { ThemeModeProvider, useThemeMode } from '../contexts/ThemeModeContext';

const AppContent: React.FC = () => {
  const { pipelineStage, currentToolName, elapsedTime } = useAppSelector(s => s.chat);
  const { palette } = useThemeMode();

  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', bgcolor: palette.bgApp }}>
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
    <ThemeModeProvider>
      <AppContent />
    </ThemeModeProvider>
  </Provider>
);

export default Index;
