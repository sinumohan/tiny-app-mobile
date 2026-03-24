import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../src/hooks/useAuth';
import { useSignals } from '../../../src/hooks/useSignals';
import { supabase, Phase1Result } from '../../../src/lib/supabase';
import { SketchPaper } from '../../../src/components/ui/SketchPaper';
import { SketchButton } from '../../../src/components/ui/SketchButton';
import { SectionHeader } from '../../../src/components/ui/SectionHeader';
import { AssumptionCard } from '../../../src/components/ui/AssumptionCard';
import { ScoreRing } from '../../../src/components/ui/ScoreRing';
import { colors } from '../../../src/lib/colors';
import { typography, fontSizes } from '../../../src/lib/typography';

const LAYER_LABELS = [
  { key: 'layer1', title: 'Problem-Market Fit', icon: '\uD83C\uDFAF' },
  { key: 'layer2', title: "Market Structure (Porter's 5)", icon: '\uD83C\uDFD7' },
  { key: 'layer3', title: 'Business Context (5Cs)', icon: '\uD83E\uDDED' },
  { key: 'layer4', title: 'Assumption Stack', icon: '\uD83D\uDCCB' },
  { key: 'layer5', title: 'Market Size', icon: '\uD83D\uDCCA' },
];

function AnimatedDots() {
  const [dots, setDots] = useState('.');
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((d) => (d.length >= 3 ? '.' : d + '.'));
    }, 400);
    return () => clearInterval(interval);
  }, []);
  return <Text style={styles.dotsText}>{dots}</Text>;
}

function LayerAccordion({
  icon,
  title,
  score,
  summary,
  details,
}: {
  icon: string;
  title: string;
  score: number;
  summary: string;
  details: string[];
}) {
  const [open, setOpen] = useState(false);
  const scoreColor =
    score >= 80 ? colors.mint : score >= 60 ? colors.electric : score >= 40 ? colors.amber : colors.coral;

  return (
    <SketchPaper variant="card" style={styles.layerCard}>
      <TouchableOpacity onPress={() => setOpen((o) => !o)} activeOpacity={0.8}>
        <View style={styles.layerHeader}>
          <Text style={styles.layerIcon}>{icon}</Text>
          <View style={styles.layerTitleBlock}>
            <Text style={[styles.layerTitle, open && { color: colors.electric }]}>{title}</Text>
            <Text style={styles.layerSummary} numberOfLines={open ? undefined : 2}>
              {summary}
            </Text>
          </View>
          <View style={styles.layerScoreBlock}>
            <Text style={[styles.layerScore, { color: scoreColor }]}>{score}</Text>
            <Text style={styles.layerMaxScore}>/20</Text>
          </View>
        </View>
        <Text style={styles.accordionToggle}>{open ? '\u25B2 Less' : '\u25BC More'}</Text>
      </TouchableOpacity>

      {open && (
        <View style={styles.layerDetails}>
          <View style={styles.divider} />
          {details.map((d, i) => (
            <View key={i} style={styles.detailRow}>
              <Text style={styles.detailBullet}>--</Text>
              <Text style={styles.detailText}>{d}</Text>
            </View>
          ))}
        </View>
      )}
    </SketchPaper>
  );
}

function TVSBreakdownBars({ breakdown }: { breakdown: Phase1Result['tvs_breakdown'] }) {
  const bars = [
    { label: 'L1', score: breakdown.layer1_score },
    { label: 'L2', score: breakdown.layer2_score },
    { label: 'L3', score: breakdown.layer3_score },
    { label: 'L4', score: breakdown.layer4_score },
    { label: 'L5', score: breakdown.layer5_score },
  ];

  return (
    <SketchPaper variant="card" style={styles.breakdownCard}>
      <Text style={styles.breakdownTitle}>TVS Breakdown</Text>
      {bars.map(({ label, score }) => {
        const pct = (score / 20) * 100;
        const barColor = pct >= 80 ? colors.mint : pct >= 60 ? colors.electric : pct >= 40 ? colors.amber : colors.coral;
        return (
          <View key={label} style={styles.barRow}>
            <Text style={styles.barLabel}>{label}</Text>
            <View style={styles.barTrack}>
              <View style={[styles.barFill, { width: `${pct}%`, backgroundColor: barColor }]} />
            </View>
            <Text style={[styles.barScore, { color: barColor }]}>{score}/20</Text>
          </View>
        );
      })}
      <View style={styles.barTotal}>
        <Text style={styles.barTotalLabel}>Total TVS</Text>
        <Text style={styles.barTotalValue}>{breakdown.total}/100</Text>
      </View>
    </SketchPaper>
  );
}

function RecommendationBadge({ recommendation, reasoning }: { recommendation: string; reasoning: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    Proceed: { bg: colors.mint, text: colors.white, label: 'Proceed' },
    Pivot: { bg: colors.amber, text: colors.ink, label: 'Pivot' },
    Pause: { bg: colors.coral, text: colors.white, label: 'Pause' },
  };
  const badge = config[recommendation] ?? config['Pause'];

  return (
    <SketchPaper variant="card" hasMarginLine style={[styles.recCard, { borderLeftColor: badge.bg }]}>
      <View style={[styles.recBadge, { backgroundColor: badge.bg }]}>
        <Text style={[styles.recLabel, { color: badge.text }]}>{badge.label}</Text>
      </View>
      <Text style={styles.recReasoning}>{reasoning}</Text>
    </SketchPaper>
  );
}

export default function Phase1Screen() {
  const { dossierId } = useLocalSearchParams<{ dossierId: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const { getSignal } = useSignals(session?.user.id);

  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<Phase1Result | null>(null);
  const [tvs, setTvs] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasExistingResult, setHasExistingResult] = useState(false);

  useEffect(() => {
    loadExistingResult();
  }, [dossierId]);

  const loadExistingResult = async () => {
    if (!dossierId) return;
    const { data } = await getSignal(dossierId);
    if (data?.phase1_result) {
      setResult(data.phase1_result);
      setTvs(data.tvs);
      setHasExistingResult(true);
    }
  };

  const runAnalysis = async () => {
    if (!dossierId) return;
    setAnalyzing(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('phase1-analyze', {
        body: { dossierId },
      });
      if (fnError) throw new Error(fnError.message);
      setResult(data.phase1_result);
      setTvs(data.tvs);
    } catch (err: any) {
      setError(err.message ?? 'Analysis failed. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Phase 1 Analysis</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Intro */}
        {!result && !analyzing && (
          <SketchPaper variant="card" hasMarginLine style={styles.introCard}>
            <Text style={styles.introTitle}>AI Desk Analysis</Text>
            <Text style={styles.introBody}>
              We run a 5-layer structured analysis of your idea:{'\n\n'}
              1. Problem-Market Fit{'\n'}
              2. Market Structure (Porter's 5 Forces){'\n'}
              3. Business Context (5Cs){'\n'}
              4. Assumption Stack Extraction{'\n'}
              5. Market Size Estimation{'\n\n'}
              Result: Theoretical Viability Score (TVS /100)
            </Text>
            <SketchButton
              label={hasExistingResult ? 'Re-run Analysis' : 'Run 5-Layer Analysis'}
              onPress={runAnalysis}
              variant="primary"
              size="lg"
              style={styles.runBtn}
            />
          </SketchPaper>
        )}

        {/* Loading */}
        {analyzing && (
          <SketchPaper variant="card" style={styles.analyzingCard}>
            <ActivityIndicator color={colors.electric} size="large" />
            <View style={styles.analyzingTextRow}>
              <Text style={styles.analyzingText}>Running 5-layer analysis</Text>
              <AnimatedDots />
            </View>
            <Text style={styles.analyzingHint}>
              Examining market forces, assumption stack, and viability signals
            </Text>
          </SketchPaper>
        )}

        {/* Error */}
        {error && !analyzing && (
          <SketchPaper variant="card" style={styles.errorCard}>
            <Text style={styles.errorTitle}>Analysis Failed</Text>
            <Text style={styles.errorBody}>{error}</Text>
            <SketchButton
              label="Try Again"
              onPress={runAnalysis}
              variant="secondary"
              size="md"
              style={styles.retryBtn}
            />
          </SketchPaper>
        )}

        {/* Results */}
        {result && !analyzing && (
          <>
            <SectionHeader title="Analysis Results" subtitle={`TVS: ${tvs ?? '--'}/100`} />

            {/* Recommendation */}
            <RecommendationBadge
              recommendation={result.recommendation}
              reasoning={result.recommendation_reasoning}
            />

            {/* TVS Score Ring */}
            <View style={styles.tvsRingContainer}>
              <ScoreRing score={tvs} size="lg" label="TVS" />
              <Text style={styles.tvsLabel}>Theoretical Viability Score</Text>
            </View>

            {/* TVS Breakdown Bars */}
            <TVSBreakdownBars breakdown={result.tvs_breakdown} />

            {/* 5 Layers */}
            <SectionHeader title="5-Layer Analysis" style={styles.layersHeader} />
            {LAYER_LABELS.map((layer) => {
              if (layer.key === 'layer4') {
                const assumptions = result.layer4?.assumptions ?? [];
                return (
                  <SketchPaper key="layer4" variant="card" style={styles.layerCard}>
                    <View style={styles.layerHeader}>
                      <Text style={styles.layerIcon}>{layer.icon}</Text>
                      <Text style={styles.layerTitle}>{layer.title}</Text>
                    </View>
                    <Text style={styles.assumptionCount}>
                      {assumptions.length} assumptions extracted
                    </Text>
                    {assumptions.slice(0, 3).map((a, i) => (
                      <AssumptionCard key={i} {...a} />
                    ))}
                    {assumptions.length > 3 && (
                      <Text style={styles.moreAssumptions}>
                        +{assumptions.length - 3} more in the signal
                      </Text>
                    )}
                  </SketchPaper>
                );
              }
              const layerData = result[layer.key as keyof Phase1Result] as any;
              if (!layerData) return null;
              return (
                <LayerAccordion
                  key={layer.key}
                  icon={layer.icon}
                  title={layer.title}
                  score={layerData.score ?? 0}
                  summary={layerData.summary ?? ''}
                  details={layerData.details ?? []}
                />
              );
            })}

            <View style={styles.actionsRow}>
              <SketchButton
                label="View Signal"
                onPress={() => router.push(`/(app)/signal/${dossierId}`)}
                variant="secondary"
                size="md"
                style={styles.actionBtn}
              />
              <SketchButton
                label="Design Experiment"
                onPress={() => router.push(`/(app)/phase2/${dossierId}`)}
                variant="primary"
                size="md"
                style={styles.actionBtn}
              />
            </View>
          </>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  backBtn: { padding: 4 },
  backBtnText: {
    fontFamily: 'System',
    fontSize: fontSizes.base,
    color: colors.electric,
    fontWeight: '600',
  },
  headerTitle: {
    fontFamily: 'Kalam_700Bold',
    fontSize: fontSizes.md,
    color: colors.ink,
  },
  scroll: {
    padding: 16,
    paddingBottom: 32,
  },
  introCard: {
    marginBottom: 16,
  },
  introTitle: {
    fontFamily: 'Kalam_700Bold',
    fontSize: fontSizes.xl,
    color: colors.electric,
    marginBottom: 12,
  },
  introBody: {
    fontFamily: 'System',
    fontSize: fontSizes.sm,
    color: colors.muted,
    lineHeight: 22,
    marginBottom: 16,
  },
  runBtn: { width: '100%' },
  analyzingCard: {
    alignItems: 'center',
    padding: 32,
    gap: 16,
    marginBottom: 16,
  },
  analyzingTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  analyzingText: {
    fontFamily: 'Kalam_700Bold',
    fontSize: fontSizes.lg,
    color: colors.ink,
  },
  dotsText: {
    fontFamily: 'Kalam_700Bold',
    fontSize: fontSizes.lg,
    color: colors.electric,
    width: 24,
  },
  analyzingHint: {
    fontFamily: 'System',
    fontSize: fontSizes.sm,
    color: colors.muted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  errorCard: {
    marginBottom: 16,
    gap: 8,
  },
  errorTitle: {
    fontFamily: 'Kalam_700Bold',
    fontSize: fontSizes.lg,
    color: colors.coral,
  },
  errorBody: {
    fontFamily: 'System',
    fontSize: fontSizes.sm,
    color: colors.muted,
  },
  retryBtn: { marginTop: 8 },
  tvsRingContainer: {
    alignItems: 'center',
    marginVertical: 20,
    gap: 8,
  },
  tvsLabel: {
    fontFamily: 'System',
    fontSize: fontSizes.sm,
    color: colors.muted,
  },
  breakdownCard: {
    marginBottom: 16,
  },
  breakdownTitle: {
    fontFamily: 'Kalam_700Bold',
    fontSize: fontSizes.base,
    color: colors.electric,
    marginBottom: 12,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  barLabel: {
    fontFamily: typography.mono,
    fontSize: fontSizes.xs,
    color: colors.muted,
    width: 20,
  },
  barTrack: {
    flex: 1,
    height: 10,
    backgroundColor: colors.border,
    borderRadius: 5,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 5,
  },
  barScore: {
    fontFamily: 'Kalam_700Bold',
    fontSize: fontSizes.xs,
    width: 34,
    textAlign: 'right',
  },
  barTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  barTotalLabel: {
    fontFamily: 'Kalam_700Bold',
    fontSize: fontSizes.base,
    color: colors.ink,
  },
  barTotalValue: {
    fontFamily: 'Kalam_700Bold',
    fontSize: fontSizes.base,
    color: colors.electric,
  },
  recCard: {
    marginBottom: 16,
    gap: 10,
  },
  recBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    gap: 6,
    alignSelf: 'flex-start',
  },
  recLabel: {
    fontFamily: 'Kalam_700Bold',
    fontSize: fontSizes.md,
  },
  recReasoning: {
    fontFamily: 'System',
    fontSize: fontSizes.sm,
    color: colors.muted,
    lineHeight: 20,
  },
  layersHeader: {
    marginTop: 8,
  },
  layerCard: {
    marginBottom: 10,
  },
  layerHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  layerIcon: { fontSize: 20, marginTop: 2 },
  layerTitleBlock: { flex: 1 },
  layerTitle: {
    fontFamily: 'Kalam_700Bold',
    fontSize: fontSizes.base,
    color: colors.ink,
    marginBottom: 4,
  },
  layerSummary: {
    fontFamily: 'System',
    fontSize: fontSizes.sm,
    color: colors.muted,
    lineHeight: 20,
  },
  layerScoreBlock: {
    alignItems: 'center',
  },
  layerScore: {
    fontFamily: 'Kalam_700Bold',
    fontSize: fontSizes.xl,
  },
  layerMaxScore: {
    fontFamily: 'System',
    fontSize: fontSizes.xs,
    color: colors.muted,
  },
  accordionToggle: {
    fontFamily: 'System',
    fontSize: fontSizes.xs,
    color: colors.electric,
    marginTop: 8,
    textAlign: 'right',
  },
  layerDetails: {
    marginTop: 8,
    gap: 6,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    gap: 8,
  },
  detailBullet: {
    fontFamily: typography.mono,
    fontSize: fontSizes.sm,
    color: colors.electric,
    marginTop: 2,
  },
  detailText: {
    flex: 1,
    fontFamily: 'System',
    fontSize: fontSizes.sm,
    color: colors.ink,
    lineHeight: 20,
  },
  assumptionCount: {
    fontFamily: 'System',
    fontSize: fontSizes.sm,
    color: colors.muted,
    marginVertical: 8,
  },
  moreAssumptions: {
    fontFamily: 'System',
    fontSize: fontSizes.xs,
    color: colors.muted,
    textAlign: 'center',
    marginTop: 6,
    fontStyle: 'italic',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 16,
  },
  actionBtn: {
    flex: 1,
  },
});
