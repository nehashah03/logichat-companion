// // =============================================================
// // THEME COLOR CONSTANTS
// // Two themes supported: "light" and "midnight" (Midnight Blue dark)
// // Edit values here to recolor the entire app.
// // =============================================================

// export type ThemeName = 'light' | 'midnight';

// export interface ThemePalette {
//   // Surfaces
//   bgApp: string;          // outer-most background
//   bgSidebar: string;      // sidebar surface
//   bgChat: string;         // chat panel surface
//   bgInput: string;        // input box background
//   bgHover: string;        // hover state
//   bgSelected: string;     // selected list item
//   bgUserBubble: string;   // user message bubble
//   bgAssistantBubble: string; // assistant message bubble
//   bgCodeHeader: string;
//   bgCode: string;

//   // Borders / dividers
//   border: string;
//   borderStrong: string;

//   // Text
//   textPrimary: string;
//   textSecondary: string;
//   textMuted: string;
//   textOnPrimary: string;

//   // Accents
//   primary: string;
//   primaryHover: string;
//   primarySoft: string;     // tinted background using primary
//   userAccent: string;      // user message accent
//   assistantAccent: string; // assistant message accent

//   // Status
//   success: string;
//   warning: string;
//   error: string;
//   errorSoft: string;

//   // Misc
//   scrollbarThumb: string;
//   scrollbarTrack: string;
// }

// // ---------- LIGHT ----------
// export const LIGHT: ThemePalette = {
//   bgApp: '#FFFFFF',
//   bgSidebar: '#F7F8FA',
//   bgChat: '#FFFFFF',
//   bgInput: '#F4F6F8',
//   bgHover: 'rgba(0,0,0,0.04)',
//   bgSelected: 'rgba(25,118,210,0.10)',
//   bgUserBubble: '#E8F1FF',
//   bgAssistantBubble: '#F4F6F8',
//   bgCodeHeader: '#EEF1F4',
//   bgCode: '#FAFBFC',

//   border: '#E5E7EB',
//   borderStrong: '#D1D5DB',

//   textPrimary: '#1A1A1A',
//   textSecondary: '#4B5563',
//   textMuted: '#9CA3AF',
//   textOnPrimary: '#FFFFFF',

//   primary: '#1976D2',
//   primaryHover: '#1565C0',
//   primarySoft: '#E3F2FD',
//   userAccent: '#1976D2',
//   assistantAccent: '#6B7280',

//   success: '#2E7D32',
//   warning: '#ED6C02',
//   error: '#D32F2F',
//   errorSoft: '#FDECEA',

//   scrollbarThumb: '#CBD5E1',
//   scrollbarTrack: 'transparent',
// };

// // ---------- MIDNIGHT BLUE (dark) ----------
// export const MIDNIGHT: ThemePalette = {
//   // Deep navy inspired by the reference dashboard screenshot
//   bgApp: '#070B1A',
//   bgSidebar: '#0A1024',
//   bgChat: '#070B1A',
//   bgInput: '#0F1733',
//   bgHover: 'rgba(96,165,250,0.08)',
//   bgSelected: 'rgba(96,165,250,0.16)',
//   bgUserBubble: '#142046',
//   bgAssistantBubble: '#0D1530',
//   bgCodeHeader: '#0C142C',
//   bgCode: '#060A18',

//   border: 'rgba(96,165,250,0.14)',
//   borderStrong: 'rgba(96,165,250,0.28)',

//   textPrimary: '#EAEFFB',
//   textSecondary: '#A6B0CF',
//   textMuted: '#6A7494',
//   textOnPrimary: '#06091A',

//   primary: '#3B82F6',
//   primaryHover: '#60A5FA',
//   primarySoft: 'rgba(59,130,246,0.16)',
//   userAccent: '#7DA8FF',
//   assistantAccent: '#94A3B8',

//   success: '#34D399',
//   warning: '#FBBF24',
//   error: '#F87171',
//   errorSoft: 'rgba(248,113,113,0.14)',

//   scrollbarThumb: 'rgba(96,165,250,0.25)',
//   scrollbarTrack: 'transparent',
// };

// export const PALETTES: Record<ThemeName, ThemePalette> = {
//   light: LIGHT,
//   midnight: MIDNIGHT,
// };

// export const THEME_LABELS: Record<ThemeName, string> = {
//   light: 'Light',
//   midnight: 'Midnight Blue',
// };

// =============================================================
// THEME COLOR CONSTANTS
// Updated to use COLOR_SYSTEM tokens
// Supported themes: "light" and "dark"
// =============================================================

export type ThemeName = 'light' | 'dark';

export interface ThemePalette {
  // Surfaces
  bgApp: string;
  bgSidebar: string;
  bgChat: string;
  bgInput: string;
  bgHover: string;
  bgSelected: string;
  bgUserBubble: string;
  bgAssistantBubble: string;
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
  primarySoft: string;
  userAccent: string;
  assistantAccent: string;

  // Status
  success: string;
  warning: string;
  error: string;
  errorSoft: string;

  // Misc
  scrollbarThumb: string;
  scrollbarTrack: string;
}

/**
 * Canonical color tokens — documented in /constant_old.txt
 */
export const COLOR_SYSTEM = {
  light: {
    pageBg: '#f2f4f7',
    card: '#ffffff',
    divider: '#D5D9D9',
    primary: '#5025eb',
    userBubbleBg: 'rgba(37, 99, 235, 0.07)',
    userBubbleBorder: 'rgba(37, 99, 235, 0.2)',
    userAvatar: '#5d25eb',
  },
  dark: {
    pageBg: '#141418',
    paper: '#1c1c22',
    divider: '#2d2f38',
    primary: '#818cf8',
    brandOrange: '#623cfb',
    userBubbleBg: 'rgba(89, 60, 251, 0.1)',
    userBubbleBorder: 'rgba(73, 60, 251, 0.28)',
    userAvatar: '#470cea',
  },
} as const;

export function getUserMessageColors(mode: ThemeName) {
  return mode === 'dark' ? COLOR_SYSTEM.dark : COLOR_SYSTEM.light;
}

// ---------- LIGHT ----------
export const LIGHT: ThemePalette = {
  bgApp: COLOR_SYSTEM.light.pageBg,
  bgSidebar: COLOR_SYSTEM.light.card,
  bgChat: COLOR_SYSTEM.light.card,
  bgInput: '#ffffff',
  bgHover: 'rgba(37, 99, 235, 0.05)',
  bgSelected: 'rgba(37, 99, 235, 0.10)',
  bgUserBubble: COLOR_SYSTEM.light.userBubbleBg,
  bgAssistantBubble: '#ffffff',
  bgCodeHeader: '#eef2f7',
  bgCode: '#f8fafc',

  border: COLOR_SYSTEM.light.divider,
  borderStrong: '#bfc5c5',

  textPrimary: '#111827',
  textSecondary: '#4b5563',
  textMuted: '#6b7280',
  textOnPrimary: '#ffffff',

  primary: COLOR_SYSTEM.light.primary,
  primaryHover: '#1d4ed8',
  primarySoft: 'rgba(37, 99, 235, 0.08)',
  userAccent: COLOR_SYSTEM.light.userAvatar,
  assistantAccent: '#6b7280',

  success: '#16a34a',
  warning: '#ea580c',
  error: '#dc2626',
  errorSoft: 'rgba(220, 38, 38, 0.08)',

  scrollbarThumb: '#cbd5e1',
  scrollbarTrack: 'transparent',
};

// ---------- DARK ----------
export const DARK: ThemePalette = {
  bgApp: COLOR_SYSTEM.dark.pageBg,
  bgSidebar: COLOR_SYSTEM.dark.paper,
  bgChat: COLOR_SYSTEM.dark.pageBg,
  bgInput: COLOR_SYSTEM.dark.paper,
  bgHover: 'rgba(129, 140, 248, 0.08)',
  bgSelected: 'rgba(129, 140, 248, 0.14)',
  bgUserBubble: COLOR_SYSTEM.dark.userBubbleBg,
  bgAssistantBubble: COLOR_SYSTEM.dark.paper,
  bgCodeHeader: '#22232b',
  bgCode: '#18181d',

  border: COLOR_SYSTEM.dark.divider,
  borderStrong: '#3a3d48',

  textPrimary: '#f3f4f6',
  textSecondary: '#d1d5db',
  textMuted: '#9ca3af',
  textOnPrimary: '#0f172a',

  primary: COLOR_SYSTEM.dark.primary,
  primaryHover: '#6366f1',
  primarySoft: 'rgba(129, 140, 248, 0.12)',
  userAccent: COLOR_SYSTEM.dark.userAvatar,
  assistantAccent: '#94a3b8',

  success: '#22c55e',
  warning: COLOR_SYSTEM.dark.brandOrange,
  error: '#f87171',
  errorSoft: 'rgba(248, 113, 113, 0.12)',

  scrollbarThumb: '#4b5563',
  scrollbarTrack: 'transparent',
};

export const PALETTES: Record<ThemeName, ThemePalette> = {
  light: LIGHT,
  dark: DARK,
};

export const THEME_LABELS: Record<ThemeName, string> = {
  light: 'Light',
  dark: 'Dark',
};