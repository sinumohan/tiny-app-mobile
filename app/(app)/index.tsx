import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/hooks/useAuth';
import { useSignals } from '../../src/hooks/useSignals';
import { SketchPaper } from '../../src/components/ui/SketchPaper';
import { ScoreRing } from '../../src/components/ui/ScoreRing';
import { PhaseProgress } from '../../src/components/ui/PhaseProgress';
import { SketchButton } from '../../src/components/ui/SketchButton';
import { colors } from '../../src/lib/colors';
import { typography, fontSizes } from '../../src/lib/typography';
import { Signal } from '../../src/lib/supabase';

function StatusBadge({ status }: { status: Signal['status'] }) {
  const map: Record<Signal['status'], { label: string; bg: string; text: string }> = {
    draft: { label: 'Draft', bg: colors.surfaceAlt, text: colors.muted },
    phase1_pending: { label: 'Analysing...', bg: colors.sky, text: colors.white },
    phase1_complete: { label: 'Phase 1 Done', bg: colors.mint, text: colors.white },
    phase2_pending: { label: 'Experimenting', bg: colors.electric, text: colors.white },
    phase2_complete: { label: 'Phase 2 Done', bg: colors.mint, text: colors.white },
    complete: { label: 'Validated', bg: colors.mint, text: colors.white },
  };
  const badge = map[status] ?? map['draft'];

  return (
    <View style={[styles.badge, { backgroundColor: badge.bg }]}>
      <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
    </View>
  );
}

function SignalCard({ signal, onPress }: { signal: Signal; onPress: () => void }) {
  const phase1Done = ['phase1_complete', 'phase2_pending', 'phase2_complete', 'complete'].includes(signal.status);
  const phase2Done = ['phase2_complete', 'complete'].includes(signal.status);

  const statusBorderColor =
    signal.status === 'complete' ? colors.statusComplete :
    signal.status === 'draft' ? colors.statusDraft :
    signal.status.startsWith('phase2') ? colors.mint :
    colors.statusInProgress;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <SketchPaper variant="card" style={[styles.card, { borderLeftWidth: 3, borderLeftColor: statusBorderColor }]}>
        <View style={styles.cardHeader}>
          <View style={styles.cardMeta}>
            <Text style={styles.ideaTitle} numberOfLines={2}>
              {signal.idea_title || 'Untitled Idea'}
            </Text>
            <StatusBadge status={signal.status} />
          </View>
          {signal.ccs != null && (
            <ScoreRing score={signal.ccs} size="sm" label="CCS" />
          )}
        </View>

        {signal.problem_statement ? (
          <Text style={styles.problemPreview} numberOfLines={2}>
            {signal.problem_statement}
          </Text>
        ) : null}

        <View style={styles.scoreRow}>
          {signal.tvs != null && (
            <View style={styles.scorePill}>
              <Text style={styles.scorePillLabel}>TVS</Text>
              <Text style={[styles.scorePillValue, { color: colors.sky }]}>{signal.tvs}</Text>
            </View>
          )}
          {signal.mss != null && (
            <View style={styles.scorePill}>
              <Text style={styles.scorePillLabel}>MSS</Text>
              <Text style={[styles.scorePillValue, { color: colors.mint }]}>{signal.mss}</Text>
            </View>
          )}
        </View>

        <PhaseProgress
          phase1Complete={phase1Done}
          phase2Complete={phase2Done}
          currentTVS={signal.tvs}
          currentMSS={signal.mss}
        />

        <Text style={styles.tapHint}>Tap to open</Text>
      </SketchPaper>
    </TouchableOpacity>
  );
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyNotebook}>{'\uD83D\uDCD3'}</Text>
      <Text style={styles.emptyTitle}>No signals yet</Text>
      <Text style={styles.emptySubtitle}>
        Every great startup begins with a question worth asking.
      </Text>
      <SketchButton
        label="Start your first validation"
        onPress={onNew}
        variant="primary"
        size="lg"
        style={styles.emptyButton}
      />
    </View>
  );
}

export default function SignalsScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { signals, loading, error, fetchSignals } = useSignals(session?.user.id);

  useEffect(() => {
    fetchSignals();
  }, [fetchSignals]);

  const onRefresh = useCallback(() => {
    fetchSignals();
  }, [fetchSignals]);

  if (loading && signals.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.electric} size="large" />
          <Text style={styles.loadingText}>Loading signals...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Signals</Text>
        <Text style={styles.headerSub}>Your signals</Text>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={signals}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={onRefresh}
            tintColor={colors.electric}
          />
        }
        renderItem={({ item }) => (
          <SignalCard
            signal={item}
            onPress={() => router.push(`/(app)/signal/${item.id}`)}
          />
        )}
        ListEmptyComponent={
          !loading ? <EmptyState onNew={() => router.push('/(app)/new')} /> : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  headerTitle: {
    fontFamily: 'Kalam_700Bold',
    fontSize: 28,
    color: colors.ink,
  },
  headerSub: {
    fontFamily: 'System',
    fontSize: fontSizes.sm,
    color: colors.muted,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  card: {
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardMeta: {
    flex: 1,
    marginRight: 12,
    gap: 6,
  },
  ideaTitle: {
    fontFamily: 'Kalam_700Bold',
    fontSize: fontSizes.lg,
    color: colors.ink,
    lineHeight: 26,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: fontSizes.xs,
    fontFamily: 'System',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    fontWeight: '600',
  },
  problemPreview: {
    fontFamily: 'System',
    fontSize: fontSizes.sm,
    color: colors.muted,
    lineHeight: 20,
  },
  scoreRow: {
    flexDirection: 'row',
    gap: 10,
  },
  scorePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  scorePillLabel: {
    fontFamily: 'System',
    fontSize: fontSizes.xs,
    color: colors.muted,
  },
  scorePillValue: {
    fontFamily: 'Kalam_700Bold',
    fontSize: fontSizes.base,
  },
  tapHint: {
    fontFamily: 'System',
    fontSize: fontSizes.xs,
    color: colors.placeholder,
    textAlign: 'right',
    marginTop: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 32,
  },
  emptyNotebook: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: 'Kalam_700Bold',
    fontSize: fontSizes.xl,
    color: colors.ink,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: 'System',
    fontSize: fontSizes.base,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  emptyButton: {
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    fontFamily: 'System',
    fontSize: fontSizes.base,
    color: colors.muted,
  },
  errorBanner: {
    backgroundColor: colors.coral,
    padding: 12,
    margin: 16,
    borderRadius: 8,
  },
  errorText: {
    color: colors.white,
    fontFamily: 'System',
    fontSize: fontSizes.sm,
  },
});
