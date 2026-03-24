import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/hooks/useAuth';
import { SketchPaper } from '../../src/components/ui/SketchPaper';
import { SketchButton } from '../../src/components/ui/SketchButton';
import { SectionHeader } from '../../src/components/ui/SectionHeader';
import { colors } from '../../src/lib/colors';
import { typography, fontSizes } from '../../src/lib/typography';
import Constants from 'expo-constants';

const PLAN_CONFIG = {
  free: { label: 'Free', bg: colors.border, text: colors.muted },
  pro: { label: 'Pro', bg: colors.electric, text: colors.white },
  founder: { label: 'Founder+', bg: colors.mint, text: colors.white },
};

type Plan = keyof typeof PLAN_CONFIG;

function PlanBadge({ plan }: { plan: Plan }) {
  const config = PLAN_CONFIG[plan] ?? PLAN_CONFIG.free;
  return (
    <View style={[styles.planBadge, { backgroundColor: config.bg }]}>
      <Text style={[styles.planBadgeText, { color: config.text }]}>{config.label}</Text>
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { session, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const user = session?.user;
  const plan: Plan = (user?.user_metadata?.plan as Plan) ?? 'free';
  const appVersion = Constants.expoConfig?.version ?? '0.1.0';

  const handleSignOut = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          setSigningOut(true);
          await signOut();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profile</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Avatar block */}
        <View style={styles.avatarBlock}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.email?.charAt(0).toUpperCase() ?? 'U'}
            </Text>
          </View>
          <Text style={styles.emailText}>{user?.email ?? 'Unknown'}</Text>
          <PlanBadge plan={plan} />
        </View>

        {/* Account info */}
        <SectionHeader title="Account" style={styles.sectionHeader} />
        <SketchPaper variant="card" style={styles.card}>
          <InfoRow label="Email" value={user?.email ?? '--'} />
          <InfoRow label="Plan" value={PLAN_CONFIG[plan]?.label ?? 'Free'} />
          <InfoRow
            label="Member since"
            value={
              user?.created_at
                ? new Date(user.created_at).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })
                : '--'
            }
          />
        </SketchPaper>

        {/* Plan comparison */}
        <SectionHeader title="Plans" style={styles.sectionHeader} />
        <SketchPaper variant="card" style={styles.card}>
          {[
            { plan: 'Free', features: ['3 dossiers', 'Phase 1 analysis', 'Basic scoring'] },
            { plan: 'Pro', features: ['Unlimited dossiers', 'Phase 1 + 2', 'Full Dossier', 'Export PDF'] },
            {
              plan: 'Founder+',
              features: ['Everything in Pro', 'Custom brand identity', 'Investor share links', 'Priority support'],
            },
          ].map(({ plan: p, features }) => (
            <View key={p} style={styles.planRow}>
              <View style={styles.planRowHeader}>
                <Text style={styles.planRowName}>{p}</Text>
                {p.toLowerCase().replace('+', '') === plan && (
                  <View style={styles.currentBadge}>
                    <Text style={styles.currentBadgeText}>Current</Text>
                  </View>
                )}
              </View>
              {features.map((f) => (
                <Text key={f} style={styles.featureText}>
                  {'\u2713'} {f}
                </Text>
              ))}
              {p === 'Free' ? null : (
                <TouchableOpacity
                  style={styles.upgradeBtn}
                  onPress={() => Alert.alert('Coming Soon', 'Plan upgrades will be available in the next release.')}
                >
                  <Text style={styles.upgradeBtnText}>Upgrade to {p}</Text>
                </TouchableOpacity>
              )}
              <View style={styles.planDivider} />
            </View>
          ))}
        </SketchPaper>

        {/* App info */}
        <SectionHeader title="App" style={styles.sectionHeader} />
        <SketchPaper variant="card" style={styles.card}>
          <InfoRow label="Version" value={`v${appVersion}`} />
          <InfoRow label="Platform" value="React Native + Expo" />
          <InfoRow label="Backend" value="Supabase" />
          <InfoRow label="Made by" value="tinyexperiments.me" />
        </SketchPaper>

        <SketchButton
          label="Sign Out"
          onPress={handleSignOut}
          variant="danger"
          size="lg"
          loading={signingOut}
          style={styles.signOutBtn}
        />

        <Text style={styles.footer}>
          tinyexperiments.me -- Structured Founder Validation
        </Text>

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
  scroll: {
    padding: 16,
    paddingBottom: 32,
  },
  avatarBlock: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 10,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.electric,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: 'Kalam_700Bold',
    fontSize: 36,
    color: colors.white,
  },
  emailText: {
    fontFamily: 'System',
    fontSize: fontSizes.base,
    color: colors.ink,
  },
  planBadge: {
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 6,
  },
  planBadgeText: {
    fontFamily: 'Kalam_700Bold',
    fontSize: fontSizes.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  sectionHeader: {
    marginTop: 8,
  },
  card: {
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    fontFamily: 'System',
    fontSize: fontSizes.sm,
    color: colors.muted,
  },
  infoValue: {
    fontFamily: 'System',
    fontSize: fontSizes.sm,
    color: colors.ink,
    maxWidth: '60%',
    textAlign: 'right',
  },
  planRow: {
    marginBottom: 8,
  },
  planRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  planRowName: {
    fontFamily: 'Kalam_700Bold',
    fontSize: fontSizes.base,
    color: colors.ink,
  },
  currentBadge: {
    backgroundColor: colors.electric,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  currentBadgeText: {
    fontFamily: 'System',
    fontSize: fontSizes.xs,
    color: colors.white,
  },
  featureText: {
    fontFamily: 'System',
    fontSize: fontSizes.sm,
    color: colors.muted,
    paddingLeft: 8,
    lineHeight: 22,
  },
  upgradeBtn: {
    marginTop: 8,
    backgroundColor: colors.electric,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  upgradeBtnText: {
    fontFamily: 'Kalam_700Bold',
    fontSize: fontSizes.sm,
    color: colors.white,
  },
  planDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginTop: 12,
  },
  signOutBtn: {
    width: '100%',
    marginTop: 8,
    marginBottom: 16,
  },
  footer: {
    fontFamily: 'System',
    fontSize: fontSizes.xs,
    color: colors.muted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
