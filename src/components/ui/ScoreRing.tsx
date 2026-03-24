import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../lib/colors';
import { fontSizes } from '../../lib/typography';

interface ScoreRingProps {
  score: number | null;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  color?: string;
}

function getScoreColor(score: number | null): string {
  if (score === null) return colors.border;
  if (score >= 80) return colors.mint;
  if (score >= 60) return colors.electric;
  if (score >= 40) return colors.amber;
  return colors.coral;
}

function getScoreBand(score: number | null): string {
  if (score === null) return '--';
  if (score >= 80) return 'Strong';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Weak';
  return 'Poor';
}

const sizeMap = {
  sm: { outer: 56, inner: 42, fontSize: fontSizes.base, labelSize: fontSizes.xs, stroke: 5 },
  md: { outer: 80, inner: 62, fontSize: fontSizes.xl, labelSize: fontSizes.xs, stroke: 7 },
  lg: { outer: 110, inner: 88, fontSize: fontSizes['2xl'], labelSize: fontSizes.sm, stroke: 9 },
};

export function ScoreRing({ score, size = 'md', label, color }: ScoreRingProps) {
  const dims = sizeMap[size];
  const ringColor = color ?? getScoreColor(score);

  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.outerRing,
          {
            width: dims.outer,
            height: dims.outer,
            borderRadius: dims.outer / 2,
            borderWidth: dims.stroke,
            borderColor: ringColor,
            backgroundColor: colors.white,
          },
        ]}
      >
        <View
          style={[
            styles.innerCircle,
            {
              width: dims.inner,
              height: dims.inner,
              borderRadius: dims.inner / 2,
            },
          ]}
        >
          <Text style={[styles.scoreText, { fontSize: dims.fontSize, color: ringColor }]}>
            {score !== null ? score : '--'}
          </Text>
        </View>
      </View>
      {label && (
        <Text style={[styles.label, { fontSize: dims.labelSize }]}>{label}</Text>
      )}
      {score !== null && size !== 'sm' && (
        <Text style={[styles.band, { color: ringColor, fontSize: dims.labelSize }]}>
          {getScoreBand(score)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  outerRing: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  innerCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreText: {
    fontFamily: 'Kalam_700Bold',
    lineHeight: undefined,
  },
  label: {
    marginTop: 4,
    fontFamily: 'Kalam_400Regular',
    color: colors.muted,
    textAlign: 'center',
  },
  band: {
    fontFamily: 'Kalam_400Regular',
    marginTop: 1,
    textAlign: 'center',
  },
});
