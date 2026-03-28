// Shared design tokens — import in every BookingFlow screen

export const COLORS = {
  // Brand
  primary:       '#D94F2B',   // deep burnt orange — TrustFix brand
  primaryLight:  '#FDF1EE',   // very light tint for backgrounds
  primaryMid:    '#F5D5CB',   // medium tint for borders / highlights

  // Neutrals
  ink:           '#111318',   // near-black text
  inkSecondary:  '#5A5F6B',   // secondary text
  inkMuted:      '#9BA3AF',   // placeholder, hints
  border:        '#E8EAED',   // card borders
  borderLight:   '#F3F4F6',   // dividers
  surface:       '#FFFFFF',   // card backgrounds
  background:    '#F7F8FA',   // page background
  overlay:       'rgba(17,19,24,0.04)',

  // Status
  success:       '#1A7A4A',
  successLight:  '#EBF7F1',
  warning:       '#B45309',
  warningLight:  '#FEF3C7',
  danger:        '#C0392B',
  dangerLight:   '#FDECEA',
};

export const FONT = {
  // Weight aliases
  regular:  '400',
  medium:   '500',
  semibold: '600',
  bold:     '700',
  black:    '800',
};

export const RADIUS = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  full: 999,
};

export const SHADOW = {
  card: {
    shadowColor:   '#111318',
    shadowOffset:  { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius:  6,
    elevation:     2,
  },
  elevated: {
    shadowColor:   '#111318',
    shadowOffset:  { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius:  12,
    elevation:     5,
  },
  cta: {
    shadowColor:   '#D94F2B',
    shadowOffset:  { width: 0, height: 6 },
    shadowOpacity: 0.30,
    shadowRadius:  14,
    elevation:     8,
  },
};

export const SPACING = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
};
