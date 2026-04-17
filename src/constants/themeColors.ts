// =============================================================
// THEME COLOR CONSTANTS
// Two themes supported: "light" and "midnight" (Midnight Blue dark)
// Edit values here to recolor the entire app.
// =============================================================

export type ThemeName = 'light' | 'midnight';

export interface ThemePalette {
  // Surfaces
  bgApp: string;          // outer-most background
  bgSidebar: string;      // sidebar surface
  bgChat: string;         // chat panel surface
  bgInput: string;        // input box background
  bgHover: string;        // hover state
  bgSelected: string;     // selected list item
  bgUserBubble: string;   // user message bubble
  bgAssistantBubble: string; // assistant message bubble
  bgCodeHeader: string;
  bgCode: string;

  // Borders / dividers
  border: string;
  borderStrong: string;

  // Text
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textOnPrimary: string;

  // Accents
  primary: string;
  primaryHover: string;
  primarySoft: string;     // tinted background using primary
  userAccent: string;      // user message accent
  assistantAccent: string; // assistant message accent

  // Status
  success: string;
  warning: string;
  error: string;
  errorSoft: string;

  // Misc
  scrollbarThumb: string;
  scrollbarTrack: string;
}

// ---------- LIGHT ----------
export const LIGHT: ThemePalette = {
  bgApp: '#FFFFFF',
  bgSidebar: '#F7F8FA',
  bgChat: '#FFFFFF',
  bgInput: '#F4F6F8',
  bgHover: 'rgba(0,0,0,0.04)',
  bgSelected: 'rgba(25,118,210,0.10)',
  bgUserBubble: '#E8F1FF',
  bgAssistantBubble: '#F4F6F8',
  bgCodeHeader: '#EEF1F4',
  bgCode: '#FAFBFC',

  border: '#E5E7EB',
  borderStrong: '#D1D5DB',

  textPrimary: '#1A1A1A',
  textSecondary: '#4B5563',
  textMuted: '#9CA3AF',
  textOnPrimary: '#FFFFFF',

  primary: '#1976D2',
  primaryHover: '#1565C0',
  primarySoft: '#E3F2FD',
  userAccent: '#1976D2',
  assistantAccent: '#6B7280',

  success: '#2E7D32',
  warning: '#ED6C02',
  error: '#D32F2F',
  errorSoft: '#FDECEA',

  scrollbarThumb: '#CBD5E1',
  scrollbarTrack: 'transparent',
};

// ---------- MIDNIGHT BLUE (dark) ----------
export const MIDNIGHT: ThemePalette = {
  bgApp: '#0B1020',
  bgSidebar: '#0F1730',
  bgChat: '#0B1020',
  bgInput: '#172041',
  bgHover: 'rgba(255,255,255,0.06)',
  bgSelected: 'rgba(96,165,250,0.18)',
  bgUserBubble: '#1B2A55',
  bgAssistantBubble: '#131C3A',
  bgCodeHeader: '#0F1730',
  bgCode: '#0A1126',

  border: '#1E2A4A',
  borderStrong: '#2A3A65',

  textPrimary: '#E6EAF5',
  textSecondary: '#A6B0CF',
  textMuted: '#6B7796',
  textOnPrimary: '#0B1020',

  primary: '#60A5FA',
  primaryHover: '#3B82F6',
  primarySoft: 'rgba(96,165,250,0.14)',
  userAccent: '#60A5FA',
  assistantAccent: '#94A3B8',

  success: '#4ADE80',
  warning: '#FBBF24',
  error: '#F87171',
  errorSoft: 'rgba(248,113,113,0.15)',

  scrollbarThumb: '#2A3A65',
  scrollbarTrack: 'transparent',
};

export const PALETTES: Record<ThemeName, ThemePalette> = {
  light: LIGHT,
  midnight: MIDNIGHT,
};

export const THEME_LABELS: Record<ThemeName, string> = {
  light: 'Light',
  midnight: 'Midnight Blue',
};
