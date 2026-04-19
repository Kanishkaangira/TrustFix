import { useMemo } from 'react';

import { useAppTheme } from '../theme/ThemeProvider';

const DARK_TECH_COLORS = {
  bg: '#0C0E13',
  bgElevated: '#111420',
  card: '#161B26',
  cardAlt: '#1C2232',
  float: '#202737',
  input: '#171D2B',
  border: 'rgba(255,255,255,0.08)',
  borderStrong: 'rgba(255,255,255,0.12)',
  text: '#F0EDE8',
  textSecondary: '#9BA3B8',
  textMuted: '#5C647A',
  coral: '#FF6B35',
  coralDeep: '#E8531A',
  coralLight: '#FF9262',
  coralTint: 'rgba(255,107,53,0.10)',
  coralBorder: 'rgba(255,107,53,0.22)',
  emerald: '#10D9A0',
  emeraldTint: 'rgba(16,217,160,0.12)',
  gold: '#FFB347',
  goldTint: 'rgba(255,179,71,0.14)',
  sky: '#38BDF8',
  skyTint: 'rgba(56,189,248,0.12)',
  amber: '#FBBF24',
  amberTint: 'rgba(251,191,36,0.12)',
  rose: '#FB7185',
  roseTint: 'rgba(251,113,133,0.12)',
  violet: '#A78BFA',
  violetTint: 'rgba(167,139,250,0.12)',
  white: '#FFFFFF',
  black: '#06080B',
};

const LIGHT_TECH_COLORS = {
  bg: '#F5F7FB',
  bgElevated: '#FFFFFF',
  card: '#FFFFFF',
  cardAlt: '#FFF6F0',
  float: '#EEF3FA',
  input: '#F1F5FA',
  border: 'rgba(19,31,53,0.08)',
  borderStrong: 'rgba(19,31,53,0.14)',
  text: '#162235',
  textSecondary: '#627086',
  textMuted: '#8A96A8',
  coral: '#E75C28',
  coralDeep: '#C94A19',
  coralLight: '#FF946A',
  coralTint: 'rgba(231,92,40,0.10)',
  coralBorder: 'rgba(231,92,40,0.18)',
  emerald: '#14926A',
  emeraldTint: 'rgba(20,146,106,0.12)',
  gold: '#C98518',
  goldTint: 'rgba(201,133,24,0.14)',
  sky: '#2D8EC7',
  skyTint: 'rgba(45,142,199,0.12)',
  amber: '#BF8615',
  amberTint: 'rgba(191,134,21,0.12)',
  rose: '#D55C74',
  roseTint: 'rgba(213,92,116,0.12)',
  violet: '#7D68D9',
  violetTint: 'rgba(125,104,217,0.12)',
  white: '#FFFFFF',
  black: '#0E1420',
};

const DARK_TECH_GRADIENTS = {
  brand: ['#FF6B35', '#FF9262', '#FFB347'],
  emerald: ['#10D9A0', '#059669'],
  surface: ['#1C2232', '#161B26'],
};

const LIGHT_TECH_GRADIENTS = {
  brand: ['#FF8B5E', '#FFB175', '#FFD194'],
  emerald: ['#24C38E', '#169C73'],
  surface: ['#FFFFFF', '#F9F2EC'],
};

export const TECH_RADIUS = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  pill: 999,
};

export const TECH_SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

const buildTechShadows = (isDark, colors) => ({
  card: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: isDark ? 0.24 : 0.08,
    shadowRadius: isDark ? 18 : 16,
    elevation: isDark ? 8 : 5,
  },
  glow: {
    shadowColor: colors.coral,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: isDark ? 0.24 : 0.16,
    shadowRadius: isDark ? 22 : 18,
    elevation: isDark ? 10 : 7,
  },
});

const buildToneMap = (colors) => ({
  coral: {
    text: colors.coral,
    bg: colors.coralTint,
    border: colors.coralBorder,
  },
  emerald: {
    text: colors.emerald,
    bg: colors.emeraldTint,
    border: 'rgba(16,217,160,0.22)',
  },
  amber: {
    text: colors.amber,
    bg: colors.amberTint,
    border: 'rgba(251,191,36,0.22)',
  },
  sky: {
    text: colors.sky,
    bg: colors.skyTint,
    border: 'rgba(56,189,248,0.22)',
  },
  rose: {
    text: colors.rose,
    bg: colors.roseTint,
    border: 'rgba(251,113,133,0.22)',
  },
  violet: {
    text: colors.violet,
    bg: colors.violetTint,
    border: 'rgba(167,139,250,0.22)',
  },
  gold: {
    text: colors.gold,
    bg: colors.goldTint,
    border: 'rgba(255,179,71,0.22)',
  },
});

export const TECH_COLORS = DARK_TECH_COLORS;
export const TECH_GRADIENTS = DARK_TECH_GRADIENTS;
export const TECH_SHADOWS = buildTechShadows(true, DARK_TECH_COLORS);

export const getTechTone = (tone = 'coral', colors = DARK_TECH_COLORS) => {
  const toneMap = buildToneMap(colors);
  return toneMap[tone] || toneMap.coral;
};

export const getTechTheme = (isDark) => {
  const colors = isDark ? DARK_TECH_COLORS : LIGHT_TECH_COLORS;
  const gradients = isDark ? DARK_TECH_GRADIENTS : LIGHT_TECH_GRADIENTS;

  return {
    mode: isDark ? 'dark' : 'light',
    isDark,
    colors,
    gradients,
    radius: TECH_RADIUS,
    shadows: buildTechShadows(isDark, colors),
    spacing: TECH_SPACING,
    statusBarStyle: isDark ? 'light-content' : 'dark-content',
    getTone: (tone = 'coral') => getTechTone(tone, colors),
  };
};

export const useTechTheme = () => {
  const { isDark } = useAppTheme();

  return useMemo(() => getTechTheme(isDark), [isDark]);
};

export const useTechScreenTheme = (createStyles) => {
  const theme = useTechTheme();
  const styles = useMemo(() => createStyles(theme), [createStyles, theme]);

  return {
    ...theme,
    styles,
  };
};
