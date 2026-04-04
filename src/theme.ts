import { createTheme } from '@mui/material/styles';

export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#6C8EEF', light: '#8FAAFF', dark: '#4A6CD4' },
    secondary: { main: '#2DD4A8', light: '#5EEDC4', dark: '#1BA882' },
    background: { default: '#0B0F1A', paper: '#111827' },
    error: { main: '#F87171' },
    warning: { main: '#FBBF24' },
    success: { main: '#34D399' },
    text: { primary: '#E2E8F0', secondary: '#94A3B8', disabled: '#475569' },
    divider: '#1E293B',
  },
  typography: {
    fontFamily: '"JetBrains Mono", "Fira Code", "SF Mono", monospace',
    h6: { fontFamily: '"Inter", "SF Pro Display", sans-serif', fontWeight: 600 },
    subtitle1: { fontFamily: '"Inter", sans-serif' },
    subtitle2: { fontFamily: '"Inter", sans-serif', fontWeight: 500 },
    body1: { fontFamily: '"Inter", sans-serif', fontSize: '0.9rem', lineHeight: 1.7 },
    body2: { fontFamily: '"Inter", sans-serif', fontSize: '0.8rem' },
    button: { fontFamily: '"Inter", sans-serif', textTransform: 'none', fontWeight: 500 },
    caption: { fontFamily: '"Inter", sans-serif' },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 8, padding: '8px 16px' },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { fontSize: '0.75rem', fontFamily: '"Inter", sans-serif' },
      },
    },
  },
});
