export type ThemeType = 'light' | 'dark' | 'solar' | 'mono';

export interface ThemeColors {
  background: string;
  surface: string;
  primary: string;
  secondary: string;
  text: string;
  textSecondary: string;
  success: string;
  overlay: string;
  border: string;
  cardBackground: string;
}

export interface Theme {
  colors: ThemeColors;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  typography: typeof typography;
}

const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

const borderRadius = {
  sm: 8,
  md: 16,
  lg: 24,
  full: 9999,
};

const typography = {
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
};

export const themes: Record<ThemeType, Theme> = {
  light: {
    colors: {
      background: '#FFFFFF',
      surface: '#F5F5F5',
      primary: '#4A90D9',
      secondary: '#FF6B6B',
      text: '#1A1A1A',
      textSecondary: '#666666',
      success: '#51CF66',
      overlay: 'rgba(0, 0, 0, 0.5)',
      border: '#E0E0E0',
      cardBackground: '#F5F5F5',
    },
    spacing,
    borderRadius,
    typography,
  },
  dark: {
    colors: {
      background: '#0D0D0D',
      surface: '#1A1A1A',
      primary: '#5BA3E0',
      secondary: '#FF6B6B',
      text: '#FFFFFF',
      textSecondary: '#A0A0A0',
      success: '#51CF66',
      overlay: 'rgba(0, 0, 0, 0.7)',
      border: '#333333',
      cardBackground: '#1A1A1A',
    },
    spacing,
    borderRadius,
    typography,
  },
  solar: {
    colors: {
      background: '#FFF8E7',
      surface: '#FFEDD5',
      primary: '#D4A574',
      secondary: '#E07B39',
      text: '#4A3728',
      textSecondary: '#8B7355',
      success: '#7CB342',
      overlay: 'rgba(74, 55, 40, 0.5)',
      border: '#E8D5B5',
      cardBackground: '#FFEDD5',
    },
    spacing,
    borderRadius,
    typography,
  },
  mono: {
    colors: {
      background: '#2D2D2D',
      surface: '#3D3D3D',
      primary: '#E0E0E0',
      secondary: '#A0A0A0',
      text: '#F0F0F0',
      textSecondary: '#B0B0B0',
      success: '#C0C0C0',
      overlay: 'rgba(0, 0, 0, 0.6)',
      border: '#505050',
      cardBackground: '#3D3D3D',
    },
    spacing,
    borderRadius,
    typography,
  },
};

export const themeNames: Record<ThemeType, string> = {
  light: 'Light',
  dark: 'Dark',
  solar: 'Solar',
  mono: 'Mono',
};
