import { createTheme, Theme } from '@mui/material/styles';
import { PALETTES, ThemeName, ThemePalette } from './constants/themeColors';

export function buildTheme(name: ThemeName): Theme {
  const p: ThemePalette = PALETTES[name];
  return createTheme({
    palette: {
      mode: name === 'light' ? 'light' : 'dark',
      primary: { main: p.primary, dark: p.primaryHover, contrastText: p.textOnPrimary },
      background: { default: p.bgApp, paper: p.bgChat },
      error: { main: p.error },
      warning: { main: p.warning },
      success: { main: p.success },
      text: { primary: p.textPrimary, secondary: p.textSecondary, disabled: p.textMuted },
      divider: p.border,
    },
    typography: {
      fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      h6: { fontWeight: 600 },
      body1: { fontSize: '0.875rem', lineHeight: 1.6 },
      body2: { fontSize: '0.8rem' },
      button: { textTransform: 'none', fontWeight: 500 },
    },
    shape: { borderRadius: 8 },
    components: {
      MuiButton: { styleOverrides: { root: { borderRadius: 6, padding: '6px 14px' } } },
      MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
      MuiDialog: { styleOverrides: { paper: { borderRadius: 12 } } },
      MuiCssBaseline: {
        styleOverrides: {
          '*::-webkit-scrollbar': { width: 8, height: 8 },
          '*::-webkit-scrollbar-track': { background: p.scrollbarTrack },
          '*::-webkit-scrollbar-thumb': { background: p.scrollbarThumb, borderRadius: 4 },
          'body': { background: p.bgApp, color: p.textPrimary },
        },
      },
    },
  });
}

// Back-compat for any older imports
export const lightTheme = buildTheme('light');
