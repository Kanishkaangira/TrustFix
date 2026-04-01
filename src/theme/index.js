// Shared design tokens

const LIGHT_COLORS = {
  // Brand
  primary: '#D94F2B',
  primaryLight: '#FDF1EE',
  primaryMid: '#F5D5CB',

  // Neutrals
  ink: '#111318',
  inkSecondary: '#5A5F6B',
  inkMuted: '#9BA3AF',
  border: '#E8EAED',
  borderLight: '#F3F4F6',
  surface: '#FFFFFF',
  surfaceMuted: '#FBFCFE',
  background: '#F7F8FA',
  backgroundAlt: '#FCFBF8',
  overlay: 'rgba(17,19,24,0.04)',

  // Utility
  white: '#FFFFFF',
  black: '#111318',

  // Status
  success: '#1A7A4A',
  successLight: '#EBF7F1',
  warning: '#B45309',
  warningLight: '#FEF3C7',
  danger: '#C0392B',
  dangerLight: '#FDECEA',
};

const DARK_COLORS = {
  // Brand
  primary: '#FF7A45',
  primaryLight: '#3C241C',
  primaryMid: '#5A372B',

  // Neutrals
  ink: '#F5F7FB',
  inkSecondary: '#C7CFDB',
  inkMuted: '#8B96A7',
  border: '#293241',
  borderLight: '#202734',
  surface: '#141A22',
  surfaceMuted: '#1A222D',
  background: '#0D1218',
  backgroundAlt: '#111821',
  overlay: 'rgba(255,255,255,0.06)',

  // Utility
  white: '#FFFFFF',
  black: '#06080B',

  // Status
  success: '#39C37A',
  successLight: '#193425',
  warning: '#F4A340',
  warningLight: '#362914',
  danger: '#FF7A7A',
  dangerLight: '#391F24',
};

export const COLORS = LIGHT_COLORS;
export const DARK_COLORS_MAP = DARK_COLORS;

export const getThemeColors = (isDark = false) => (
  isDark ? DARK_COLORS : LIGHT_COLORS
);

export const FONT = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  black: '800',
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 999,
};

export const SHADOW = {
  card: {
    shadowColor: '#111318',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  elevated: {
    shadowColor: '#111318',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 5,
  },
  cta: {
    shadowColor: '#D94F2B',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.30,
    shadowRadius: 14,
    elevation: 8,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};
