import React from 'react';
import { View, ViewStyle, StyleSheet } from 'react-native';
import { colors } from '../../lib/colors';

interface SketchPaperProps {
  children: React.ReactNode;
  variant?: 'card' | 'page';
  hasMarginLine?: boolean;
  style?: ViewStyle | ViewStyle[];
}

export function SketchPaper({ children, variant = 'card', hasMarginLine = false, style }: SketchPaperProps) {
  if (variant === 'page') {
    return (
      <View style={[styles.page, style]}>
        {hasMarginLine && <View style={styles.marginLine} />}
        <View style={styles.pageContent}>{children}</View>
      </View>
    );
  }

  return (
    <View style={[styles.card, hasMarginLine && styles.cardWithMargin, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 16,
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardWithMargin: {
    borderLeftWidth: 4,
    borderLeftColor: colors.marginLine,
  },
  page: {
    flex: 1,
    backgroundColor: colors.paper,
    flexDirection: 'row',
  },
  marginLine: {
    width: 2,
    backgroundColor: colors.marginLine,
    marginLeft: 52,
  },
  pageContent: {
    flex: 1,
    padding: 16,
  },
});
