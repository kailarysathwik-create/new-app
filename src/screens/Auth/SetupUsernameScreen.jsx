import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { colors, spacing, radius, typography } from '../../theme/tokens';
import { useAuthStore } from '../../store/authStore';

export default function SetupUsernameScreen() {
  const { publicKey } = useLocalSearchParams();
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [error, setError] = useState('');
  const { user, createProfile, loading } = useAuthStore();

  const handleCreate = async () => {
    const clean = username.trim().toLowerCase().replace(/\s+/g, '_');
    if (clean.length < 3) { setError('Username must be at least 3 characters'); return; }
    if (!/^[a-z0-9_]+$/.test(clean)) { setError('Letters, numbers and underscores only'); return; }
    setError('');
    const { error: err } = await createProfile({ userId: user.id, username: clean, publicKey });
    if (err) {
      setError(err.code === '23505' ? 'That username is taken. Try another.' : err.message);
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <Text style={styles.emoji}>✨</Text>
        <Text style={styles.title}>Set up your identity</Text>
        <Text style={styles.subtitle}>Choose a username that defines you.</Text>
      </View>

      <Text style={styles.label}>Username</Text>
      <TextInput style={styles.input} placeholder="your_username" placeholderTextColor={colors.textMuted}
        autoCapitalize="none" autoCorrect={false} value={username} onChangeText={setUsername} />
      <Text style={styles.hint}>Letters, numbers and underscores only</Text>

      <Text style={[styles.label, { marginTop: spacing.lg }]}>Bio (optional)</Text>
      <TextInput style={[styles.input, styles.bioInput]} placeholder="Tell people who you are..."
        placeholderTextColor={colors.textMuted} multiline maxLength={150} value={bio} onChangeText={setBio} />
      <Text style={styles.charCount}>{bio.length}/150</Text>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.keyBadge}>
        <Text style={styles.keyBadgeIcon}>🔑</Text>
        <Text style={styles.keyBadgeText}>Your encryption keys are generated and stored securely on this device.</Text>
      </View>

      <TouchableOpacity style={styles.btn} onPress={handleCreate} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Enter the App →</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: spacing.xl, paddingTop: spacing.xxl + spacing.lg },
  header: { marginBottom: spacing.xl },
  emoji: { fontSize: 36, marginBottom: spacing.sm },
  title: { fontSize: typography.size.xxl, fontWeight: typography.weight.black, color: colors.textPrimary, marginBottom: spacing.sm },
  subtitle: { fontSize: typography.size.md, color: colors.textSecondary, lineHeight: 22 },
  label: { color: colors.textSecondary, fontSize: typography.size.sm, marginBottom: spacing.xs, fontWeight: typography.weight.semibold },
  input: { backgroundColor: colors.bgSurface, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md, color: colors.textPrimary, fontSize: typography.size.md },
  bioInput: { height: 100, textAlignVertical: 'top', paddingTop: spacing.md },
  hint: { color: colors.textMuted, fontSize: typography.size.xs, marginTop: spacing.xs },
  charCount: { color: colors.textMuted, fontSize: typography.size.xs, textAlign: 'right', marginTop: spacing.xs },
  errorText: { color: colors.error, fontSize: typography.size.sm, marginTop: spacing.md },
  keyBadge: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: colors.bgSurface, borderRadius: radius.md, padding: spacing.md, marginTop: spacing.xl, marginBottom: spacing.lg, borderWidth: 1, borderColor: colors.border },
  keyBadgeIcon: { fontSize: 18, marginRight: spacing.sm },
  keyBadgeText: { flex: 1, color: colors.textSecondary, fontSize: typography.size.sm, lineHeight: 20 },
  btn: { backgroundColor: colors.accentWarm, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', borderWidth: 2, borderColor: colors.error },
  btnText: { color: '#fff', fontSize: typography.size.md, fontWeight: typography.weight.bold },
});
