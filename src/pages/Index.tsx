import React from 'react';
import { Box } from '@mui/material';
import { Provider } from 'react-redux';
import { store } from '../store';
import SessionSidebar from '../components/SessionSidebar';
import ChatPanel from '../components/ChatPanel';
import { ThemeModeProvider, useThemeMode } from '../contexts/ThemeModeContext';
import { SettingsUiProvider } from "../contexts/SettingsUiContext";

const AppContent: React.FC = () => {
  const { palette } = useThemeMode();
  return (
    <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden', bgcolor: palette.bgApp }}>
      <SessionSidebar />
      <ChatPanel />
    </Box>
  );
};

const Index: React.FC = () => (
  <Provider store={store}>
    <ThemeModeProvider>
      <SettingsUiProvider>
      <AppContent />
      </SettingsUiProvider>
    </ThemeModeProvider>
  </Provider>
);

export default Index;
