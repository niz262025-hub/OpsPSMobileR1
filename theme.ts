// Theme constants
export const THEME = {
  primary: '#5B2BD9',
  accent: '#EC4C99',
  accentAlt: '#F97316',
  background: '#F6F4FB',
  surface: '#FFFFFF',
  text: {
    primary: '#181145',
    secondary: '#6B6B8A',
    light: '#8E899B',
  },
  status: {
    success: '#16A34A',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#3B82F6',
  },
  border: '#ECE8F5',
  shadow: {
    small: {
      boxShadow: '0px 1px 2px rgba(0, 0, 0, 0.08)',
      elevation: 2,
    },
    medium: {
      boxShadow: '0px 4px 12px rgba(91, 43, 217, 0.12)',
      elevation: 4,
    },
  },
};

// Typography
export const FONT_SIZES = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 34,
};

export const FONT_WEIGHTS = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

// Spacing
export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
};

// Border radius
export const BORDER_RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
};
