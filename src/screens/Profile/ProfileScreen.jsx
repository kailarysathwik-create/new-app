import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Settings, LogOut, Shield, ChevronRight, Grid, Bookmark, Users } from 'lucide-react-native';
import { colors, spacing, radius, typography, shadows } from '../../theme/tokens';
import { useAuthStore } from '../../store/authStore';

const { width } = Dimensions.get('window');

function StatItem({ label, count }) {
  return (
    <View style={styles.statContainer}>
      <Text style={styles.statCount}>{count}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { profile, signOut } = useAuthStore();

  if (!profile) return null;

  return (
    <View style={styles.container}>
      <LinearGradient colors={[colors.bg, '#1A0033']} style={StyleSheet.absoluteFill} />
      
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Header */}
        <View style={styles.header}>
            <Text style={styles.username}>@{profile.username}</Text>
            <TouchableOpacity><Settings color={colors.white} size={24} /></TouchableOpacity>
        </View>

        {/* Profile Info */}
        <View style={styles.profileSection}>
            <LinearGradient colors={[colors.accent, colors.accentSecondary]} style={styles.avatarBorder}>
                <Image source={{ uri: profile.avatar_url || `https://ui-avatars.com/api/?name=${profile.username}` }} style={styles.avatar} />
            </LinearGradient>
            
            <View style={styles.statsRow}>
                <StatItem count="128" label="Posts" />
                <StatItem count="1.2k" label="Followers" />
                <StatItem count="84" label="Following" />
            </View>
        </View>

        <View style={styles.bioSection}>
            <Text style={styles.displayName}>{profile.username}</Text>
            <Text style={styles.bioText}>{profile.bio || "Digital architect of the private web. Building the future of Veil."}</Text>
        </View>

        {/* Action Buttons (Brutal Style) */}
        <View style={styles.btnRow}>
            <TouchableOpacity style={styles.mainBtn}><Text style={styles.mainBtnText}>Edit Profile</Text></TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn}><Users color={colors.black} size={20} /></TouchableOpacity>
        </View>

        {/* Menu Items (Glassmorphism) */}
        <View style={styles.menuWrapper}>
            <BlurView intensity={20} tint="dark" style={styles.menuItem}>
                <View style={styles.menuLeft}>
                    <Shield color={colors.success} size={20} />
                    <Text style={styles.menuText}>Privacy Vault</Text>
                </View>
                <ChevronRight color={colors.textMuted} />
            </BlurView>

            <BlurView intensity={20} tint="dark" style={styles.menuItem}>
                <View style={styles.menuLeft}>
                    <Bookmark color={colors.accentSecondary} size={20} />
                    <Text style={styles.menuText}>Saved Cipher-Media</Text>
                </View>
                <ChevronRight color={colors.textMuted} />
            </BlurView>

            <TouchableOpacity onPress={signOut}>
                <BlurView intensity={20} tint="dark" style={[styles.menuItem, { borderColor: colors.error }]}>
                    <View style={styles.menuLeft}>
                        <LogOut color={colors.error} size={20} />
                        <Text style={[styles.menuText, { color: colors.error }]}>Disconnect Node</Text>
                    </View>
                </BlurView>
            </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.md,
  },
  username: { color: colors.white, fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  profileSection: {
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  avatarBorder: {
    padding: 3,
    borderRadius: 50,
    width: 96,
    height: 96,
  },
  avatar: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, borderColor: colors.bg },
  statsRow: { flex: 1, flexDirection: 'row', justifyContent: 'space-around', marginLeft: spacing.lg },
  statContainer: { alignItems: 'center' },
  statCount: { color: colors.white, fontSize: 18, fontWeight: 'bold' },
  statLabel: { color: colors.textSecondary, fontSize: 11, marginTop: 2 },
  bioSection: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  displayName: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  bioText: { color: colors.textSecondary, fontSize: 14, marginTop: 4, lineHeight: 20 },
  btnRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xl,
  },
  mainBtn: {
    flex: 1,
    backgroundColor: colors.white,
    paddingVertical: 12,
    borderRadius: radius.sm,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.black,
    ...shadows.brutal,
    marginRight: spacing.md,
  },
  mainBtnText: { color: colors.black, fontWeight: '900', fontSize: 14 },
  iconBtn: {
    backgroundColor: colors.white,
    padding: 12,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.black,
    ...shadows.brutal,
  },
  menuWrapper: { paddingHorizontal: spacing.lg, marginTop: spacing.xl },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    marginBottom: spacing.md,
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center' },
  menuText: { color: colors.white, marginLeft: spacing.md, fontWeight: '600', fontSize: 14 },
});
