import { Platform } from 'react-native';
import { useFonts, Kalam_400Regular, Kalam_700Bold } from '@expo-google-fonts/kalam';

// Legacy font family shortcuts (used across all components)
export const fonts = {
  heading: 'Kalam_700Bold' as const,
  subheading: 'Kalam_400Regular' as const,
  body: Platform.OS === 'ios' ? ('System' as string) : ('Roboto' as string),
  mono: Platform.OS === 'ios' ? ('Courier New' as string) : ('monospace' as string),
};

// Keep `typography` export pointing to legacy font families for backward compat
export const typography = fonts;

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

// New design system typography presets
export const typePresets = {
  // Display — Kalam (handwritten, marker feel)
  displayXl: { fontFamily: 'Kalam_700Bold', fontSize: 40, lineHeight: 48, color: '#0F172A' },
  displayLg: { fontFamily: 'Kalam_700Bold', fontSize: 32, lineHeight: 40, color: '#0F172A' },
  displayMd: { fontFamily: 'Kalam_700Bold', fontSize: 26, lineHeight: 34, color: '#0F172A' },
  displaySm: { fontFamily: 'Kalam_700Bold', fontSize: 22, lineHeight: 30, color: '#0F172A' },

  // Body — System sans-serif
  bodyLg: { fontFamily: 'System', fontSize: 17, lineHeight: 26, color: '#0F172A' },
  bodyMd: { fontFamily: 'System', fontSize: 15, lineHeight: 23, color: '#1E293B' },
  bodySm: { fontFamily: 'System', fontSize: 13, lineHeight: 20, color: '#64748B' },
  bodyXs: { fontFamily: 'System', fontSize: 11, lineHeight: 17, color: '#94A3B8' },

  // Labels
  labelLg: { fontFamily: 'System', fontSize: 14, fontWeight: '600' as const, color: '#0F172A', letterSpacing: 0 },
  labelMd: { fontFamily: 'System', fontSize: 12, fontWeight: '600' as const, color: '#64748B', letterSpacing: 0.5, textTransform: 'uppercase' as const },
  labelSm: { fontFamily: 'System', fontSize: 10, fontWeight: '700' as const, color: '#94A3B8', letterSpacing: 0.8, textTransform: 'uppercase' as const },

  // Score numbers — Kalam feels like written score
  scoreLg: { fontFamily: 'Kalam_700Bold', fontSize: 52, lineHeight: 60, color: '#0F172A' },
  scoreMd: { fontFamily: 'Kalam_700Bold', fontSize: 36, lineHeight: 44, color: '#0F172A' },
  scoreSm: { fontFamily: 'Kalam_700Bold', fontSize: 26, lineHeight: 32, color: '#0F172A' },
} as const;

export { useFonts, Kalam_400Regular, Kalam_700Bold };
