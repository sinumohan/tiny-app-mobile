import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/hooks/useAuth';
import { useSignals } from '../../src/hooks/useSignals';
import { SketchPaper } from '../../src/components/ui/SketchPaper';
import { SketchButton } from '../../src/components/ui/SketchButton';
import { SketchField } from '../../src/components/ui/SketchField';
import { colors } from '../../src/lib/colors';
import { typography, fontSizes } from '../../src/lib/typography';

const STEPS = [
  {
    id: 1,
    question: 'What problem are you solving, and who experiences it?',
    hint: 'Be precise: name the person AND the friction. "Freelancers can\'t track unpaid invoices without chasing clients manually."',
    field: 'problem_statement',
    minLength: 40,
  },
  {
    id: 2,
    question: 'What do people currently do instead of your solution?',
    hint: 'Describe their existing workaround. If nothing exists, that\'s important data -- say why.',
    field: 'current_alternatives',
    minLength: 30,
  },
  {
    id: 3,
    question: 'Why would people change their behavior to use your solution?',
    hint: 'Behavior change is the hardest thing in business. What\'s the compelling trigger?',
    field: 'behavior_change_reason',
    minLength: 30,
  },
  {
    id: 4,
    question: 'Describe the SPECIFIC person who will pay -- not a demographic.',
    hint: 'Not "small business owners". Try: "A freelance designer who has 3+ clients, earns $80k+, and loses sleep over unpaid invoices."',
    field: 'target_customer',
    minLength: 40,
  },
  {
    id: 5,
    question: 'What is your unfair advantage?',
    hint: 'What do you have that a well-funded competitor cannot easily replicate? Insider access, unique data, domain expertise, network?',
    field: 'unfair_advantage',
    minLength: 20,
  },
  {
    id: 6,
    question: 'What is the ONE assumption -- if wrong -- that would kill this idea?',
    hint: 'The thesis assumption. Usually around willingness to pay, market size, or behavior change. Say it plainly.',
    field: 'kill_assumption',
    minLength: 20,
  },
];

type FormData = {
  problem_statement: string;
  current_alternatives: string;
  behavior_change_reason: string;
  target_customer: string;
  unfair_advantage: string;
  kill_assumption: string;
};

function StepIndicator({ current, total }: { current: number; total: number }) {
  return (
    <View style={styles.stepIndicator}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.stepDot,
            i < current && styles.stepDotDone,
            i === current && styles.stepDotActive,
          ]}
        />
      ))}
    </View>
  );
}

export default function NewSignalScreen() {
  const router = useRouter();
  const { session } = useAuth();
  const { createSignal } = useSignals(session?.user.id);

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    problem_statement: '',
    current_alternatives: '',
    behavior_change_reason: '',
    target_customer: '',
    unfair_advantage: '',
    kill_assumption: '',
  });

  const step = STEPS[currentStep];
  const fieldValue = formData[step.field as keyof FormData];
  const isLast = currentStep === STEPS.length - 1;

  const updateField = (value: string) => {
    setFormData((prev) => ({ ...prev, [step.field]: value }));
  };

  const canProceed = fieldValue.trim().length >= step.minLength;

  const handleNext = () => {
    if (!canProceed) {
      Alert.alert(
        'Answer too short',
        `Please provide at least ${step.minLength} characters. Vague answers produce weak analysis.`,
      );
      return;
    }
    if (!isLast) {
      setCurrentStep((s) => s + 1);
    } else {
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const { data, error } = await createSignal(formData);
      if (error) {
        Alert.alert('Error', typeof error === 'string' ? error : (error as { message?: string }).message ?? 'Could not create signal.');
        return;
      }
      if (data) {
        router.replace(`/(app)/signal/${data.id}`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>New Signal</Text>
          <Text style={styles.stepLabel}>
            Step {currentStep + 1} of {STEPS.length}
          </Text>
          <StepIndicator current={currentStep} total={STEPS.length} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <SketchPaper variant="card" hasMarginLine style={styles.card}>
            <Text style={styles.stepNumber}>
              {String(currentStep + 1).padStart(2, '0')}
            </Text>
            <Text style={styles.question}>{step.question}</Text>
            <Text style={styles.hint}>{step.hint}</Text>

            <SketchField
              label="Your answer"
              value={fieldValue}
              onChangeText={updateField}
              multiline
              numberOfLines={5}
              minLength={step.minLength}
              required
              placeholder="Write your answer here -- be specific and concrete..."
            />
          </SketchPaper>

          {/* Validation feedback */}
          {fieldValue.length > 0 && !canProceed && (
            <View style={styles.vagueBanner}>
              <Text style={styles.vagueText}>
                Keep going -- specificity is your edge. ({fieldValue.length}/{step.minLength} chars)
              </Text>
            </View>
          )}

          {fieldValue.length > 0 && canProceed && (
            <View style={styles.okBanner}>
              <Text style={styles.okText}>Good -- that's a real answer.</Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.navRow}>
          {currentStep > 0 && (
            <SketchButton
              label="Back"
              onPress={() => setCurrentStep((s) => s - 1)}
              variant="ghost"
              size="md"
              style={styles.backButton}
            />
          )}
          <View style={styles.navSpacer} />
          <SketchButton
            label={isLast ? 'Submit' : 'Next'}
            onPress={handleNext}
            variant="primary"
            size="md"
            loading={loading}
            disabled={!canProceed}
            style={styles.nextButton}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.offWhite,
  },
  kav: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  headerTitle: {
    fontFamily: 'Kalam_700Bold',
    fontSize: fontSizes.xl,
    color: colors.ink,
    marginBottom: 4,
  },
  stepLabel: {
    fontFamily: 'System',
    fontSize: fontSizes.sm,
    color: colors.muted,
    marginBottom: 10,
  },
  stepIndicator: {
    flexDirection: 'row',
    gap: 6,
  },
  stepDot: {
    width: 28,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  stepDotDone: {
    backgroundColor: colors.electric,
  },
  stepDotActive: {
    backgroundColor: colors.electric,
  },
  scroll: {
    padding: 16,
    paddingBottom: 24,
    flexGrow: 1,
  },
  card: {
    padding: 20,
  },
  stepNumber: {
    fontFamily: 'Kalam_700Bold',
    fontSize: 48,
    color: colors.border,
    lineHeight: 52,
    marginBottom: 8,
  },
  question: {
    fontFamily: 'Kalam_700Bold',
    fontSize: fontSizes.xl,
    color: colors.ink,
    lineHeight: 30,
    marginBottom: 8,
  },
  hint: {
    fontFamily: 'System',
    fontSize: fontSizes.sm,
    color: colors.muted,
    lineHeight: 20,
    fontStyle: 'italic',
    marginBottom: 16,
    paddingLeft: 8,
    borderLeftWidth: 2,
    borderLeftColor: colors.notebookLine,
  },
  vagueBanner: {
    backgroundColor: colors.amberLight,
    padding: 10,
    borderRadius: 6,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.amber,
  },
  vagueText: {
    fontFamily: 'System',
    fontSize: fontSizes.sm,
    color: colors.amberDark,
  },
  okBanner: {
    backgroundColor: colors.mintLight,
    padding: 10,
    borderRadius: 6,
    marginTop: 8,
    borderLeftWidth: 3,
    borderLeftColor: colors.mint,
  },
  okText: {
    fontFamily: 'System',
    fontSize: fontSizes.sm,
    color: colors.mintDark,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.white,
  },
  backButton: {
    minWidth: 80,
  },
  navSpacer: {
    flex: 1,
  },
  nextButton: {
    minWidth: 100,
  },
});
