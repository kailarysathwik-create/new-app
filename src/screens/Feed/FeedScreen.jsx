import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, RefreshControl, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { Heart, MessageCircle, Send, MoreHorizontal, Wind, Play } from 'lucide-react-native';
import { colors, spacing, radius, typography, shadows } from '../../theme/tokens';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

const { width } = Dimensions.get('window');

function BreezeItem({ profile, isOwn, index }) {
  return (
    <MotiView 
      from={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 100, type: 'spring' }}
      style={styles.storyContainer}
    >
      <LinearGradient
        colors={[colors.accent, colors.accentSecondary]}
        style={styles.storyGradient}
      >
        <View style={styles.storyInner}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.storyImg} />
          ) : (
            <Text style={styles.storyInitial}>{profile?.username?.[0]?.toUpperCase() ?? '＋'}</Text>
          )}
        </View>
      </LinearGradient>
      <Text style={styles.storyUser} numberOfLines={1}>{isOwn ? 'Me' : profile?.username}</Text>
    </MotiView>
  );
}

function PostCard({ post, index }) {
  const [liked, setLiked] = useState(false);

  return (
    <MotiView 
      from={{ opacity: 0, translateY: 30 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ delay: index * 100, type: 'timing' }}
      style={styles.postCard}
    >
      <View style={styles.postHeader}>
        <View style={styles.userInfo}>
          <Image 
            source={{ uri: post.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${post.profiles?.username}` }} 
            style={styles.postAvatar} 
          />
          <View>
            <Text style={styles.postUsername}>{post.profiles?.username}</Text>
            <Text style={styles.postLocation}>Saily Network</Text>
          </View>
        </View>
        <TouchableOpacity><MoreHorizontal color={colors.textMuted} /></TouchableOpacity>
      </View>

      <View style={styles.mediaWrapper}>
        <Image source={{ uri: post.media_url }} style={styles.postMedia} />
      </View>

      <View style={styles.actionRow}>
        <View style={styles.leftActions}>
          <TouchableOpacity onPress={() => setLiked(!liked)} style={styles.actionIcon}>
            <Heart size={24} color={liked ? colors.accentWarm : colors.white} fill={liked ? colors.accentWarm : 'transparent'} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIcon}><MessageCircle size={24} color={colors.white} /></TouchableOpacity>
          <TouchableOpacity style={styles.actionIcon}><Send size={24} color={colors.white} /></TouchableOpacity>
        </View>
      </View>

      <View style={styles.captionArea}>
        <Text style={styles.captionText}>
          <Text style={styles.captionBold}>{post.profiles?.username}</Text> {post.caption}
        </Text>
        <Text style={styles.timeAgo}>Verified Saily Voyage</Text>
      </View>
    </MotiView>
  );
}

export default function FeedScreen() {
  const { profile } = useAuthStore();
  const [posts, setPosts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('feed'); // 'feed' or 'reels'

  const fetchFeed = useCallback(async () => {
    const { data } = await supabase
      .from('posts')
      .select('*, profiles(username, avatar_url)')
      .order('created_at', { ascending: false });
    setPosts(data || []);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchFeed(); }, [fetchFeed]);

  const renderFeed = () => (
    <FlatList
      data={posts}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => <PostCard post={item} index={index} />}
      ListHeaderComponent={() => (
        <View style={styles.storiesWrapper}>
           <View style={styles.breezeHeader}>
              <Wind color={colors.accent} size={18} />
              <Text style={styles.breezeTitle}>Latest Breezes</Text>
           </View>
           <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              data={[{ isOwn: true, profiles: profile }, ...posts]}
              renderItem={({ item, index }) => <BreezeItem profile={item.profiles} isOwn={item.isOwn} index={index} />}
           />
        </View>
      )}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchFeed()} tintColor={colors.accent} />}
      contentContainerStyle={{ paddingBottom: 100 }}
    />
  );

  const renderReelsPlaceholder = () => (
    <MotiView 
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        style={styles.reelsContainer}
    >
        <MotiView
          animate={{ rotate: '360deg' }}
          transition={{ loop: true, duration: 4000, type: 'timing' }}
        >
          <Play color={colors.accentSecondary} size={64} style={{ marginBottom: 16 }} />
        </MotiView>
        <Text style={styles.reelsTitle}>Reels on the way!</Text>
        <Text style={styles.reelsText}>We are gathering data to build your perfect ocean algorithm.</Text>
        <TouchableOpacity style={styles.inviteBtn}>
            <Text style={styles.inviteBtnText}>Invite Friends to Saily</Text>
        </TouchableOpacity>
    </MotiView>
  );

  return (
    <View style={styles.container}>
      <LinearGradient colors={[colors.bg, '#1A0D05']} style={StyleSheet.absoluteFill} />
      
      <BlurView intensity={30} tint="dark" style={styles.header}>
        <MotiView 
          from={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          style={styles.headerInner}
        >
          <Text style={styles.headerTitle}>SAILY</Text>
          <View style={styles.tabRow}>
              <TouchableOpacity onPress={() => setActiveTab('feed')} style={[styles.tab, activeTab === 'feed' && styles.tabActive]}>
                  <Text style={[styles.tabText, activeTab === 'feed' && styles.tabTextActive]}>Feed</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setActiveTab('reels')} style={[styles.tab, activeTab === 'reels' && styles.tabActive]}>
                  <Text style={[styles.tabText, activeTab === 'reels' && styles.tabTextActive]}>Reels</Text>
              </TouchableOpacity>
          </View>
        </MotiView>
      </BlurView>

      {activeTab === 'feed' ? renderFeed() : renderReelsPlaceholder()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.xxl, paddingBottom: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.glassBorder, zIndex: 10, overflow: 'hidden' },
  headerInner: { alignItems: 'center' },
  headerTitle: { 
    fontFamily: typography.family.black,
    fontSize: typography.size.xl, 
    color: colors.white, 
    letterSpacing: 2, 
    textAlign: 'center', 
    marginBottom: 12 
  },
  tabRow: { flexDirection: 'row', justifyContent: 'center' },
  tab: { paddingHorizontal: spacing.lg, paddingVertical: 6, borderRadius: radius.full, marginHorizontal: 4 },
  tabActive: { backgroundColor: colors.accent },
  tabText: { 
    fontFamily: typography.family.bold,
    color: colors.textSecondary, 
    fontSize: 13 
  },
  tabTextActive: { color: colors.white },
  
  storiesWrapper: { paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.glassBorder },
  breezeHeader: { flexDirection: 'row', alignItems: 'center', marginLeft: spacing.lg, marginBottom: 12 },
  breezeTitle: { 
    fontFamily: typography.family.black,
    color: colors.white, 
    fontSize: 14, 
    marginLeft: 8, 
    letterSpacing: 1 
  },
  storyContainer: { alignItems: 'center', marginHorizontal: spacing.sm, paddingLeft: spacing.sm },
  storyGradient: { width: 68, height: 68, borderRadius: 34, padding: 3, justifyContent: 'center', alignItems: 'center' },
  storyInner: { width: 62, height: 62, borderRadius: 31, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 2, borderColor: colors.bg },
  storyImg: { width: '100%', height: '100%' },
  storyInitial: { color: colors.white, fontWeight: 'bold', fontSize: 20 },
  storyUser: { 
    fontFamily: typography.family.medium,
    color: colors.textSecondary, 
    fontSize: 11, 
    marginTop: 4, 
    textAlign: 'center' 
  },
  
  postCard: { marginBottom: spacing.xl },
  postHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  postAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: spacing.sm },
  postUsername: { 
    fontFamily: typography.family.bold,
    color: colors.white, 
    fontSize: 14 
  },
  postLocation: { 
    fontFamily: typography.family.regular,
    color: colors.textMuted, 
    fontSize: 11 
  },
  mediaWrapper: { width: width, height: width, backgroundColor: colors.bgSurface, borderTopWidth: 1, borderBottomWidth: 1, borderColor: colors.glassBorder },
  postMedia: { width: '100%', height: '100%' },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md },
  leftActions: { flexDirection: 'row' },
  actionIcon: { marginRight: spacing.lg },
  captionArea: { paddingHorizontal: spacing.md },
  captionText: { 
    fontFamily: typography.family.regular,
    color: colors.white, 
    fontSize: 14, 
    lineHeight: 18 
  },
  captionBold: { fontFamily: typography.family.bold },
  timeAgo: { 
    fontFamily: typography.family.black,
    color: colors.accent, 
    fontSize: 11, 
    marginTop: spacing.xs 
  },

  reelsContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  reelsTitle: { 
    fontFamily: typography.family.black,
    color: colors.white, 
    fontSize: 24, 
    marginBottom: 8 
  },
  reelsText: { 
    fontFamily: typography.family.medium,
    color: colors.textSecondary, 
    textAlign: 'center', 
    lineHeight: 22, 
    fontSize: 14 
  },
  inviteBtn: { marginTop: 32, backgroundColor: colors.white, paddingHorizontal: 24, paddingVertical: 14, borderRadius: radius.md, ...shadows.brutal, borderWidth: 2, borderColor: colors.black },
  inviteBtnText: { 
    fontFamily: typography.family.black,
    color: colors.black, 
    fontSize: 15 
  },
});
