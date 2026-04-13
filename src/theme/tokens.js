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

  // Neobrutalist White/Black
  white: '#FFFFFF',
  black: '#000000',

  // Text (Warm tinted)
  textPrimary: '#FFFFFF',
  textSecondary: '#D6C7B1',
  textMuted: '#6C584C',

  // Semantic
  success: '#32D74B',
  error: '#FF453A',
  warning: '#FF9F0A',

  // Glass tokens
  glass: 'rgba(255, 255, 255, 0.05)',
  glassBorder: 'rgba(255, 92, 0, 0.15)',
};

export const typography = {
  // "Outfit" from Google Fonts - Geometric, Neat, Professional
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
  sm: 4,
  md: 12,
  lg: 24,
  full: 9999,
};

// Neobrutalist Shadows (Sharp, bold, Orange-tinted)
export const shadows = {
  brutal: {
    shadowColor: '#FF5C00',
    shadowOffset: { width: 6, height: 6 },
    shadowOpacity: 1,
    shadowRadius: 0,
    elevation: 6,
  },
  glass: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
};
