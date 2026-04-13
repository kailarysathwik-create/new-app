export const colors = {
  // Deep Space Backgrounds
  bg: '#050508',
  bgCard: '#0D0D14',
  bgSurface: '#161622',

  // Electric Accents (Vibrant)
  accent: '#7000FF',         // Electric Purple
  accentSecondary: '#00F5FF', // Neon Cyan
  accentWarm: '#FF007A',      // Cyber Pink
  accentGlow: 'rgba(112, 0, 255, 0.4)',

  // Neobrutalist White/Black
  white: '#FFFFFF',
  black: '#000000',

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0B8',
  textMuted: '#505066',

  // Semantic
  success: '#00FF9D',
  error: '#FF2E5B',
  warning: '#FFB800',

  // Glass tokens
  glass: 'rgba(255, 255, 255, 0.05)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
};

export const typography = {
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
  sm: 4,
  md: 12,
  lg: 24,
  full: 9999,
};

// Neobrutalist Shadows (Sharp, bold)
export const shadows = {
  brutal: {
    shadowColor: '#7000FF',
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
