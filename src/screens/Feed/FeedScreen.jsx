import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, RefreshControl, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, MessageCircle, Send, MoreHorizontal, LayoutGrid } from 'lucide-react-native';
import { colors, spacing, radius, typography, shadows } from '../../theme/tokens';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';

const { width } = Dimensions.get('window');

function StoryItem({ profile, isOwn }) {
  return (
    <View style={styles.storyContainer}>
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
    </View>
  );
}

function PostCard({ post }) {
  const [liked, setLiked] = useState(false);

  return (
    <View style={styles.postCard}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        <View style={styles.userInfo}>
          <Image 
            source={{ uri: post.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${post.profiles?.username}` }} 
            style={styles.postAvatar} 
          />
          <View>
            <Text style={styles.postUsername}>{post.profiles?.username}</Text>
            <Text style={styles.postLocation}>Encrypted Network</Text>
          </View>
        </View>
        <TouchableOpacity><MoreHorizontal color={colors.textMuted} /></TouchableOpacity>
      </View>

      {/* Media with brutal border */}
      <View style={styles.mediaWrapper}>
        <Image source={{ uri: post.media_url }} style={styles.postMedia} />
        {/* Glass overlay for like count or similar */}
      </View>

      {/* Action Row */}
      <View style={styles.actionRow}>
        <View style={styles.leftActions}>
          <TouchableOpacity onPress={() => setLiked(!liked)} style={styles.actionIcon}>
            <Heart size={24} color={liked ? colors.accentWarm : colors.white} fill={liked ? colors.accentWarm : 'transparent'} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIcon}><MessageCircle size={24} color={colors.white} /></TouchableOpacity>
          <TouchableOpacity style={styles.actionIcon}><Send size={24} color={colors.white} /></TouchableOpacity>
        </View>
        <TouchableOpacity><LayoutGrid size={24} color={colors.white} /></TouchableOpacity>
      </View>

      {/* Caption Area */}
      <View style={styles.captionArea}>
        <Text style={styles.captionText}>
          <Text style={styles.captionBold}>{post.profiles?.username}</Text> {post.caption}
        </Text>
        <Text style={styles.timeAgo}>2 hours ago • Verified Privacy</Text>
      </View>
    </View>
  );
}

export default function FeedScreen() {
  const { profile } = useAuthStore();
  const [posts, setPosts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchFeed = useCallback(async () => {
    const { data } = await supabase
      .from('posts')
      .select('*, profiles(username, avatar_url)')
      .order('created_at', { ascending: false });
    setPosts(data || []);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchFeed(); }, [fetchFeed]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={[colors.bg, '#10002B']} style={StyleSheet.absoluteFill} />
      
      {/* Premium Header */}
      <BlurView intensity={30} tint="dark" style={styles.header}>
        <Text style={styles.headerTitle}>VEIL</Text>
        <TouchableOpacity style={styles.headerIcon}>
            <MessageCircle color={colors.white} size={24} />
            <View style={styles.badge} />
        </TouchableOpacity>
      </BlurView>

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <PostCard post={item} />}
        ListHeaderComponent={() => (
          <View style={styles.storiesWrapper}>
             <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={[{ isOwn: true, profiles: profile }, ...posts]} // Placeholder stories
                renderItem={({ item }) => <StoryItem profile={item.profiles} isOwn={item.isOwn} />}
             />
          </View>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchFeed()} tintColor={colors.accent} />}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
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
    borderBottomColor: colors.glassBorder,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.black,
    color: colors.white,
    letterSpacing: 2,
  },
  headerIcon: {
    padding: spacing.sm,
    backgroundColor: colors.glass,
    borderRadius: radius.md,
  },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accentWarm,
  },
  storiesWrapper: {
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.glassBorder,
  },
  storyContainer: {
    alignItems: 'center',
    marginHorizontal: spacing.sm,
    paddingLeft: spacing.sm,
  },
  storyGradient: {
    width: 68,
    height: 68,
    borderRadius: 34,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyInner: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: colors.bg,
  },
  storyImg: { width: '100%', height: '100%' },
  storyInitial: { color: colors.white, fontWeight: 'bold', fontSize: 20 },
  storyUser: { color: colors.textSecondary, fontSize: 11, marginTop: 4, textAlign: 'center' },
  
  postCard: {
    marginBottom: spacing.xl,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  postAvatar: { width: 36, height: 36, borderRadius: 18, marginRight: spacing.sm },
  postUsername: { color: colors.white, fontWeight: 'bold', fontSize: 14 },
  postLocation: { color: colors.textMuted, fontSize: 11 },
  
  mediaWrapper: {
    width: width,
    height: width,
    backgroundColor: colors.bgSurface,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.glassBorder,
  },
  postMedia: { width: '100%', height: '100%' },
  
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
  },
  leftActions: { flexDirection: 'row' },
  actionIcon: { marginRight: spacing.lg },
  
  captionArea: { paddingHorizontal: spacing.md },
  captionText: { color: colors.white, fontSize: 14, lineHeight: 18 },
  captionBold: { fontWeight: 'bold' },
  timeAgo: { color: colors.textMuted, fontSize: 10, marginTop: spacing.xs },
});
