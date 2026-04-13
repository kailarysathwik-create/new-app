import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
// TEMPORARILY DISABLED ICONS TO DEBUG "UNDEFINED" ERROR
// import { LogIn as Google, ShieldCheck, Zap } from 'lucide-react-native';
import { colors, spacing, radius, typography, shadows } from '../../theme/tokens';
import { useAuthStore } from '../../store/authStore';

export default function LoginScreen() {
  const { signInWithGoogle, loading } = useAuthStore();

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.content}>
        <View style={styles.logoBrutal}>
          <Text style={{ fontSize: 32 }}>⚡</Text>
        </View>
        <Text style={styles.title}>VEIL</Text>
        
        <View style={styles.glassCard}>
          <Text style={styles.glassTitle}>Welcome Back</Text>
          <TouchableOpacity 
            style={styles.googleBtn} 
            onPress={() => signInWithGoogle()}
          >
            <Text style={styles.btnText}>Continue with Google</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  logoBrutal: { padding: 20, backgroundColor: colors.accent, borderRadius: 10 },
  title: { fontSize: 40, fontWeight: 'bold', color: colors.white, marginVertical: 20 },
  glassCard: { width: '100%', padding: 20, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 20 },
  glassTitle: { fontSize: 20, color: colors.white, marginBottom: 20, textAlign: 'center' },
  googleBtn: { backgroundColor: colors.white, padding: 15, borderRadius: 10, alignItems: 'center' },
  btnText: { color: colors.black, fontWeight: 'bold' },
});
