import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../lib/colors';
import { typography, fontSizes } from '../../lib/typography';

interface AssumptionCardProps {
  assumption_text: string;
  category: string;
  criticality: number; // 1-5
  evidence_level: number; // 1-5
  is_tested: boolean;
}

function getLeftBorderColor(criticality: number, evidence_level: number, is_tested: boolean): string {
  if (is_tested) return colors.mint;
  if (criticality >= 4 && evidence_level <= 2) return colors.coral;
  if (criticality >= 3) return colors.amber;
  return colors.border;
}

function Dots({ filled, total, color }: { filled: number; total: number; color: string }) {
  return (
    <View style={{ flexDirection: 'row', gap: 3 }}>
      {Array.from({ length: total }).map((_, i) => (
        <Text
          key={i}
          style={{
            fontSize: 10,
            color: i < filled ? color : colors.border,
          }}
        >
          {i < filled ? '\u25CF' : '\u25CB'}
        </Text>
      ))}
    </View>
  );
}

export function AssumptionCard({
  assumption_text,
  category,
  criticality,
  evidence_level,
  is_tested,
}: AssumptionCardProps) {
  const borderColor = getLeftBorderColor(criticality, evidence_level, is_tested);

  return (
    <View style={[styles.card, { borderLeftColor: borderColor }]}>
      <View style={styles.header}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{category}</Text>
        </View>
        {is_tested && (
          <View style={styles.testedBadge}>
            <Text style={styles.testedText}>Tested</Text>
          </View>
        )}
      </View>
      <Text style={styles.assumptionText}>{assumption_text}</Text>
      <View style={styles.metricsRow}>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Criticality</Text>
          <Dots filled={criticality} total={5} color={colors.coral} />
        </View>
        <View style={styles.metric}>
          <Text style={styles.metricLabel}>Evidence</Text>
          <Dots filled={evidence_level} total={5} color={colors.electric} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 10,
    padding: 14,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  categoryBadge: {
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  categoryText: {
    fontSize: fontSizes.xs,
    color: colors.muted,
    fontFamily: typography.body,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  testedBadge: {
    backgroundColor: colors.mint,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  testedText: {
    fontSize: fontSizes.xs,
    color: colors.white,
    fontFamily: typography.body,
  },
  assumptionText: {
    fontSize: fontSizes.base,
    color: colors.ink,
    fontFamily: typography.body,
    lineHeight: 22,
    marginBottom: 10,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: 20,
  },
  metric: {
    alignItems: 'flex-start',
    gap: 3,
  },
  metricLabel: {
    fontSize: fontSizes.xs,
    color: colors.muted,
    fontFamily: typography.body,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
