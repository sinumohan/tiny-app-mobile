import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { colors } from '../../lib/colors';
import { typography, fontSizes } from '../../lib/typography';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  style?: ViewStyle;
}

export function SectionHeader({ title, subtitle, style }: SectionHeaderProps) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.underline} />
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  title: {
    fontFamily: typography.heading,
    fontSize: fontSizes.xl,
    color: colors.teal,
    marginBottom: 4,
  },
  underline: {
    height: 2,
    width: 40,
    backgroundColor: colors.teal,
    borderRadius: 1,
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: typography.body,
    fontSize: fontSizes.sm,
    color: colors.inkMuted,
  },
});
