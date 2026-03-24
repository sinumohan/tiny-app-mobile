import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Share,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDossiers } from '../../../src/hooks/useDossiers';
import { useAuth } from '../../../src/hooks/useAuth';
import { supabase, Dossier, Assumption, Experiment } from '../../../src/lib/supabase';
import { SketchPaper } from '../../../src/components/ui/SketchPaper';
import { ScoreRing } from '../../../src/components/ui/ScoreRing';
import { PhaseProgress } from '../../../src/components/ui/PhaseProgress';
import { AssumptionCard } from '../../../src/components/ui/AssumptionCard';
import { SectionHeader } from '../../../src/components/ui/SectionHeader';
import { SketchButton } from '../../../src/components/ui/SketchButton';
import { colors } from '../../../src/lib/colors';
import { typography, fontSizes } from '../../../src/lib/typography';

function CCSFormula({ tvs, mss, ccs }: { tvs: number | null; mss: number | null; ccs: number | null }) {
  return (
    <SketchPaper variant="card" style={styles.ccsCard}>
      <Text style={styles.ccsFormula}>CCS = (TVS x 0.35) + (MSS x 0.65)</Text>
      <View style={styles.scoreRingsRow}>
        <View style={styles.scoreBlock}>
          <ScoreRing score={tvs} size="md" label="TVS" color={tvs != null ? undefined : colors.border} />
          <Text style={styles.scoreDesc}>AI Analysis</Text>
        </View>
        <View style={styles.formulaOp}>
          <Text style={styles.opText}>+</Text>
        </View>
        <View style={styles.scoreBlock}>
          <ScoreRing score={mss} size="md" label="MSS" color={mss != null ? undefined : colors.border} />
          <Text style={styles.scoreDesc}>Market Signal</Text>
        </View>
        <View style={styles.formulaOp}>
          <Text style={styles.opText}>=</Text>
        </View>
        <View style={styles.scoreBlock}>
          <ScoreRing score={ccs} size="lg" label="CCS" />
          <Text style={styles.scoreDesc}>Combined</Text>
        </View>
      </View>
    </SketchPaper>
  );
}

function ConfidenceTrajectory({ tvs, mss, ccs }: { tvs: number | null; mss: number | null; ccs: number | null }) {
  // ASCII-style sparkline trajectory
  const points = [tvs, mss, ccs].filter((v): v is number => v !== null);
  if (points.length === 0) {
    return (
      <SketchPaper variant="card" style={styles.trajectoryCard}>
        <Text style={styles.trajectoryEmpty}>
          Confidence Trajectory will appear after Phase 1 analysis.
        </Text>
      </SketchPaper>
    );
  }

  const max = 100;
  const bars = points.map((v) => Math.round((v / max) * 10));
  const barChars = '\u2581\u2582\u2583\u2584\u2585\u2586\u2587\u2588';

  return (
    <SketchPaper variant="card" style={styles.trajectoryCard}>
      <Text style={styles.trajectoryTitle}>Confidence Trajectory</Text>
      <Text style={styles.sparkline}>
        {bars.map((b) => barChars[Math.min(b - 1, 7)] || '\u2581').join('  ')}
      </Text>
      <View style={styles.trajectoryLabels}>
        {['TVS', 'MSS', 'CCS'].slice(0, points.length).map((l, i) => (
          <View key={l} style={styles.trajectoryLabelItem}>
            <Text style={styles.trajectoryLabelText}>{l}</Text>
            <Text style={styles.trajectoryLabelValue}>{points[i]}</Text>
          </View>
        ))}
      </View>
    </SketchPaper>
  );
}

export default function DossierDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const { getDossier } = useDossiers(session?.user.id);

  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [assumptions, setAssumptions] = useState<Assumption[]>([]);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const { data, error: dErr } = await getDossier(id);
      if (dErr) throw new Error(dErr.message);
      setDossier(data);

      // Assumptions
      const { data: aData } = await supabase
        .from('assumptions')
        .select('*')
        .eq('dossier_id', id)
        .order('criticality', { ascending: false });
      setAssumptions(aData ?? []);

      // Experiments
      const { data: eData } = await supabase
        .from('experiments')
        .select('*')
        .eq('dossier_id', id)
        .order('created_at', { ascending: false });
      setExperiments(eData ?? []);
    } catch (err: any) {
      setError(err.message ?? 'Failed to load dossier');
    } finally {
      setLoading(false);
    }
  }, [id, getDossier]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out my validation dossier on TinyExperiments: https://tinyexperiments.me/dossier/${id}`,
        url: `https://tinyexperiments.me/dossier/${id}`,
      });
    } catch {
      Alert.alert('Share', 'Could not share at this time.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.electric} size="large" />
          <Text style={styles.loadingText}>Loading dossier...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !dossier) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>{error ?? 'Dossier not found'}</Text>
          <SketchButton label="Go Back" onPress={() => router.back()} variant="secondary" />
        </View>
      </SafeAreaView>
    );
  }

  const phase1Done = ['phase1_complete', 'phase2_pending', 'phase2_complete', 'complete'].includes(dossier.status);
  const phase2Done = ['phase2_complete', 'complete'].includes(dossier.status);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleShare} style={styles.shareBtn}>
          <Text style={styles.shareBtnText}>Share</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Title */}
        <Text style={styles.dossierTitle}>{dossier.idea_title || 'Untitled Dossier'}</Text>

        {/* Phase Progress */}
        <SketchPaper variant="card" style={styles.section}>
          <PhaseProgress
            phase1Complete={phase1Done}
            phase2Complete={phase2Done}
            currentTVS={dossier.tvs}
            currentMSS={dossier.mss}
          />
        </SketchPaper>

        {/* Scores */}
        <CCSFormula tvs={dossier.tvs} mss={dossier.mss} ccs={dossier.ccs} />

        {/* Confidence Trajectory */}
        <ConfidenceTrajectory tvs={dossier.tvs} mss={dossier.mss} ccs={dossier.ccs} />

        {/* Actions */}
        <View style={styles.actionsRow}>
          {!phase1Done && (
            <SketchButton
              label="Run Phase 1 Analysis"
              onPress={() => router.push(`/(app)/phase1/${id}`)}
              variant="primary"
              size="md"
              style={styles.actionButton}
            />
          )}
          {phase1Done && (
            <SketchButton
              label="Design Phase 2 Experiment"
              onPress={() => router.push(`/(app)/phase2/${id}`)}
              variant={phase2Done ? 'secondary' : 'primary'}
              size="md"
              style={styles.actionButton}
            />
          )}
          {phase1Done && (
            <SketchButton
              label="View Analysis"
              onPress={() => router.push(`/(app)/phase1/${id}`)}
              variant="secondary"
              size="md"
              style={styles.actionButton}
            />
          )}
        </View>

        {/* Idea Summary */}
        <SectionHeader title="Idea Brief" style={styles.sectionHeader} />
        <SketchPaper variant="card" hasMarginLine style={styles.section}>
          {[
            { label: 'Problem', value: dossier.problem_statement },
            { label: 'Alternatives', value: dossier.current_alternatives },
            { label: 'Behavior Change', value: dossier.behavior_change_reason },
            { label: 'Target Customer', value: dossier.target_customer },
            { label: 'Unfair Advantage', value: dossier.unfair_advantage },
            { label: 'Kill Assumption', value: dossier.kill_assumption },
          ].map(({ label, value }) => (
            <View key={label} style={styles.briefRow}>
              <Text style={styles.briefLabel}>{label}</Text>
              <Text style={styles.briefValue}>{value}</Text>
            </View>
          ))}
        </SketchPaper>

        {/* Assumption Stack */}
        {assumptions.length > 0 && (
          <>
            <SectionHeader
              title="Assumption Stack"
              subtitle={`${assumptions.length} assumptions extracted`}
              style={styles.sectionHeader}
            />
            {assumptions.map((a) => (
              <AssumptionCard key={a.id} {...a} />
            ))}
          </>
        )}

        {/* Experiment Log */}
        {experiments.length > 0 && (
          <>
            <SectionHeader
              title="Experiment Log"
              subtitle={`${experiments.length} experiments`}
              style={styles.sectionHeader}
            />
            {experiments.map((exp) => (
              <SketchPaper key={exp.id} variant="card" style={styles.experimentCard}>
                <Text style={styles.expBrand}>{exp.tiny_brand_name}</Text>
                <Text style={styles.expHypothesis}>{exp.hypothesis}</Text>
                <View style={styles.expMetrics}>
                  {exp.unique_visitors != null && (
                    <View style={styles.expMetric}>
                      <Text style={styles.expMetricValue}>{exp.unique_visitors}</Text>
                      <Text style={styles.expMetricLabel}>Visitors</Text>
                    </View>
                  )}
                  {exp.conversions != null && (
                    <View style={styles.expMetric}>
                      <Text style={styles.expMetricValue}>{exp.conversions}</Text>
                      <Text style={styles.expMetricLabel}>Conversions</Text>
                    </View>
                  )}
                  {exp.mss != null && (
                    <ScoreRing score={exp.mss} size="sm" label="MSS" />
                  )}
                </View>
              </SketchPaper>
            ))}
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
  backBtn: {
    padding: 4,
  },
  backBtnText: {
    fontFamily: 'System',
    fontSize: fontSizes.base,
    color: colors.electric,
    fontWeight: '600',
  },
  shareBtn: {
    backgroundColor: colors.electricLight,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.electric,
  },
  shareBtnText: {
    fontFamily: 'System',
    fontSize: fontSizes.sm,
    color: colors.electric,
    fontWeight: '600',
  },
  scroll: {
    padding: 16,
    paddingBottom: 32,
  },
  dossierTitle: {
    fontFamily: 'Kalam_700Bold',
    fontSize: fontSizes['2xl'],
    color: colors.ink,
    marginBottom: 16,
    lineHeight: 36,
  },
  section: {
    marginBottom: 12,
  },
  sectionHeader: {
    marginTop: 8,
  },
  actionsRow: {
    gap: 10,
    marginBottom: 16,
  },
  actionButton: {
    width: '100%',
  },
  ccsCard: {
    marginBottom: 12,
    alignItems: 'center',
  },
  ccsFormula: {
    fontFamily: 'System',
    fontSize: fontSizes.xs,
    color: colors.muted,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  scoreRingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  scoreBlock: {
    alignItems: 'center',
    gap: 4,
  },
  scoreDesc: {
    fontFamily: 'System',
    fontSize: fontSizes.xs,
    color: colors.muted,
  },
  formulaOp: {
    alignItems: 'center',
    paddingTop: 8,
  },
  opText: {
    fontFamily: 'Kalam_700Bold',
    fontSize: fontSizes.xl,
    color: colors.muted,
  },
  trajectoryCard: {
    marginBottom: 16,
  },
  trajectoryTitle: {
    fontFamily: 'Kalam_700Bold',
    fontSize: fontSizes.base,
    color: colors.electric,
    marginBottom: 8,
  },
  trajectoryEmpty: {
    fontFamily: 'System',
    fontSize: fontSizes.sm,
    color: colors.muted,
    fontStyle: 'italic',
  },
  sparkline: {
    fontFamily: 'Courier New',
    fontSize: 28,
    color: colors.electric,
    letterSpacing: 4,
    marginBottom: 8,
  },
  trajectoryLabels: {
    flexDirection: 'row',
    gap: 24,
  },
  trajectoryLabelItem: {
    alignItems: 'center',
  },
  trajectoryLabelText: {
    fontFamily: 'System',
    fontSize: fontSizes.xs,
    color: colors.muted,
    textTransform: 'uppercase',
  },
  trajectoryLabelValue: {
    fontFamily: 'Kalam_700Bold',
    fontSize: fontSizes.base,
    color: colors.ink,
  },
  briefRow: {
    marginBottom: 12,
  },
  briefLabel: {
    fontFamily: 'Kalam_700Bold',
    fontSize: fontSizes.sm,
    color: colors.electric,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  briefValue: {
    fontFamily: 'System',
    fontSize: fontSizes.base,
    color: colors.ink,
    lineHeight: 22,
  },
  experimentCard: {
    marginBottom: 10,
  },
  expBrand: {
    fontFamily: 'Kalam_700Bold',
    fontSize: fontSizes.md,
    color: colors.electric,
    marginBottom: 4,
  },
  expHypothesis: {
    fontFamily: 'System',
    fontSize: fontSizes.sm,
    color: colors.muted,
    marginBottom: 10,
    lineHeight: 20,
  },
  expMetrics: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  expMetric: {
    alignItems: 'center',
  },
  expMetricValue: {
    fontFamily: 'Kalam_700Bold',
    fontSize: fontSizes.lg,
    color: colors.ink,
  },
  expMetricLabel: {
    fontFamily: 'System',
    fontSize: fontSizes.xs,
    color: colors.muted,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  loadingText: {
    fontFamily: 'System',
    fontSize: fontSizes.base,
    color: colors.muted,
  },
  errorText: {
    fontFamily: 'System',
    fontSize: fontSizes.base,
    color: colors.coral,
    textAlign: 'center',
    marginBottom: 16,
  },
});
