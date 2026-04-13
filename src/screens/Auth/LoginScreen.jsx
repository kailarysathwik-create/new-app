import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Dimensions, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { MotiView, MotiText } from 'moti';
import { Eye, EyeOff, Lock, User, Sparkles } from 'lucide-react-native';
import { colors, spacing, radius, typography, shadows } from '../../theme/tokens';
import { useAuthStore } from '../../store/authStore';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const { signInManual, loading } = useAuthStore();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!identifier || !password) {
        Alert.alert("Error", "Please fill in all fields");
        return;
    }
    const { error } = await signInManual({ identifier, password });
    if (error) {
        Alert.alert("Login Error", error.message);
    } else {
        router.replace('/(tabs)');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[colors.bg, '#1D120B']} style={StyleSheet.absoluteFill} />
      
      {/* Visual background details (Warm Glowing Blobs) */}
      <MotiView 
        from={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 0.2, scale: 1 }}
        transition={{ type: 'timing', duration: 2000, loop: true }}
        style={[styles.glow, { top: '15%', left: -60, backgroundColor: colors.accent }]} 
      />
      <MotiView 
        from={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.15, scale: 1.2 }}
        transition={{ type: 'timing', duration: 3000, loop: true }}
        style={[styles.glow, { bottom: '20%', right: -60, backgroundColor: colors.accentSecondary }]} 
      />

      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <MotiView 
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 600 }}
          style={styles.content}
        >
          <View style={styles.header}>
            <MotiView 
              from={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 200 }}
              style={styles.logoPlaceholder}
            >
                <Sparkles color={colors.white} size={36} fill={colors.white} />
                <Text style={styles.placeholderLabel}>LOGO</Text>
            </MotiView>
            <MotiText 
              from={{ opacity: 0, letterSpacing: 0 }}
              animate={{ opacity: 1, letterSpacing: 8 }}
              transition={{ delay: 400, duration: 800 }}
              style={styles.appName}
            >
              SAILY
            </MotiText>
            <Text style={styles.tagline}>Warm. Private. Yours.</Text>
          </View>

          <BlurView intensity={25} tint="dark" style={styles.authCard}>
            <View style={styles.inputRow}>
                <User color={colors.textMuted} size={20} style={styles.inputIcon} />
                <TextInput 
                    style={styles.input}
                    placeholder="Email or Mobile Number"
                    placeholderTextColor={colors.textMuted}
                    value={identifier}
                    onChangeText={setIdentifier}
                    autoCapitalize="none"
                />
            </View>

            <View style={styles.inputRow}>
                <Lock color={colors.textMuted} size={20} style={styles.inputIcon} />
                <TextInput 
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff color={colors.textMuted} size={20} /> : <Eye color={colors.textMuted} size={20} />}
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
                <LinearGradient
                    colors={[colors.accent, colors.accentSecondary]}
                    start={{x:0, y:0}} end={{x:1, y:1}}
                    style={styles.btnGradient}
                >
                    <Text style={styles.loginBtnText}>{loading ? 'Accessing Node...' : 'Connect to Saily'}</Text>
                </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity style={styles.forgotBtn}>
                <Text style={styles.forgotText}>Forgot Credentials?</Text>
            </TouchableOpacity>
          </BlurView>

          <View style={styles.footer}>
            <Text style={styles.footerText}>New to the ocean? </Text>
            <TouchableOpacity onPress={() => router.push('/onboarding')}>
                <Text style={styles.signUpText}>Start your Voyage</Text>
            </TouchableOpacity>
          </View>
        </MotiView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  glow: { position: 'absolute', width: 280, height: 280, borderRadius: 140 },
  keyboardView: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  header: { alignItems: 'center', marginBottom: spacing.xxl },
  logoPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 28,
    backgroundColor: colors.bgSurface,
    borderWidth: 2,
    borderColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.brutal,
  },
  placeholderLabel: { 
    fontFamily: typography.family.bold,
    fontSize: 10, 
    color: colors.white, 
    marginTop: 4 
  },
  appName: { 
    fontFamily: typography.family.black,
    fontSize: typography.size.huge, 
    color: colors.white, 
  },
  tagline: { 
    fontFamily: typography.family.medium,
    color: colors.textSecondary, 
    fontSize: 15, 
    marginTop: 4, 
    letterSpacing: 2 
  },
  
  authCard: {
    width: '100%',
    padding: spacing.xl,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  inputIcon: { marginRight: spacing.sm },
  input: { 
    fontFamily: typography.family.regular,
    flex: 1, 
    paddingVertical: 16, 
    color: colors.white, 
    fontSize: 16 
  },
  
  loginBtn: { marginTop: spacing.md, borderRadius: radius.md, overflow: 'hidden', ...shadows.brutal, borderWidth: 2, borderColor: colors.black },
  btnGradient: { paddingVertical: 16, alignItems: 'center' },
  loginBtnText: { 
    fontFamily: typography.family.bold,
    color: colors.white, 
    fontSize: 16, 
    letterSpacing: 1 
  },
  
  forgotBtn: { marginTop: spacing.lg, alignSelf: 'center' },
  forgotText: { 
    fontFamily: typography.family.medium,
    color: colors.textMuted, 
    fontSize: 14 
  },
  
  footer: { flexDirection: 'row', position: 'absolute', bottom: spacing.xxl },
  footerText: { 
    fontFamily: typography.family.regular,
    color: colors.textSecondary, 
    fontSize: 15 
  },
  signUpText: { 
    fontFamily: typography.family.black,
    color: colors.accent, 
    fontSize: 15, 
    textDecorationLine: 'underline' 
  },
});
