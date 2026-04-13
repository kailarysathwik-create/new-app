import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Dimensions, Alert, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { Settings, LogOut, Shield, ChevronRight, Grid, Bookmark, Users, Cloud, CheckCircle2 } from 'lucide-react-native';
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
  const { profile, signOut, linkCloudNode, loading } = useAuthStore();

  if (!profile) return null;

  const handleLinkCloud = async () => {
    if (profile.cloud_node_folder_id) {
        Alert.alert("Cloud Node Active", "Your 5TB Saily Cloud Node is already linked and healthy.");
        return;
    }
    const result = await linkCloudNode();
    if (result?.success) {
        Alert.alert("Success", "SAILY folder created in your drive. Personal Cloud Node is now active!");
    } else if (result?.error) {
        Alert.alert("Link Failed", "Could not connect to your cloud storage.");
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[colors.bg, '#1D120B']} style={StyleSheet.absoluteFill} />
      
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
            <Text style={styles.bioText}>{profile.bio || "Digital architect of the private web. Building the future of Saily."}</Text>
        </View>

        {/* Action Buttons (Brutal Style) */}
        <View style={styles.btnRow}>
            <TouchableOpacity style={styles.mainBtn}><Text style={styles.mainBtnText}>Edit Profile</Text></TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn}><Users color={colors.black} size={20} /></TouchableOpacity>
        </View>

        {/* Cloud Node Activation Card */}
        <MotiView 
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={styles.cloudCardWrapper}
        >
            <TouchableOpacity onPress={handleLinkCloud} disabled={loading}>
                <LinearGradient 
                    colors={profile.cloud_node_folder_id ? ['#1A2E1A', '#0F1A0F'] : [colors.bgSurface, colors.bgCard]}
                    style={styles.cloudCard}
                >
                    <View style={styles.cloudCardLeft}>
                        <Cloud color={profile.cloud_node_folder_id ? colors.success : colors.accent} size={28} />
                        <View style={{ marginLeft: spacing.md }}>
                            <Text style={styles.cloudTitle}>{profile.cloud_node_folder_id ? "Cloud Node Active 🛰️" : "Link Cloud Node (5TB) ☁️"}</Text>
                            <Text style={styles.cloudSub}>
                                {profile.cloud_node_folder_id ? "Everything is synced to your SAILY folder." : "Use your own storage as the primary DB."}
                            </Text>
                        </View>
                    </View>
                    {loading ? <ActivityIndicator color={colors.white} /> : (
                        profile.cloud_node_folder_id ? <CheckCircle2 color={colors.success} size={24} /> : <ChevronRight color={colors.textMuted} size={24} />
                    )}
                </LinearGradient>
            </TouchableOpacity>
        </MotiView>

        {/* Menu Items (Glassmorphism) */}
        <View style={styles.menuWrapper}>
            <BlurView intensity={20} tint="dark" style={styles.menuItem}>
                <View style={styles.menuLeft}>
                    <Grid color={colors.accentSecondary} size={20} />
                    <Text style={styles.menuText}>Import Instagram Data</Text>
                </View>
                <ChevronRight color={colors.textMuted} />
            </BlurView>

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
  username: { fontFamily: typography.family.black, color: colors.white, fontSize: 18, letterSpacing: 1 },
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
  statCount: { fontFamily: typography.family.black, color: colors.white, fontSize: 18 },
  statLabel: { fontFamily: typography.family.medium, color: colors.textSecondary, fontSize: 11, marginTop: 2 },
  bioSection: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
  displayName: { fontFamily: typography.family.bold, color: colors.white, fontSize: 16 },
  bioText: { fontFamily: typography.family.regular, color: colors.textSecondary, fontSize: 14, marginTop: 4, lineHeight: 20 },
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
  mainBtnText: { fontFamily: typography.family.black, color: colors.black, fontSize: 14 },
  iconBtn: {
    backgroundColor: colors.white,
    padding: 12,
    borderRadius: radius.sm,
    borderWidth: 2,
    borderColor: colors.black,
    ...shadows.brutal,
  },
  
  cloudCardWrapper: { paddingHorizontal: spacing.lg, marginTop: spacing.xl },
  cloudCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
  },
  cloudCardLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  cloudTitle: { fontFamily: typography.family.black, color: colors.white, fontSize: 16 },
  cloudSub: { fontFamily: typography.family.medium, color: colors.textSecondary, fontSize: 11, marginTop: 2 },

  menuWrapper: { paddingHorizontal: spacing.lg, marginTop: spacing.lg },
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
  menuText: { fontFamily: typography.family.bold, color: colors.white, marginLeft: spacing.md, fontSize: 14 },
});
