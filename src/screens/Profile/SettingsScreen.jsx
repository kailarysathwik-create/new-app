import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Alert } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Shield, Bookmark, Grid, LogOut, ChevronRight, User, Bell, Lock } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { colors, spacing, radius, typography, shadows, borders } from '../../theme/tokens';
import { useAuthStore } from '../../store/authStore';

function SettingsItem({ icon: Icon, title, subtitle, onPress, color = colors.accentSecondary, isDestructive = false }) {
  return (
    <TouchableOpacity onPress={onPress}>
        <BlurView intensity={20} tint="dark" style={[styles.menuItem, isDestructive && { borderColor: colors.error }]}>
            <View style={styles.menuLeft}>
                <View style={[styles.iconFrame, { backgroundColor: isDestructive ? 'rgba(255,59,48,0.1)' : 'rgba(255,255,255,0.05)' }]}>
                    <Icon color={isDestructive ? colors.error : color} size={20} />
                </View>
                <View style={styles.menuTextContent}>
                    <Text style={[styles.menuTitle, isDestructive && { color: colors.error }]}>{title}</Text>
                    {subtitle && <Text style={styles.menuSub}>{subtitle}</Text>}
                </View>
            </View>
            <ChevronRight color={colors.textMuted} size={18} />
        </BlurView>
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut } = useAuthStore();

  const handleAbandonShip = () => {
    Alert.alert(
      "Abandon Ship?",
      "You will be signed out of the Harbour. Your encrypted keys will remain safe.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Abandon Ship", onPress: signOut, style: "destructive" }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[colors.bg, '#0B0B0F']} style={StyleSheet.absoluteFill} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft color={colors.white} size={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SETTINGS</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>ACCOUNT & PRIVACY</Text>
            <SettingsItem 
                icon={User} 
                title="Profile Identity" 
                subtitle="Change your alias and bio"
                onPress={() => {}} 
            />
            <SettingsItem 
                icon={Shield} 
                title="Privacy Vault" 
                subtitle="Manage biometric lock and access"
                color={colors.success}
                onPress={() => {}} 
            />
            <SettingsItem 
                icon={Lock} 
                title="Security Ciphers" 
                subtitle="End-to-end encryption status"
                onPress={() => {}} 
            />
        </View>

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>DATA & MEDIA</Text>
            <SettingsItem 
                icon={Grid} 
                title="Import Digital Footprint" 
                subtitle="Migrate data from Instagram/Threads"
                onPress={() => {}} 
            />
            <SettingsItem 
                icon={Bookmark} 
                title="Saved Cipher-Media" 
                subtitle="Your anchored favorites"
                onPress={() => {}} 
            />
        </View>

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>
            <SettingsItem 
                icon={Bell} 
                title="Harbour Alerts" 
                subtitle="Breezes, messages and waves"
                onPress={() => {}} 
            />
        </View>

        <View style={styles.section}>
            <Text style={styles.sectionTitle}>DANGER ZONE</Text>
            <SettingsItem 
                icon={LogOut} 
                title="Abandon Ship" 
                subtitle="Sign out of Saily"
                isDestructive
                onPress={handleAbandonShip} 
            />
        </View>

        <View style={styles.footer}>
            <Text style={styles.versionText}>SAILY HARBOUR v1.0.0</Text>
            <Text style={styles.footerText}>Securely Anchored · Zero Knowledge</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderColor: colors.glassBorder,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  headerTitle: {
    fontFamily: typography.family.black,
    color: colors.white,
    fontSize: 18,
    letterSpacing: 2,
  },
  scrollContent: { padding: spacing.lg, paddingBottom: 60 },
  section: { marginBottom: spacing.xl },
  sectionTitle: {
    fontFamily: typography.family.black,
    color: colors.textMuted,
    fontSize: 10,
    letterSpacing: 2,
    marginBottom: spacing.md,
    marginLeft: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.glassBorder,
    marginBottom: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  iconFrame: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  menuTextContent: { flex: 1 },
  menuTitle: {
    fontFamily: typography.family.bold,
    color: colors.white,
    fontSize: 15,
  },
  menuSub: {
    fontFamily: typography.family.medium,
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  footer: {
    marginTop: spacing.xl,
    alignItems: 'center',
    paddingOpacity: 0.5,
  },
  versionText: {
    fontFamily: typography.family.black,
    color: colors.textMuted,
    fontSize: 10,
    letterSpacing: 1,
  },
  footerText: {
    fontFamily: typography.family.medium,
    color: colors.textMuted,
    fontSize: 9,
    marginTop: 4,
  },
});
