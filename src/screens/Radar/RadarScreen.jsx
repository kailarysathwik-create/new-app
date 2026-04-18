import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { Radar as RadarIcon, Check, X, Anchor, UserPlus, ChevronRight } from 'lucide-react-native';
import { colors, spacing, radius, typography, shadows, borders } from '../../theme/tokens';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useFocusEffect, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';

export default function RadarScreen() {
  const { user } = useAuthStore();
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchSignals = React.useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('*, actor:actor_id(id, username, avatar_url)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error) setSignals(data || []);
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    fetchSignals();
    if (!user?.id) return undefined;

    const channel = supabase
      .channel(`radar_notifications_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchSignals()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchSignals, user?.id]);

  useFocusEffect(
    React.useCallback(() => {
      fetchSignals();
    }, [fetchSignals])
  );

  const handleAction = async (signal, action) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (action === 'accept') {
      // 1. Update Follow Status
      await supabase
        .from('follows')
        .update({ status: 'accepted' })
        .eq('follower_id', signal.actor_id)
        .eq('following_id', user.id);
      
      // 2. Mark Notification as Read
      await supabase.from('notifications').update({ read: true }).eq('id', signal.id);
      
      // 3. Optional: Ask user if they want to follow back (Prompt logic here)
      // For now, just refresh
      fetchSignals();
    } else {
      // Reject: Just delete the follow request and notification
      await supabase.from('follows').delete().eq('follower_id', signal.actor_id).eq('following_id', user.id);
      await supabase.from('notifications').delete().eq('id', signal.id);
      fetchSignals();
    }
  };

  const renderSignal = ({ item }) => (
    <View style={styles.signalCard}>
      <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
      <View style={styles.signalInner}>
        <Image 
            source={item.actor.avatar_url ? { uri: item.actor.avatar_url } : require('../../../assets/images/defaultavatar.png')} 
            style={styles.avatar} 
        />
        <View style={styles.signalContent}>
          <Text style={styles.signalTitle}>
            <Text style={styles.username}>@{item.actor.username}</Text> {item.type === 'follow_request' ? 'sent a signal to board.' : 'captured your vibe.'}
          </Text>
          <Text style={styles.signalTime}>{new Date(item.created_at).toLocaleDateString()}</Text>
        </View>

        {item.type === 'follow_request' && !item.read ? (
          <View style={styles.actions}>
            <TouchableOpacity onPress={() => handleAction(item, 'reject')} style={[styles.actionBtn, styles.rejectBtn]}>
                <X color={colors.white} size={18} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleAction(item, 'accept')} style={[styles.actionBtn, styles.acceptBtn]}>
                <Check color={colors.black} size={18} strokeWidth={3} />
            </TouchableOpacity>
          </View>
        ) : (
          <ChevronRight color={colors.textMuted} size={20} />
        )}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronRight color={colors.white} size={24} style={{ transform: [{ rotate: '180deg' }] }} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>RADAR CENTER</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.scanSection}>
        <Image 
            source={require('../../../assets/images/radar-logo.png')} 
            style={styles.radarLogo} 
            resizeMode="contain"
        />
        <Text style={styles.scanText}>SCANNING FOR SIGNALS...</Text>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={signals}
          keyExtractor={(item) => item.id}
          renderItem={renderSignal}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Anchor color={colors.textMuted} size={48} strokeWidth={1} />
              <Text style={styles.emptyText}>No incoming signals detected. Your harbour is currently private.</Text>
            </View>
          }
        />
      )}
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
    borderBottomWidth: borders.thin, 
    borderColor: colors.glassBorder 
  },
  headerTitle: { fontFamily: typography.family.black, color: colors.white, fontSize: 18, letterSpacing: 2 },
  backBtn: { width: 40, height: 40, justifyContent: 'center' },
  
  scanSection: { alignItems: 'center', paddingVertical: spacing.xl },
  radarLogo: { 
    width: 60, 
    height: 60, 
    marginBottom: 12,
  },
  scanText: { fontFamily: typography.family.black, color: colors.accent, fontSize: 10, letterSpacing: 1 },

  list: { padding: spacing.lg },
  signalCard: { 
    marginBottom: spacing.md, 
    borderRadius: radius.md, 
    overflow: 'hidden', 
    borderWidth: 1, 
    borderColor: colors.glassBorder,
    backgroundColor: 'rgba(255,255,255,0.03)',
    ...shadows.brutalSmall
  },
  signalInner: { flexDirection: 'row', alignItems: 'center', padding: spacing.md },
  avatar: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, borderColor: colors.accent },
  signalContent: { flex: 1, marginLeft: spacing.md },
  signalTitle: { fontFamily: typography.family.bold, color: colors.white, fontSize: 13, lineHeight: 18 },
  username: { fontFamily: typography.family.black, color: colors.accent },
  signalTime: { fontFamily: typography.family.medium, color: colors.textMuted, fontSize: 10, marginTop: 4 },

  actions: { flexDirection: 'row' },
  actionBtn: { 
    width: 36, 
    height: 36, 
    borderRadius: 18, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginLeft: spacing.sm,
    borderWidth: 2,
    borderColor: colors.black,
    ...shadows.brutalSmall
  },
  acceptBtn: { backgroundColor: colors.accent },
  rejectBtn: { backgroundColor: 'rgba(255,50,50,0.2)' },

  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyText: { 
    fontFamily: typography.family.medium, 
    color: colors.textMuted, 
    fontSize: 13, 
    textAlign: 'center', 
    marginTop: 20, 
    paddingHorizontal: 40 
  },
});
