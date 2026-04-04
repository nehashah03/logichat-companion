import { createTheme } from '@mui/material/styles';

// Cursor AI-inspired dark theme
export const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#007AFF', light: '#4DA3FF', dark: '#0055CC' },
    secondary: { main: '#00D68F', light: '#33E0A8', dark: '#00A86B' },
    background: { default: '#1A1A1A', paper: '#252525' },
    error: { main: '#FF6B6B' },
    warning: { main: '#FFB800' },
    success: { main: '#00D68F' },
    text: { primary: '#E8E8E8', secondary: '#808080', disabled: '#4A4A4A' },
    divider: '#333333',
  },
  typography: {
    fontFamily: '"SF Mono", "JetBrains Mono", "Fira Code", monospace',
    h6: { fontFamily: '"Inter", -apple-system, sans-serif', fontWeight: 600 },
    subtitle1: { fontFamily: '"Inter", -apple-system, sans-serif' },
    subtitle2: { fontFamily: '"Inter", -apple-system, sans-serif', fontWeight: 500 },
    body1: { fontFamily: '"Inter", -apple-system, sans-serif', fontSize: '0.875rem', lineHeight: 1.6 },
    body2: { fontFamily: '"Inter", -apple-system, sans-serif', fontSize: '0.8rem' },
    button: { fontFamily: '"Inter", -apple-system, sans-serif', textTransform: 'none', fontWeight: 500 },
    caption: { fontFamily: '"Inter", -apple-system, sans-serif' },
  },
  shape: { borderRadius: 8 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: 6, padding: '6px 14px' },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: { fontSize: '0.75rem', fontFamily: '"Inter", -apple-system, sans-serif', background: '#333', border: '1px solid #444' },
      },
    },
  },
});
