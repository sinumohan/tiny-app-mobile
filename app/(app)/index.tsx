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
import { useDossiers } from '../../src/hooks/useDossiers';
import { SketchPaper } from '../../src/components/ui/SketchPaper';
import { ScoreRing } from '../../src/components/ui/ScoreRing';
import { PhaseProgress } from '../../src/components/ui/PhaseProgress';
import { SketchButton } from '../../src/components/ui/SketchButton';
import { colors } from '../../src/lib/colors';
import { typography, fontSizes } from '../../src/lib/typography';
import { Dossier } from '../../src/lib/supabase';

function StatusBadge({ status }: { status: Dossier['status'] }) {
  const map: Record<Dossier['status'], { label: string; bg: string; text: string }> = {
    draft: { label: 'Draft', bg: colors.paperAlt, text: colors.inkMuted },
    phase1_pending: { label: 'Analysing...', bg: colors.blue, text: colors.white },
    phase1_complete: { label: 'Phase 1 Done', bg: colors.teal, text: colors.white },
    phase2_pending: { label: 'Experimenting', bg: colors.yellow, text: colors.ink },
    phase2_complete: { label: 'Phase 2 Done', bg: colors.teal, text: colors.white },
    complete: { label: 'Validated', bg: colors.teal, text: colors.white },
  };
  const badge = map[status] ?? map['draft'];

  return (
    <View style={[styles.badge, { backgroundColor: badge.bg }]}>
      <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
    </View>
  );
}

function DossierCard({ dossier, onPress }: { dossier: Dossier; onPress: () => void }) {
  const phase1Done = ['phase1_complete', 'phase2_pending', 'phase2_complete', 'complete'].includes(dossier.status);
  const phase2Done = ['phase2_complete', 'complete'].includes(dossier.status);

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <SketchPaper variant="card" style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.cardMeta}>
            <Text style={styles.ideaTitle} numberOfLines={2}>
              {dossier.idea_title || 'Untitled Idea'}
            </Text>
            <StatusBadge status={dossier.status} />
          </View>
          {dossier.ccs != null && (
            <ScoreRing score={dossier.ccs} size="sm" label="CCS" />
          )}
        </View>

        {dossier.problem_statement ? (
          <Text style={styles.problemPreview} numberOfLines={2}>
            {dossier.problem_statement}
          </Text>
        ) : null}

        <View style={styles.scoreRow}>
          {dossier.tvs != null && (
            <View style={styles.scorePill}>
              <Text style={styles.scorePillLabel}>TVS</Text>
              <Text style={[styles.scorePillValue, { color: colors.blue }]}>{dossier.tvs}</Text>
            </View>
          )}
          {dossier.mss != null && (
            <View style={styles.scorePill}>
              <Text style={styles.scorePillLabel}>MSS</Text>
              <Text style={[styles.scorePillValue, { color: colors.teal }]}>{dossier.mss}</Text>
            </View>
          )}
        </View>

        <PhaseProgress
          phase1Complete={phase1Done}
          phase2Complete={phase2Done}
          currentTVS={dossier.tvs}
          currentMSS={dossier.mss}
        />

        <Text style={styles.tapHint}>Tap to open →</Text>
      </SketchPaper>
    </TouchableOpacity>
  );
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyNotebook}>📓</Text>
      <Text style={styles.emptyTitle}>No dossiers yet</Text>
      <Text style={styles.emptySubtitle}>
        Every great startup begins with a question worth asking.
      </Text>
      <SketchButton
        label="Start your first validation →"
        onPress={onNew}
        variant="primary"
        size="lg"
        style={styles.emptyButton}
      />
    </View>
  );
}

export default function DossiersScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { dossiers, loading, error, fetchDossiers } = useDossiers(session?.user.id);

  useEffect(() => {
    fetchDossiers();
  }, [fetchDossiers]);

  const onRefresh = useCallback(() => {
    fetchDossiers();
  }, [fetchDossiers]);

  if (loading && dossiers.length === 0) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.teal} size="large" />
          <Text style={styles.loadingText}>Loading dossiers...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>tinyexperiments</Text>
        <Text style={styles.headerSub}>Your Validation Dossiers</Text>
      </View>

      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <FlatList
        data={dossiers}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={onRefresh}
            tintColor={colors.teal}
          />
        }
        renderItem={({ item }) => (
          <DossierCard
            dossier={item}
            onPress={() => router.push(`/(app)/dossier/${item.id}`)}
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
    backgroundColor: colors.paper,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.paper,
  },
  headerTitle: {
    fontFamily: 'Kalam_700Bold',
    fontSize: 28,
    color: colors.teal,
  },
  headerSub: {
    fontFamily: 'Kalam_400Regular',
    fontSize: fontSizes.sm,
    color: colors.inkMuted,
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
    fontSize: fontSizes.md,
    color: colors.ink,
    lineHeight: 22,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: fontSizes.xs,
    fontFamily: typography.body,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  problemPreview: {
    fontFamily: typography.body,
    fontSize: fontSizes.sm,
    color: colors.inkMuted,
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
    backgroundColor: colors.paperAlt,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  scorePillLabel: {
    fontFamily: typography.body,
    fontSize: fontSizes.xs,
    color: colors.inkMuted,
  },
  scorePillValue: {
    fontFamily: 'Kalam_700Bold',
    fontSize: fontSizes.base,
  },
  tapHint: {
    fontFamily: 'Kalam_400Regular',
    fontSize: fontSizes.xs,
    color: colors.inkMuted,
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
    fontFamily: 'Kalam_400Regular',
    fontSize: fontSizes.base,
    color: colors.inkMuted,
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
    fontFamily: 'Kalam_400Regular',
    fontSize: fontSizes.base,
    color: colors.inkMuted,
  },
  errorBanner: {
    backgroundColor: colors.risk,
    padding: 12,
    margin: 16,
    borderRadius: 8,
  },
  errorText: {
    color: colors.white,
    fontFamily: typography.body,
    fontSize: fontSizes.sm,
  },
});
