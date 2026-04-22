import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { buildTheme } from '../theme';
import { PALETTES, ThemeName, ThemePalette } from '../constants/themeColors';

interface ThemeModeContextValue {
  mode: ThemeName;
  palette: ThemePalette;
  toggle: () => void;
  setMode: (m: ThemeName) => void;
}

const ThemeModeContext = createContext<ThemeModeContextValue | null>(null);

const STORAGE_KEY = 'app-theme-mode';

export const ThemeModeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mode, setModeState] = useState<ThemeName>(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v === 'light' || v === 'dark') return v;
    } catch { /* noop */ }
    return 'light';
  });

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, mode); } catch { /* noop */ }
  }, [mode]);

  const setMode = useCallback((m: ThemeName) => setModeState(m), []);
  const toggle = useCallback(() => setModeState(m => (m === 'light' ? 'dark' : 'light')), []);

  const theme = useMemo(() => buildTheme(mode), [mode]);
  const palette = PALETTES[mode];

  const value = useMemo(() => ({ mode, palette, toggle, setMode }), [mode, palette, toggle, setMode]);

  return (
    <ThemeModeContext.Provider value={value}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
};

export function useThemeMode(): ThemeModeContextValue {
  const ctx = useContext(ThemeModeContext);
  if (!ctx) throw new Error('useThemeMode must be used inside ThemeModeProvider');
  return ctx;
}
