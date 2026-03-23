import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/hooks/useAuth';
import { SketchPaper } from '../../src/components/ui/SketchPaper';
import { SketchButton } from '../../src/components/ui/SketchButton';
import { SketchField } from '../../src/components/ui/SketchField';
import { colors } from '../../src/lib/colors';
import { typography, fontSizes } from '../../src/lib/typography';

export default function SignUpScreen() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password || !confirm) {
      Alert.alert('Missing fields', 'Please fill in all fields.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Password mismatch', 'Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak password', 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    const { error } = await signUp(email.trim(), password);
    setLoading(false);

    if (error) {
      Alert.alert('Sign up failed', error.message);
    } else {
      Alert.alert(
        'Account created',
        'Check your email to confirm your account, then sign in.',
      );
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.kav}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.brand}>
            <Text style={styles.brandName}>tinyexperiments</Text>
            <View style={styles.brandLine} />
            <Text style={styles.brandTagline}>Start validating your idea</Text>
          </View>

          <SketchPaper variant="card" style={styles.card}>
            <Text style={styles.cardTitle}>Create Account</Text>

            <SketchField
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              required
            />
            <SketchField
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Min 6 characters"
              required
            />
            <SketchField
              label="Confirm Password"
              value={confirm}
              onChangeText={setConfirm}
              placeholder="Re-enter password"
              required
            />

            <SketchButton
              label="Create Account"
              onPress={handleSignUp}
              variant="primary"
              size="lg"
              loading={loading}
              style={styles.button}
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <Link href="/(auth)/sign-in" style={styles.link}>
                Sign In
              </Link>
            </View>
          </SketchPaper>

          <Text style={styles.hint}>
            Phase 1: AI Analysis → Phase 2: Real Experiments → Combined Confidence Score
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.paper,
  },
  kav: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  brand: {
    alignItems: 'center',
    marginBottom: 32,
  },
  brandName: {
    fontFamily: 'Kalam_700Bold',
    fontSize: 34,
    color: colors.teal,
    letterSpacing: -0.5,
  },
  brandLine: {
    width: 60,
    height: 3,
    backgroundColor: colors.yellow,
    borderRadius: 2,
    marginVertical: 8,
  },
  brandTagline: {
    fontFamily: 'Kalam_400Regular',
    fontSize: fontSizes.sm,
    color: colors.inkMuted,
  },
  card: {
    padding: 24,
  },
  cardTitle: {
    fontFamily: 'Kalam_700Bold',
    fontSize: fontSizes.xl,
    color: colors.ink,
    marginBottom: 20,
  },
  button: {
    marginTop: 8,
    width: '100%',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    alignItems: 'center',
  },
  footerText: {
    fontFamily: typography.body,
    fontSize: fontSizes.sm,
    color: colors.inkMuted,
  },
  link: {
    fontFamily: 'Kalam_700Bold',
    fontSize: fontSizes.sm,
    color: colors.teal,
  },
  hint: {
    fontFamily: 'Kalam_400Regular',
    fontSize: fontSizes.xs,
    color: colors.inkMuted,
    textAlign: 'center',
    marginTop: 24,
    fontStyle: 'italic',
  },
});
