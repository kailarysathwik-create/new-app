import React, { useState } from 'react';
import { Image, View, Text, StyleSheet, TouchableOpacity, Dimensions, KeyboardAvoidingView, Platform, Alert, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { MotiView, MotiText } from 'moti';
import { Eye, EyeOff, Lock, User } from 'lucide-react-native';
import { colors, spacing, radius, typography, shadows, borders } from '../../theme/tokens';
import { useAuthStore } from '../../store/authStore';
import { haptics } from '../../utils/haptics';

const { width } = Dimensions.get('window');

export default function LoginScreen() {
  const router = useRouter();
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
        haptics.error();
        Alert.alert("Login Error", error.message);
    } else {
        haptics.success();
        router.replace('/(tabs)');
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <MotiView 
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          style={styles.content}
        >
          <View style={styles.header}>
            <MotiView 
              from={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 100 }}
              style={styles.logoFrame}
            >
                <Image 
                    source={require('../../../assets/images/sailylogo.png')} 
                    style={styles.logoImage} 
                    resizeMode="contain"
                />
            </MotiView>
            <MotiText 
              from={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={styles.appName}
            >
              SAILY
            </MotiText>
          </View>

          <View style={styles.authCard}>
            <View style={styles.inputLabelRow}>
                <User color={colors.black} size={14} />
                <Text style={styles.inputLabel}>IDENTIFIER</Text>
            </View>
            <View style={styles.inputRow}>
                <TextInput 
                    style={styles.input}
                    placeholder="USERNAME, EMAIL OR MOBILE"
                    placeholderTextColor={colors.textMuted}
                    value={identifier}
                    onChangeText={setIdentifier}
                    autoCapitalize="none"
                />
            </View>

            <View style={styles.inputLabelRow}>
                <Lock color={colors.black} size={14} />
                <Text style={styles.inputLabel}>PASSWORD</Text>
            </View>
            <View style={styles.inputRow}>
                <TextInput 
                    style={styles.input}
                    placeholder="PASSWORD"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff color={colors.black} size={20} /> : <Eye color={colors.black} size={20} />}
                </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
                <Text style={styles.loginBtnText}>{loading ? 'CONNECTING...' : 'CONNECT TO SAILY'}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.forgotBtn} onPress={() => router.push('/forgot-password')}>
                <Text style={styles.forgotText}>FORGOT PASSWORD?</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>New here? </Text>
            <TouchableOpacity onPress={() => router.push('/onboarding')}>
                <Text style={styles.signUpText}>START SAILING</Text>
            </TouchableOpacity>
          </View>
        </MotiView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  keyboardView: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  header: { alignItems: 'center', marginBottom: spacing.xxl },
  logoFrame: {
    width: 100,
    height: 100,
    backgroundColor: colors.accent,
    borderWidth: borders.thick,
    borderColor: borders.color,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.brutal,
    overflow: 'hidden',
  },
  logoImage: { width: '80%', height: '80%' },
  appName: { 
    fontFamily: typography.family.black,
    fontSize: 48, 
    color: colors.white, 
    letterSpacing: 2
  },
  
  authCard: {
    width: '100%',
    padding: spacing.xl,
    backgroundColor: colors.white,
    borderWidth: borders.thick,
    borderColor: borders.color,
    ...shadows.brutal,
  },
  inputLabelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, marginTop: 12 },
  inputLabel: { fontFamily: typography.family.black, fontSize: 10, marginLeft: 6, color: colors.black },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderWidth: borders.medium,
    borderColor: borders.color,
  },
  input: { 
    fontFamily: typography.family.bold,
    flex: 1, 
    paddingVertical: 14, 
    color: colors.black, 
    fontSize: 14 
  },
  
  loginBtn: { 
    marginTop: spacing.lg, 
    backgroundColor: colors.accent,
    borderWidth: borders.medium,
    borderColor: borders.color,
    paddingVertical: 16, 
    alignItems: 'center',
    ...shadows.brutalSmall
  },
  loginBtnText: { 
    fontFamily: typography.family.black,
    color: colors.black, 
    fontSize: 16, 
    letterSpacing: 1 
  },
  
  forgotBtn: { marginTop: spacing.lg, alignSelf: 'center' },
  forgotText: { 
    fontFamily: typography.family.bold,
    color: colors.textMuted, 
    fontSize: 12 
  },
  
  footer: { flexDirection: 'row', marginTop: spacing.xxl },
  footerText: { 
    fontFamily: typography.family.medium,
    color: colors.textSecondary, 
    fontSize: 14 
  },
  signUpText: { 
    fontFamily: typography.family.black,
    color: colors.accent, 
    fontSize: 14, 
    textDecorationLine: 'underline' 
  },
});


