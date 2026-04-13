import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { colors, spacing, radius, typography } from '../../theme/tokens';
import { useAuthStore } from '../../store/authStore';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState('email');
  const [error, setError] = useState('');
  const [pendingPublicKey, setPendingPublicKey] = useState(null);
  const { signInWithOtp, verifyOtp, loading } = useAuthStore();

  const handleSendOtp = async () => {
    if (!email.includes('@')) { setError('Enter a valid email address'); return; }
    setError('');
    const { error: err } = await signInWithOtp(email);
    if (err) setError(err.message);
    else setStep('otp');
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 6) { setError('Enter the 6-digit code'); return; }
    setError('');
    const result = await verifyOtp(email, otp);
    if (result?.error) {
      setError(result.error.message);
    } else if (result?.isNewUser) {
      router.replace({ pathname: '/setup-username', params: { publicKey: result.publicKey } });
    }
    // Existing user — layout handles session redirect
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.card}>
        <View style={styles.logoRow}>
          <Text style={styles.logoIcon}>🔐</Text>
          <Text style={styles.appName}>VeilChat</Text>
        </View>
        <Text style={styles.tagline}>Private. Encrypted. Yours.</Text>

        {step === 'email' ? (
          <>
            <Text style={styles.label}>Email</Text>
            <TextInput style={styles.input} placeholder="you@example.com" placeholderTextColor={colors.textMuted}
              keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <TouchableOpacity style={styles.btn} onPress={handleSendOtp} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Send Code →</Text>}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={styles.label}>6-digit code sent to</Text>
            <Text style={styles.emailDisplay}>{email}</Text>
            <TextInput style={[styles.input, styles.otpInput]} placeholder="000000" placeholderTextColor={colors.textMuted}
              keyboardType="number-pad" maxLength={6} value={otp} onChangeText={setOtp} />
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            <TouchableOpacity style={styles.btn} onPress={handleVerifyOtp} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Verify & Enter →</Text>}
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setStep('email')}>
              <Text style={styles.backLink}>← Change email</Text>
            </TouchableOpacity>
          </>
        )}

        <Text style={styles.privacyNote}>🔒 All messages are end-to-end encrypted. We never see them.</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center', paddingHorizontal: spacing.lg },
  card: { backgroundColor: colors.bgCard, borderRadius: radius.lg, padding: spacing.xl, borderWidth: 1.5, borderColor: colors.borderStrong },
  logoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs },
  logoIcon: { fontSize: 28, marginRight: spacing.sm },
  appName: { fontSize: typography.size.xxl, fontWeight: typography.weight.black, color: colors.textPrimary, letterSpacing: -0.5 },
  tagline: { fontSize: typography.size.sm, color: colors.textSecondary, marginBottom: spacing.xl },
  label: { color: colors.textSecondary, fontSize: typography.size.sm, marginBottom: spacing.xs },
  emailDisplay: { color: colors.accentGlow, fontSize: typography.size.md, fontWeight: typography.weight.semibold, marginBottom: spacing.md },
  input: { backgroundColor: colors.bgSurface, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md, color: colors.textPrimary, fontSize: typography.size.md, marginBottom: spacing.md },
  otpInput: { textAlign: 'center', fontSize: typography.size.xl, letterSpacing: 8 },
  btn: { backgroundColor: colors.accent, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', marginBottom: spacing.md, borderWidth: 2, borderColor: colors.accentGlow },
  btnText: { color: '#fff', fontSize: typography.size.md, fontWeight: typography.weight.bold },
  backLink: { color: colors.textSecondary, textAlign: 'center', fontSize: typography.size.sm, marginBottom: spacing.lg },
  errorText: { color: colors.error, fontSize: typography.size.sm, marginBottom: spacing.sm },
  privacyNote: { color: colors.textMuted, fontSize: typography.size.xs, textAlign: 'center', marginTop: spacing.md },
});
