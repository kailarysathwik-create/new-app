import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, Platform, ActivityIndicator, FlatList, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { UserPlus, UserCheck, Clock, ShieldAlert, Lock, ChevronLeft, MessageCircle } from 'lucide-react-native';
import { colors, spacing, radius, typography, shadows, borders } from '../../theme/tokens';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams();
  const { user: currentUser } = useAuthStore();
  const router = useRouter();

  const [profile, setProfile] = useState(null);
  const [followStatus, setFollowStatus] = useState(null); // null, 'pending', 'accepted'
  const [isMutual, setIsMutual] = useState(false);
  const [anchors, setAnchors] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    
    // 1. Fetch Profile
    const { data: profileData } = await supabase.from('profiles').select('*').eq('id', userId).single();
    setProfile(profileData);

    // 2. Fetch Follow Status (Current -> Target)
    const { data: followData } = await supabase
      .from('follows')
      .select('status')
      .eq('follower_id', currentUser.id)
      .eq('following_id', userId)
      .single();
    setFollowStatus(followData?.status || null);

    // 3. Check if Mutual
    const { data: backFollowData } = await supabase
      .from('follows')
      .select('status')
      .eq('follower_id', userId)
      .eq('following_id', currentUser.id)
      .eq('status', 'accepted')
      .single();
    
    const mutual = followData?.status === 'accepted' && !!backFollowData;
    setIsMutual(mutual);

    // 4. Fetch Anchors if Mutual
    if (mutual || userId === currentUser.id) {
        const { data: anchorsData } = await supabase.from('posts').select('*').eq('user_id', userId).order('created_at', { ascending: false });
        setAnchors(anchorsData || []);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [userId]);

  const handleFollow = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (followStatus) return; // Already requested or following

    const { error } = await supabase.from('follows').insert({
      follower_id: currentUser.id,
      following_id: userId,
      status: 'pending'
    });

    if (!error) {
      const { data: existingNotification } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('actor_id', currentUser.id)
        .eq('type', 'follow_request')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!existingNotification) {
        await supabase.from('notifications').insert({
          user_id: userId,
          actor_id: currentUser.id,
          type: 'follow_request',
          read: false,
        });
      }

      setFollowStatus('pending');
    }
  };

  if (loading) return <View style={styles.center}><ActivityIndicator color={colors.accent} /></View>;

  return (
    <View style={styles.container}>
      <LinearGradient colors={[colors.bg, '#050510']} style={StyleSheet.absoluteFill} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft color={colors.white} size={24} />
        </TouchableOpacity>
        <Image 
            source={require('../../../assets/images/profile-logo.png')} 
            style={styles.profileLogo} 
            resizeMode="contain"
        />
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileSection}>
            <LinearGradient colors={[colors.accent, colors.accentSecondary]} style={styles.avatarBorder}>
                <Image source={profile.avatar_url ? { uri: profile.avatar_url } : require('../../../assets/images/defaultavatar.png')} style={styles.avatar} />
            </LinearGradient>
            <Text style={styles.username}>@{profile.username}</Text>
            <Text style={styles.bio}>{profile.bio || "Sailing the private web with Saily."}</Text>
        </View>

        <View style={styles.actionRow}>
            {followStatus === 'accepted' ? (
                <View style={[styles.statusBadge, isMutual && styles.mutualBadge]}>
                    {isMutual ? <UserCheck size={16} color={colors.black} /> : <UserPlus size={16} color={colors.white} />}
                    <Text style={[styles.statusText, isMutual && { color: colors.black }]}>
                        {isMutual ? 'MUTUAL FOLLOW' : 'FOLLOWING'}
                    </Text>
                </View>
            ) : followStatus === 'pending' ? (
                <View style={styles.pendingBadge}>
                    <Clock size={16} color={colors.accent} />
                    <Text style={styles.pendingText}>SIGNAL SENT</Text>
                </View>
            ) : (
                <TouchableOpacity style={styles.followBtn} onPress={handleFollow}>
                    <UserPlus size={18} color={colors.black} />
                    <Text style={styles.followBtnText}>SEND SIGNAL</Text>
                </TouchableOpacity>
            )}

            {isMutual && (
                <TouchableOpacity style={styles.chatBtn} onPress={() => router.push(`/chat?id=${profile.id}`)}>
                    <MessageCircle color={colors.white} size={20} />
                </TouchableOpacity>
            )}
        </View>

        <View style={styles.contentSection}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>ANCHORS</Text>
                {!isMutual && userId !== currentUser.id && (
                    <View style={styles.privacyLock}>
                        <Lock size={12} color={colors.textMuted} />
                        <Text style={styles.lockText}>PRIVATE</Text>
                    </View>
                )}
            </View>

            {isMutual || userId === currentUser.id ? (
                <View style={styles.anchorGrid}>
                   {anchors.map(anchor => (
                       <Image key={anchor.id} source={{ uri: anchor.media_url }} style={styles.gridImg} />
                   ))}
                   {anchors.length === 0 && <Text style={styles.emptyText}>No anchors dropped yet.</Text>}
                </View>
            ) : (
                <View style={styles.lockedState}>
                    <ShieldAlert color={colors.textMuted} size={48} strokeWidth={1} />
                    <Text style={styles.lockedTitle}>CONTENT PROTECTED</Text>
                    <Text style={styles.lockedSub}>
                        Anchors are only visible to mutual followers. Send a signal and wait for approval to board this harbour.
                    </Text>
                </View>
            )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: spacing.lg, 
    paddingTop: spacing.xxl, 
    paddingBottom: spacing.md, 
    borderBottomWidth: 1, 
    borderColor: colors.glassBorder 
  },
  profileLogo: { 
    width: 120, 
    height: 24,
  },
  headerTitle: { fontFamily: typography.family.black, color: colors.white, fontSize: 14, letterSpacing: 2 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  scrollContent: { paddingBottom: 100 },
  profileSection: { alignItems: 'center', marginTop: spacing.xl, paddingHorizontal: spacing.lg },
  avatarBorder: { padding: 3, borderRadius: 60, width: 120, height: 120 },
  avatar: { width: 114, height: 114, borderRadius: 57, borderWidth: 4, borderColor: colors.bg },
  username: { fontFamily: typography.family.black, color: colors.white, fontSize: 24, marginTop: spacing.md },
  bio: { fontFamily: typography.family.medium, color: colors.textSecondary, fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  
  actionRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: spacing.xl },
  followBtn: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: colors.accent, 
    paddingHorizontal: 24, 
    paddingVertical: 12, 
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.black,
    ...shadows.brutalSmall
  },
  followBtnText: { fontFamily: typography.family.black, color: colors.black, fontSize: 14, marginLeft: 8 },
  statusBadge: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20, 
    paddingVertical: 10, 
    borderRadius: radius.full, 
    borderWidth: 1, 
    borderColor: colors.glassBorder,
    backgroundColor: 'rgba(255,255,255,0.05)'
  },
  mutualBadge: { backgroundColor: colors.accentSecondary, borderColor: colors.black },
  statusText: { fontFamily: typography.family.black, color: colors.white, fontSize: 12, marginLeft: 8 },
  pendingBadge: { flexDirection: 'row', alignItems: 'center', padding: 12 },
  pendingText: { fontFamily: typography.family.black, color: colors.accent, fontSize: 12, marginLeft: 8 },
  chatBtn: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    backgroundColor: colors.bgSurface, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginLeft: spacing.md, 
    borderWidth: 1, 
    borderColor: colors.glassBorder 
  },

  contentSection: { marginTop: 40, paddingHorizontal: spacing.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  sectionTitle: { fontFamily: typography.family.black, color: colors.white, fontSize: 16, letterSpacing: 1 },
  privacyLock: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  lockText: { fontFamily: typography.family.black, color: colors.textMuted, fontSize: 9, marginLeft: 4 },

  lockedState: { alignItems: 'center', marginTop: 40, padding: spacing.xl, backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: radius.lg, borderWidth: 1, borderColor: colors.glassBorder },
  lockedTitle: { fontFamily: typography.family.black, color: colors.white, fontSize: 16, marginTop: 20 },
  lockedSub: { fontFamily: typography.family.medium, color: colors.textMuted, fontSize: 13, textAlign: 'center', marginTop: 12, lineHeight: 20 },
  
  anchorGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  gridImg: { width: (width - spacing.lg * 2) / 3 - 4, height: (width - spacing.lg * 2) / 3 - 4, margin: 2, borderRadius: 4, backgroundColor: colors.bgSurface },
  emptyText: { fontFamily: typography.family.medium, color: colors.textMuted, fontSize: 14, textAlign: 'center', width: '100%', marginTop: 20 },
});
