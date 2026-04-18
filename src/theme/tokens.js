export const colors = {
  // Deep Warm Backgrounds
  bg: '#0F0904',
  bgCard: '#1D120B',
  bgSurface: '#2D1F12',

  // Saily Warm Palette (Bold & Energetic)
  accent: '#FF5C00',         // Safety Orange
  accentSecondary: '#FFBC11', // Deep Amber
  accentWarm: '#FF2D00',      // Vivid Coral
  accentGlow: 'rgba(255, 92, 0, 0.4)',

  // Neobrutalist White/Black/Borders
  white: '#FFFFFF',
  black: '#000000',
  border: '#000000', // Solid black for brutalist strokes

  // Text (Warm tinted)
  textPrimary: '#FFFFFF',
  textSecondary: '#D6C7B1',
  textMuted: '#6C584C',

  // Semantic
  success: '#32D74B',
  error: '#FF453A',
  warning: '#FF9F0A',

  // Glass tokens (DEPRECATED for Neo-Brutalism, but kept for legacy compat)
  glass: 'rgba(255, 255, 255, 0.05)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
};

export const typography = {
  family: {
    regular: 'Outfit_400Regular',
    medium: 'Outfit_500Medium',
    bold: 'Outfit_700Bold',
    black: 'Outfit_900Black',
  },
  size: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 20,
    xl: 24,
    xxl: 32,
    huge: 48,
  },
  weight: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    black: '900',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 64,
};

export const radius = {
  none: 0,
  sm: 2,
  md: 8,
  lg: 16,
  full: 9999,
};

// Neo-Brutalist Shadows (Hard-edged, no blur)
export const shadows = {
  brutal: {
    boxShadow: '6px 6px 0px 0px #000000',
  },
  brutalSmall: {
    boxShadow: '4px 4px 0px 0px #000000',
  },
  brutalOrange: {
    boxShadow: '5px 5px 0px 0px #FF5C00',
  },
  glass: {
    boxShadow: '8px 8px 0px 0px rgba(0, 0, 0, 0.25)',
  }
};

export const borders = {
  thick: 3,
  medium: 2,
  thin: 1,
  color: '#000000',
};

