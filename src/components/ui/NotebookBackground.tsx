import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors } from '../../lib/colors';

interface NotebookBackgroundProps {
  children: React.ReactNode;
}

/**
 * A background wrapper that adds a subtle notebook-style left margin line.
 * On mobile, we keep it simple: white background with a thin red vertical
 * margin line on the left side, evoking a spiral notebook page.
 */
export function NotebookBackground({ children }: NotebookBackgroundProps) {
  return (
    <View style={styles.container}>
      <View style={styles.marginLine} />
      <View style={styles.content}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: colors.white,
  },
  marginLine: {
    width: 2,
    backgroundColor: colors.notebookMargin,
    marginLeft: 24,
  },
  content: {
    flex: 1,
  },
});
