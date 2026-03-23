import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../src/hooks/useAuth';
import { supabase, Experiment, Assumption } from '../../../src/lib/supabase';
import { SketchPaper } from '../../../src/components/ui/SketchPaper';
import { SketchButton } from '../../../src/components/ui/SketchButton';
import { SketchField } from '../../../src/components/ui/SketchField';
import { SectionHeader } from '../../../src/components/ui/SectionHeader';
import { ScoreRing } from '../../../src/components/ui/ScoreRing';
import { AssumptionCard } from '../../../src/components/ui/AssumptionCard';
import { colors } from '../../../src/lib/colors';
import { typography, fontSizes } from '../../../src/lib/typography';

type WizardStep = 'hypothesis' | 'brand' | 'results' | 'review';

function computeMSS(inputs: {
  visitors: number;
  conversions: number;
  spend: number;
  audienceMatchRating: number; // 1-5
  intentAlignmentRating: number; // 1-5
  engagementRating: number; // 1-5
}): number {
  const { visitors, conversions, spend, audienceMatchRating, intentAlignmentRating, engagementRating } = inputs;

  // Conversion Rate (25 pts): 0-25 based on CVR %
  const cvr = visitors > 0 ? conversions / visitors : 0;
  const conversionScore = Math.min(25, cvr * 100 * 5); // 5% CVR = 25pts

  // Cost Efficiency (25 pts): based on CPA
  const cpa = conversions > 0 ? spend / conversions : spend;
  const cpaScore = cpa <= 0 ? 0 : Math.min(25, Math.max(0, 25 - (cpa / 20) * 25));

  // Audience Match (20 pts): from 1-5 rating → 0-20
  const audienceScore = ((audienceMatchRating - 1) / 4) * 20;

  // Intent Alignment (15 pts): from 1-5 rating → 0-15
  const intentScore = ((intentAlignmentRating - 1) / 4) * 15;

  // Engagement Quality (15 pts): from 1-5 rating → 0-15
  const engagementScore = ((engagementRating - 1) / 4) * 15;

  return Math.round(conversionScore + cpaScore + audienceScore + intentScore + engagementScore);
}

function ExperimentWizard({
  dossierId,
  assumptions,
  onClose,
  onComplete,
}: {
  dossierId: string;
  assumptions: Assumption[];
  onClose: () => void;
  onComplete: () => void;
}) {
  const [step, setStep] = useState<WizardStep>('hypothesis');
  const [selectedAssumption, setSelectedAssumption] = useState<Assumption | null>(null);
  const [hypothesis, setHypothesis] = useState('');
  const [brandName, setBrandName] = useState('');
  const [brandOptions] = useState(['TinyPilot', 'QuickValidate', 'NanoLaunch']);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [landingUrl, setLandingUrl] = useState('');
  const [visitors, setVisitors] = useState('');
  const [conversions, setConversions] = useState('');
  const [spend, setSpend] = useState('');
  const [audienceMatchRating, setAudienceMatchRating] = useState(3);
  const [intentAlignmentRating, setIntentAlignmentRating] = useState(3);
  const [engagementRating, setEngagementRating] = useState(3);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const topAssumption = assumptions
    .filter((a) => !a.is_tested)
    .sort((a, b) => b.criticality - a.criticality || a.evidence_level - b.evidence_level)[0];

  const mss = visitors && conversions && spend
    ? computeMSS({
        visitors: +visitors,
        conversions: +conversions,
        spend: +spend,
        audienceMatchRating,
        intentAlignmentRating,
        engagementRating,
      })
    : null;

  const validateResults = (): boolean => {
    const errors: Record<string, string> = {};
    const v = +visitors;
    const c = +conversions;
    const s = +spend;

    if (isNaN(v) || v < 0) {
      errors.visitors = 'Visitors must be 0 or more.';
    }
    if (isNaN(c) || c < 0) {
      errors.conversions = 'Conversions must be 0 or more.';
    } else if (v >= 0 && c > v) {
      errors.conversions = 'Conversions cannot exceed visitors.';
    }
    if (isNaN(s) || s < 0) {
      errors.spend = 'Spend must be 0 or more.';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!dossierId) return;
    if (!validateResults()) return;

    setSaving(true);
    try {
      const v = +visitors || 0;
      const c = +conversions || 0;
      const s = +spend || 0;
      const calculatedMss = computeMSS({
        visitors: v,
        conversions: c,
        spend: s,
        audienceMatchRating,
        intentAlignmentRating,
        engagementRating,
      });

      // Insert experiment first
      const { data: exp, error: expErr } = await supabase
        .from('experiments')
        .insert({
          dossier_id: dossierId,
          hypothesis: hypothesis || selectedAssumption?.assumption_text,
          tiny_brand_name: selectedBrand || brandName,
          landing_page_url: landingUrl || null,
          unique_visitors: v,
          conversions: c,
          spend: s,
          mss: calculatedMss,
          status: 'complete',
        })
        .select()
        .single();

      if (expErr) throw expErr;

      // Then update dossier status
      const { error: dossierErr } = await supabase
        .from('dossiers')
        .update({ mss: calculatedMss, status: 'phase2_complete' })
        .eq('id', dossierId);

      if (dossierErr) {
        // Rollback the experiment insert
        await supabase.from('experiments').delete().eq('id', exp.id);
        throw dossierErr;
      }

      onComplete();
    } catch (err: any) {
      Alert.alert('Error', 'Failed to save experiment. Please try again.');
      console.error('[phase2-save]', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalSafe}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Design Experiment</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeBtnText}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Step tabs */}
        <View style={styles.wizardTabs}>
          {(['hypothesis', 'brand', 'results', 'review'] as WizardStep[]).map((s, i) => (
            <View
              key={s}
              style={[styles.wizardTab, step === s && styles.wizardTabActive]}
            >
              <Text style={[styles.wizardTabText, step === s && styles.wizardTabTextActive]}>
                {i + 1}
              </Text>
            </View>
          ))}
        </View>

        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView contentContainerStyle={styles.wizardScroll} keyboardShouldPersistTaps="handled">
            {step === 'hypothesis' && (
              <View style={styles.wizardStep}>
                <Text style={styles.wizardStepTitle}>Select Hypothesis</Text>
                {topAssumption && (
                  <>
                    <Text style={styles.wizardHint}>
                      Recommended — highest criticality, lowest evidence:
                    </Text>
                    <TouchableOpacity
                      onPress={() => {
                        setSelectedAssumption(topAssumption);
                        setHypothesis(topAssumption.assumption_text);
                      }}
                    >
                      <AssumptionCard {...topAssumption} />
                    </TouchableOpacity>
                  </>
                )}
                <SketchField
                  label="Or write your hypothesis"
                  value={hypothesis}
                  onChangeText={setHypothesis}
                  multiline
                  placeholder="We believe [target customer] will [behavior] because [reason]..."
                  minLength={20}
                />
                <SketchButton
                  label="Next: Choose Brand →"
                  onPress={() => hypothesis.length > 10 && setStep('brand')}
                  variant="primary"
                  disabled={hypothesis.length < 10}
                />
              </View>
            )}

            {step === 'brand' && (
              <View style={styles.wizardStep}>
                <Text style={styles.wizardStepTitle}>Choose Tiny Brand</Text>
                <Text style={styles.wizardHint}>AI-generated brand names for this experiment:</Text>
                <View style={styles.brandOptions}>
                  {brandOptions.map((name) => (
                    <TouchableOpacity
                      key={name}
                      onPress={() => setSelectedBrand(name)}
                      style={[
                        styles.brandOption,
                        selectedBrand === name && styles.brandOptionSelected,
                      ]}
                    >
                      <Text style={[
                        styles.brandOptionText,
                        selectedBrand === name && styles.brandOptionTextSelected,
                      ]}>
                        {name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <SketchField
                  label="Or enter custom brand name"
                  value={brandName}
                  onChangeText={(t) => { setBrandName(t); setSelectedBrand(t); }}
                  placeholder="YourBrandName"
                />
                <SketchField
                  label="Landing page URL (optional)"
                  value={landingUrl}
                  onChangeText={setLandingUrl}
                  placeholder="https://..."
                />
                <View style={styles.brandNavRow}>
                  <SketchButton label="← Back" onPress={() => setStep('hypothesis')} variant="ghost" />
                  <SketchButton
                    label="Next: Record Results →"
                    onPress={() => (selectedBrand || brandName) && setStep('results')}
                    variant="primary"
                    disabled={!selectedBrand && !brandName}
                  />
                </View>
              </View>
            )}

            {step === 'results' && (
              <View style={styles.wizardStep}>
                <Text style={styles.wizardStepTitle}>Record Campaign Results</Text>
                <SketchField
                  label="Unique Visitors"
                  value={visitors}
                  onChangeText={(t) => { setVisitors(t); setValidationErrors((e) => ({ ...e, visitors: '' })); }}
                  placeholder="e.g. 250"
                />
                {!!validationErrors.visitors && (
                  <Text style={styles.validationError}>{validationErrors.visitors}</Text>
                )}
                <SketchField
                  label="Conversions (sign-ups / clicks)"
                  value={conversions}
                  onChangeText={(t) => { setConversions(t); setValidationErrors((e) => ({ ...e, conversions: '' })); }}
                  placeholder="e.g. 12"
                />
                {!!validationErrors.conversions && (
                  <Text style={styles.validationError}>{validationErrors.conversions}</Text>
                )}
                <SketchField
                  label="Ad Spend (USD)"
                  value={spend}
                  onChangeText={(t) => { setSpend(t); setValidationErrors((e) => ({ ...e, spend: '' })); }}
                  placeholder="e.g. 50"
                />
                {!!validationErrors.spend && (
                  <Text style={styles.validationError}>{validationErrors.spend}</Text>
                )}

                {/* Qualitative ratings (1-5) */}
                <Text style={styles.wizardHint}>Rate the qualitative signals (1 = poor, 5 = excellent):</Text>

                <View style={styles.ratingRow}>
                  <Text style={styles.ratingLabel}>Audience Match</Text>
                  <View style={styles.ratingPips}>
                    {[1,2,3,4,5].map((n) => (
                      <TouchableOpacity key={n} onPress={() => setAudienceMatchRating(n)}>
                        <View style={[styles.ratingPip, audienceMatchRating >= n && styles.ratingPipActive]}>
                          <Text style={[styles.ratingPipText, audienceMatchRating >= n && styles.ratingPipTextActive]}>{n}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.ratingRow}>
                  <Text style={styles.ratingLabel}>Intent Alignment</Text>
                  <View style={styles.ratingPips}>
                    {[1,2,3,4,5].map((n) => (
                      <TouchableOpacity key={n} onPress={() => setIntentAlignmentRating(n)}>
                        <View style={[styles.ratingPip, intentAlignmentRating >= n && styles.ratingPipActive]}>
                          <Text style={[styles.ratingPipText, intentAlignmentRating >= n && styles.ratingPipTextActive]}>{n}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.ratingRow}>
                  <Text style={styles.ratingLabel}>Engagement Quality</Text>
                  <View style={styles.ratingPips}>
                    {[1,2,3,4,5].map((n) => (
                      <TouchableOpacity key={n} onPress={() => setEngagementRating(n)}>
                        <View style={[styles.ratingPip, engagementRating >= n && styles.ratingPipActive]}>
                          <Text style={[styles.ratingPipText, engagementRating >= n && styles.ratingPipTextActive]}>{n}</Text>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                {mss !== null && (
                  <View style={styles.mssPreview}>
                    <Text style={styles.mssPreviewLabel}>Estimated MSS</Text>
                    <ScoreRing score={mss} size="md" label="MSS" />
                    <Text style={styles.mssFormula}>
                      CVR: {visitors ? ((+conversions / +visitors) * 100).toFixed(1) : '—'}% ·
                      CPA: ${spend && conversions ? (+spend / +conversions).toFixed(2) : '—'}
                    </Text>
                  </View>
                )}
                <View style={styles.brandNavRow}>
                  <SketchButton label="← Back" onPress={() => setStep('brand')} variant="ghost" />
                  <SketchButton
                    label="Review →"
                    onPress={() => {
                      if (validateResults()) setStep('review');
                    }}
                    variant="primary"
                    disabled={!visitors}
                  />
                </View>
              </View>
            )}

            {step === 'review' && (
              <View style={styles.wizardStep}>
                <Text style={styles.wizardStepTitle}>Review & Close</Text>
                <SketchPaper variant="card" hasMarginLine style={styles.reviewCard}>
                  <Text style={styles.reviewLabel}>Hypothesis</Text>
                  <Text style={styles.reviewValue}>{hypothesis}</Text>
                  <Text style={styles.reviewLabel}>Brand</Text>
                  <Text style={styles.reviewValue}>{selectedBrand || brandName}</Text>
                  {landingUrl ? (
                    <>
                      <Text style={styles.reviewLabel}>Landing Page</Text>
                      <Text style={[styles.reviewValue, { color: colors.blue }]}>{landingUrl}</Text>
                    </>
                  ) : null}
                  <Text style={styles.reviewLabel}>Results</Text>
                  <Text style={styles.reviewValue}>
                    {visitors} visitors · {conversions} conversions · ${spend} spend
                  </Text>
                  {mss !== null && (
                    <View style={styles.mssPreview}>
                      <ScoreRing score={mss} size="lg" label="MSS" />
                    </View>
                  )}
                </SketchPaper>
                <View style={styles.brandNavRow}>
                  <SketchButton label="← Back" onPress={() => setStep('results')} variant="ghost" />
                  <SketchButton
                    label="Close Experiment"
                    onPress={handleSave}
                    variant="primary"
                    loading={saving}
                  />
                </View>
              </View>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

export default function Phase2Screen() {
  const { dossierId } = useLocalSearchParams<{ dossierId: string }>();
  const router = useRouter();
  const { session } = useAuth();

  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [assumptions, setAssumptions] = useState<Assumption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);

  const loadData = useCallback(async () => {
    if (!dossierId) return;
    setLoading(true);
    try {
      const [{ data: eData }, { data: aData }] = await Promise.all([
        supabase.from('experiments').select('*').eq('dossier_id', dossierId).order('created_at', { ascending: false }),
        supabase.from('assumptions').select('*').eq('dossier_id', dossierId).order('criticality', { ascending: false }),
      ]);
      setExperiments(eData ?? []);
      setAssumptions(aData ?? []);
    } finally {
      setLoading(false);
    }
  }, [dossierId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Phase 2 — Experiments</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator color={colors.teal} size="large" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <SketchPaper variant="card" hasMarginLine style={styles.introCard}>
            <Text style={styles.introTitle}>Tiny Brand Experiments</Text>
            <Text style={styles.introBody}>
              Run real experiments with disposable brands and landing pages.
              Each experiment tests one key assumption and produces a Market Signal Score (MSS /100).
            </Text>
          </SketchPaper>

          <SketchButton
            label="+ Design New Experiment"
            onPress={() => setShowWizard(true)}
            variant="primary"
            size="lg"
            style={styles.newExpBtn}
          />

          {experiments.length > 0 && (
            <>
              <SectionHeader
                title="Experiment Log"
                subtitle={`${experiments.length} experiments`}
                style={styles.sectionHeader}
              />
              {experiments.map((exp) => (
                <SketchPaper key={exp.id} variant="card" style={styles.expCard}>
                  <View style={styles.expHeader}>
                    <View style={styles.expInfo}>
                      <Text style={styles.expBrand}>{exp.tiny_brand_name}</Text>
                      <View style={[
                        styles.statusBadge,
                        exp.status === 'complete' && styles.statusBadgeDone,
                      ]}>
                        <Text style={styles.statusBadgeText}>{exp.status}</Text>
                      </View>
                    </View>
                    {exp.mss != null && <ScoreRing score={exp.mss} size="sm" label="MSS" />}
                  </View>
                  <Text style={styles.expHypothesis}>{exp.hypothesis}</Text>
                  {(exp.unique_visitors != null || exp.conversions != null) && (
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
                      {exp.spend != null && (
                        <View style={styles.expMetric}>
                          <Text style={styles.expMetricValue}>${exp.spend}</Text>
                          <Text style={styles.expMetricLabel}>Spend</Text>
                        </View>
                      )}
                      {exp.unique_visitors && exp.conversions ? (
                        <View style={styles.expMetric}>
                          <Text style={styles.expMetricValue}>
                            {((exp.conversions / exp.unique_visitors) * 100).toFixed(1)}%
                          </Text>
                          <Text style={styles.expMetricLabel}>CVR</Text>
                        </View>
                      ) : null}
                    </View>
                  )}
                </SketchPaper>
              ))}
            </>
          )}

          {experiments.length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🧪</Text>
              <Text style={styles.emptyTitle}>No experiments yet</Text>
              <Text style={styles.emptyBody}>
                Start testing your highest-criticality assumptions with real disposable brands.
              </Text>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {showWizard && (
        <ExperimentWizard
          dossierId={dossierId ?? ''}
          assumptions={assumptions}
          onClose={() => setShowWizard(false)}
          onComplete={() => {
            setShowWizard(false);
            loadData();
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: 4 },
  backBtnText: {
    fontFamily: 'Kalam_400Regular',
    fontSize: fontSizes.base,
    color: colors.teal,
  },
  headerTitle: {
    fontFamily: 'Kalam_700Bold',
    fontSize: fontSizes.md,
    color: colors.ink,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: { padding: 16, paddingBottom: 32 },
  introCard: { marginBottom: 16 },
  introTitle: {
    fontFamily: 'Kalam_700Bold',
    fontSize: fontSizes.xl,
    color: colors.teal,
    marginBottom: 8,
  },
  introBody: {
    fontFamily: typography.body,
    fontSize: fontSizes.sm,
    color: colors.inkMuted,
    lineHeight: 20,
  },
  newExpBtn: { width: '100%', marginBottom: 20 },
  sectionHeader: { marginTop: 4 },
  expCard: { marginBottom: 12 },
  expHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  expInfo: { flex: 1, gap: 4 },
  expBrand: {
    fontFamily: 'Kalam_700Bold',
    fontSize: fontSizes.md,
    color: colors.teal,
  },
  statusBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.paperAlt,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadgeDone: { backgroundColor: colors.teal },
  statusBadgeText: {
    fontSize: fontSizes.xs,
    fontFamily: typography.body,
    color: colors.white,
    textTransform: 'uppercase',
  },
  expHypothesis: {
    fontFamily: typography.body,
    fontSize: fontSizes.sm,
    color: colors.inkMuted,
    lineHeight: 20,
    marginBottom: 10,
  },
  expMetrics: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  expMetric: { alignItems: 'center' },
  expMetricValue: {
    fontFamily: 'Kalam_700Bold',
    fontSize: fontSizes.base,
    color: colors.ink,
  },
  expMetricLabel: {
    fontFamily: typography.body,
    fontSize: fontSizes.xs,
    color: colors.inkMuted,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 40,
    paddingHorizontal: 24,
  },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: {
    fontFamily: 'Kalam_700Bold',
    fontSize: fontSizes.xl,
    color: colors.ink,
    marginBottom: 8,
  },
  emptyBody: {
    fontFamily: 'Kalam_400Regular',
    fontSize: fontSizes.base,
    color: colors.inkMuted,
    textAlign: 'center',
    lineHeight: 22,
  },
  // Wizard
  modalSafe: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontFamily: 'Kalam_700Bold',
    fontSize: fontSizes.xl,
    color: colors.ink,
  },
  closeBtn: {
    padding: 8,
    backgroundColor: colors.paperAlt,
    borderRadius: 20,
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontFamily: typography.body,
    fontSize: fontSizes.base,
    color: colors.inkMuted,
  },
  wizardTabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  wizardTab: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wizardTabActive: {
    backgroundColor: colors.teal,
  },
  wizardTabText: {
    fontFamily: 'Kalam_700Bold',
    fontSize: fontSizes.sm,
    color: colors.inkMuted,
  },
  wizardTabTextActive: {
    color: colors.white,
  },
  wizardScroll: {
    padding: 16,
    paddingBottom: 40,
  },
  wizardStep: {
    gap: 14,
  },
  wizardStepTitle: {
    fontFamily: 'Kalam_700Bold',
    fontSize: fontSizes.xl,
    color: colors.teal,
    marginBottom: 4,
  },
  wizardHint: {
    fontFamily: 'Kalam_400Regular',
    fontSize: fontSizes.sm,
    color: colors.inkMuted,
    fontStyle: 'italic',
  },
  brandOptions: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  brandOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.white,
  },
  brandOptionSelected: {
    borderColor: colors.teal,
    backgroundColor: colors.teal,
  },
  brandOptionText: {
    fontFamily: 'Kalam_700Bold',
    fontSize: fontSizes.base,
    color: colors.inkMuted,
  },
  brandOptionTextSelected: {
    color: colors.white,
  },
  brandNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    gap: 10,
  },
  mssPreview: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: colors.paperAlt,
    borderRadius: 10,
    gap: 8,
  },
  mssPreviewLabel: {
    fontFamily: 'Kalam_400Regular',
    fontSize: fontSizes.sm,
    color: colors.inkMuted,
  },
  mssFormula: {
    fontFamily: typography.mono,
    fontSize: fontSizes.xs,
    color: colors.inkMuted,
  },
  validationError: {
    fontFamily: typography.body,
    fontSize: fontSizes.xs,
    color: '#D65A4E',
    marginTop: -8,
  },
  ratingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ratingLabel: {
    fontFamily: 'Kalam_400Regular',
    fontSize: fontSizes.sm,
    color: colors.inkMuted,
    flex: 1,
  },
  ratingPips: {
    flexDirection: 'row',
    gap: 6,
  },
  ratingPip: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingPipActive: {
    backgroundColor: colors.teal,
  },
  ratingPipText: {
    fontFamily: 'Kalam_700Bold',
    fontSize: fontSizes.xs,
    color: colors.inkMuted,
  },
  ratingPipTextActive: {
    color: colors.white,
  },
  reviewCard: { gap: 8 },
  reviewLabel: {
    fontFamily: 'Kalam_700Bold',
    fontSize: fontSizes.xs,
    color: colors.teal,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  reviewValue: {
    fontFamily: typography.body,
    fontSize: fontSizes.base,
    color: colors.ink,
    marginBottom: 8,
  },
});
