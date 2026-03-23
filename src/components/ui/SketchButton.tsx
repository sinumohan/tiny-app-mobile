import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors } from '../../lib/colors';
import { typography, fontSizes } from '../../lib/typography';

interface SketchButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export function SketchButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
}: SketchButtonProps) {
  const isDisabled = disabled || loading;

  const containerStyle: ViewStyle[] = [
    styles.base,
    styles[`size_${size}` as keyof typeof styles] as ViewStyle,
    styles[`variant_${variant}` as keyof typeof styles] as ViewStyle,
    ...(isDisabled ? [styles.disabled as ViewStyle] : []),
    style ?? {},
  ];

  const textStyle: TextStyle[] = [
    styles.text,
    styles[`text_${size}` as keyof typeof styles] as TextStyle,
    styles[`textVariant_${variant}` as keyof typeof styles] as TextStyle,
    ...(isDisabled ? [styles.textDisabled as TextStyle] : []),
  ];

  return (
    <TouchableOpacity
      style={containerStyle}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? colors.ink : colors.teal}
          size="small"
        />
      ) : (
        <Text style={textStyle}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  size_sm: {
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  size_md: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  size_lg: {
    paddingVertical: 16,
    paddingHorizontal: 28,
  },
  variant_primary: {
    backgroundColor: colors.yellow,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  variant_secondary: {
    backgroundColor: colors.paper,
    borderWidth: 2,
    borderColor: colors.teal,
  },
  variant_ghost: {
    backgroundColor: 'transparent',
  },
  variant_danger: {
    backgroundColor: colors.risk,
    shadowColor: colors.risk,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontFamily: typography.heading,
    letterSpacing: 0.3,
  },
  text_sm: {
    fontSize: fontSizes.sm,
  },
  text_md: {
    fontSize: fontSizes.base,
  },
  text_lg: {
    fontSize: fontSizes.md,
  },
  textVariant_primary: {
    color: colors.ink,
  },
  textVariant_secondary: {
    color: colors.teal,
  },
  textVariant_ghost: {
    color: colors.inkMuted,
  },
  textVariant_danger: {
    color: colors.white,
  },
  textDisabled: {
    opacity: 0.6,
  },
});
