import { Platform } from 'react-native';

export const typography = {
  heading: 'Kalam_700Bold' as const,
  subheading: 'Kalam_400Regular' as const,
  body: Platform.OS === 'ios' ? 'System' : 'Roboto',
  mono: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
};

export const fontSizes = {
  xs: 11,
  sm: 13,
  base: 15,
  md: 17,
  lg: 20,
  xl: 24,
  '2xl': 30,
  '3xl': 38,
};

export const lineHeights = {
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.75,
};
