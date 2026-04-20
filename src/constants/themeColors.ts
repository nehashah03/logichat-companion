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
  // Deep navy inspired by the reference dashboard screenshot
  bgApp: '#070B1A',
  bgSidebar: '#0A1024',
  bgChat: '#070B1A',
  bgInput: '#0F1733',
  bgHover: 'rgba(96,165,250,0.08)',
  bgSelected: 'rgba(96,165,250,0.16)',
  bgUserBubble: '#142046',
  bgAssistantBubble: '#0D1530',
  bgCodeHeader: '#0C142C',
  bgCode: '#060A18',

  border: 'rgba(96,165,250,0.14)',
  borderStrong: 'rgba(96,165,250,0.28)',

  textPrimary: '#EAEFFB',
  textSecondary: '#A6B0CF',
  textMuted: '#6A7494',
  textOnPrimary: '#06091A',

  primary: '#3B82F6',
  primaryHover: '#60A5FA',
  primarySoft: 'rgba(59,130,246,0.16)',
  userAccent: '#7DA8FF',
  assistantAccent: '#94A3B8',

  success: '#34D399',
  warning: '#FBBF24',
  error: '#F87171',
  errorSoft: 'rgba(248,113,113,0.14)',

  scrollbarThumb: 'rgba(96,165,250,0.25)',
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
