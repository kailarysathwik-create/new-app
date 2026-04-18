import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { KeyRound, Mail, Smartphone } from 'lucide-react-native';
import { colors, spacing, typography, shadows, borders } from '../../theme/tokens';
import { useAuthStore } from '../../store/authStore';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { requestPasswordResetCode, resetPasswordWithCode, loading } = useAuthStore();
  const [step, setStep] = useState(1);
  const [identifier, setIdentifier] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const isEmail = identifier.includes('@');

  const handleSendCode = async () => {
    if (!identifier.trim()) {
      Alert.alert('Error', 'Enter your onboarding email or phone number.');
      return;
    }

    const { error, channel } = await requestPasswordResetCode({ identifier });
    if (error) {
      Alert.alert('Reset failed', error.message);
      return;
    }

    const targetChannel = channel === 'email' ? 'email' : 'phone/WhatsApp';
    Alert.alert('Code sent', `A reset code has been sent to your ${targetChannel}.`);
    setStep(2);
  };

  const handleResetPassword = async () => {
    if (!code.trim()) {
      Alert.alert('Error', 'Enter the code you received.');
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    const { error } = await resetPasswordWithCode({ identifier, code, newPassword });
    if (error) {
      Alert.alert('Reset failed', error.message);
      return;
    }

    Alert.alert('Success', 'Password changed successfully. Please login again.');
    router.replace('/login');
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView style={styles.keyboard} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }} style={styles.content}>
          <Text style={styles.title}>RESET ACCESS</Text>
          <Text style={styles.subtitle}>
            {step === 1
              ? 'Enter the same email or phone used during onboarding.'
              : 'Enter the received code and set a new password.'}
          </Text>

          <View style={styles.card}>
            <View style={styles.labelRow}>
              {isEmail ? <Mail color={colors.black} size={14} /> : <Smartphone color={colors.black} size={14} />}
              <Text style={styles.label}>EMAIL OR PHONE</Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="name@mail.com or +91..."
              placeholderTextColor={colors.textMuted}
              value={identifier}
              onChangeText={setIdentifier}
              editable={step === 1}
              autoCapitalize="none"
              keyboardType={isEmail ? 'email-address' : 'phone-pad'}
            />

            {step === 2 && (
              <>
                <View style={styles.labelRow}>
                  <KeyRound color={colors.black} size={14} />
                  <Text style={styles.label}>OTP / CODE</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Enter code"
                  placeholderTextColor={colors.textMuted}
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                />

                <View style={styles.labelRow}>
                  <Text style={styles.label}>NEW PASSWORD</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="At least 6 characters"
                  placeholderTextColor={colors.textMuted}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />

                <View style={styles.labelRow}>
                  <Text style={styles.label}>CONFIRM PASSWORD</Text>
                </View>
                <TextInput
                  style={styles.input}
                  placeholder="Repeat new password"
                  placeholderTextColor={colors.textMuted}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
              </>
            )}

            {step === 1 ? (
              <TouchableOpacity style={styles.btn} onPress={handleSendCode} disabled={loading}>
                <Text style={styles.btnText}>{loading ? 'SENDING...' : 'SEND RESET CODE'}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.btn} onPress={handleResetPassword} disabled={loading}>
                <Text style={styles.btnText}>{loading ? 'UPDATING...' : 'UPDATE PASSWORD'}</Text>
              </TouchableOpacity>
            )}

            {step === 2 && (
              <TouchableOpacity onPress={handleSendCode} disabled={loading} style={styles.resendBtn}>
                <Text style={styles.resendText}>RESEND CODE</Text>
              </TouchableOpacity>
            )}
          </View>
        </MotiView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  keyboard: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', padding: spacing.xl },
  title: { fontFamily: typography.family.black, color: colors.white, fontSize: 34, letterSpacing: 1, textAlign: 'center' },
  subtitle: {
    fontFamily: typography.family.medium,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xl,
  },
  card: {
    backgroundColor: colors.white,
    borderWidth: borders.thick,
    borderColor: borders.color,
    padding: spacing.xl,
    ...shadows.brutal,
  },
  labelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, marginTop: 12 },
  label: { marginLeft: 6, fontFamily: typography.family.black, fontSize: 10, color: colors.black },
  input: {
    borderWidth: borders.medium,
    borderColor: borders.color,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    color: colors.black,
    fontFamily: typography.family.bold,
  },
  btn: {
    marginTop: spacing.xl,
    backgroundColor: colors.accent,
    borderWidth: borders.medium,
    borderColor: borders.color,
    alignItems: 'center',
    paddingVertical: 14,
    ...shadows.brutalSmall,
  },
  btnText: { fontFamily: typography.family.black, color: colors.black, fontSize: 14, letterSpacing: 0.5 },
  resendBtn: { marginTop: spacing.lg, alignSelf: 'center' },
  resendText: { fontFamily: typography.family.bold, color: colors.textMuted, fontSize: 12 },
});
