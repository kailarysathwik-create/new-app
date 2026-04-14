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

// Neo-Brutalist Shadows & Borders
export const shadows = {
  brutal: {
    shadowColor: '#000000',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  brutalSmall: {
    shadowColor: '#000000',
    shadowOffset: { width: 4, height: 4 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 4,
  },
  brutalOrange: {
    shadowColor: '#FF5C00',
    shadowOffset: { width: 5, height: 5 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 5,
  }
};

export const borders = {
  thick: 3,
  medium: 2,
  thin: 1,
  color: '#000000',
};

