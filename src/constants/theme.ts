export const theme = {
  colors: {
    background: '#0A0A0F',
    surface: '#1A1A2E',
    primary: '#4ECDC4',
    secondary: '#FF6B6B',
    text: '#F7F7F7',
    textSecondary: '#A0A0A0',
    success: '#51CF66',
    overlay: 'rgba(0, 0, 0, 0.7)',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  borderRadius: {
    sm: 8,
    md: 16,
    lg: 24,
    full: 9999,
  },
  typography: {
    title: {
      fontSize: 32,
      fontWeight: '300' as const,
    },
    heading: {
      fontSize: 24,
      fontWeight: '400' as const,
    },
    body: {
      fontSize: 16,
      fontWeight: '400' as const,
    },
    caption: {
      fontSize: 12,
      fontWeight: '400' as const,
    },
  },
};

export const animations = {
  timing: {
    fast: 200,
    normal: 300,
    slow: 500,
  },
  spring: {
    default: {
      damping: 15,
      stiffness: 150,
    },
    gentle: {
      damping: 20,
      stiffness: 100,
    },
    bouncy: {
      damping: 10,
      stiffness: 200,
    },
  },
};
