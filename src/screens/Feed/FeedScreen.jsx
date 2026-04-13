import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, RefreshControl, Dimensions, Alert, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import * as ImagePicker from 'expo-image-picker';
import { Heart, MessageCircle, Send, MoreHorizontal, Wind, Play, Plus } from 'lucide-react-native';
import { colors, spacing, radius, typography, shadows } from '../../theme/tokens';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { uploadToCloud, downloadFromCloud } from '../../lib/cloudNode';

const { width } = Dimensions.get('window');

function BreezeItem({ profile, isOwn, index, onAdd }) {
  return (
    <MotiView 
      from={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: index * 100, type: 'spring' }}
      style={styles.storyContainer}
    >
      <TouchableOpacity onPress={isOwn ? onAdd : undefined}>
        <LinearGradient
            colors={isOwn && !profile?.avatar_url ? [colors.accent, colors.accentSecondary] : ['transparent', 'transparent']}
            style={[styles.storyGradient, isOwn && !profile?.avatar_url && styles.storyGradientActive]}
        >
            <View style={styles.storyInner}>
            {isOwn && !profile?.avatar_url ? (
                <Plus color={colors.white} size={24} />
            ) : profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.storyImg} />
            ) : (
                <Text style={styles.storyInitial}>{profile?.username?.[0]?.toUpperCase() ?? '＋'}</Text>
            )}
            </View>
        </LinearGradient>
      </TouchableOpacity>
      <Text style={styles.storyUser} numberOfLines={1}>{isOwn ? 'Add Breeze' : profile?.username}</Text>
    </MotiView>
  );
}

function PostCard({ post, index }) {
  const [liked, setLiked] = useState(false);
  const [resolvedUri, setResolvedUri] = useState(post.media_url);
  const { cloudNode } = useAuthStore();

  useEffect(() => {
    // If post is stored on the Cloud Node, we need to download/decrypt it
    if (post.cloud_file_id && cloudNode?.accessToken) {
        downloadFromCloud(post.cloud_file_id, cloudNode.accessToken).then(res => {
            if (res.localUri) setResolvedUri(res.localUri);
        });
    }
  }, [post.cloud_file_id, cloudNode]);

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
            <Text style={styles.postLocation}>Saily Cloud Node</Text>
          </View>
        </View>
        <TouchableOpacity><MoreHorizontal color={colors.textMuted} /></TouchableOpacity>
      </View>

      <View style={styles.mediaWrapper}>
        <Image source={{ uri: resolvedUri }} style={styles.postMedia} />
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
  const { profile, cloudNode, user } = useAuthStore();
  const [posts, setPosts] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('feed'); 
  const [isUploading, setIsUploading] = useState(false);

  const fetchFeed = useCallback(async () => {
    const { data } = await supabase
      .from('posts')
      .select('*, profiles(username, avatar_url)')
      .order('created_at', { ascending: false });
    setPosts(data || []);
    setRefreshing(false);
  }, []);

  useEffect(() => { fetchFeed(); }, [fetchFeed]);

  const handleAddBreeze = async () => {
    if (!cloudNode) {
      Alert.alert("Cloud Node Required", "Please link your Saily Cloud Node in your Profile first to enable 5TB private storage.");
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });

    if (result.canceled) return;

    try {
        setIsUploading(true);
        const fileName = `post_${Date.now()}.jpg`;

        // 1. Upload Encrypted to Cloud Node (Personal Storage)
        const { fileId, error } = await uploadToCloud(
            result.assets[0].uri, 
            fileName, 
            cloudNode.accessToken, 
            cloudNode.folderId
        );

        if (error) throw error;

        // 2. Save Metadata to Supabase
        const { error: dbError } = await supabase.from('posts').insert({
            user_id: user.id,
            caption: "New Saily Breeze",
            media_url: 'cloud://' + fileId, // Placeholder
            cloud_file_id: fileId,
        });

        if (dbError) throw dbError;

        Alert.alert("Breeze Launched!", "Your media is now securely sailing in your 5TB cloud folder.");
        fetchFeed();
    } catch (e) {
        Alert.alert("Launch Failed", "Could not reach your cloud node: " + e.message);
    } finally {
        setIsUploading(false);
    }
  };

  const renderFeed = () => (
    <View style={{ flex: 1 }}>
      {isUploading && (
        <BlurView intensity={30} tint="dark" style={styles.uploadOverlay}>
             <ActivityIndicator color={colors.accent} size="large" />
             <Text style={styles.uploadText}>Sailing your media to your 5TB drive...</Text>
        </BlurView>
      )}
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
                renderItem={({ item, index }) => (
                    <BreezeItem 
                        profile={item.profiles} 
                        isOwn={item.isOwn} 
                        index={index} 
                        onAdd={handleAddBreeze}
                    />
                )}
            />
            </View>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchFeed()} tintColor={colors.accent} />}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
    </View>
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
      <LinearGradient colors={[colors.bg, '#1D120B']} style={StyleSheet.absoluteFill} />
      
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
  storyGradientActive: { borderWidth: 2, borderColor: colors.white, borderStyle: 'dashed' },
  storyInner: { width: 62, height: 62, borderRadius: 31, backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', borderWidth: 2, borderColor: colors.bg },
  storyImg: { width: '100%', height: '100%' },
  storyInitial: { color: colors.white, fontWeight: 'bold', fontSize: 20 },
  storyUser: { 
    fontFamily: typography.family.medium,
    color: colors.textSecondary, 
    fontSize: 11, 
    marginTop: 4, 
    textAlign: 'center',
    width: 68
  },
  
  uploadOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, justifyContent: 'center', alignItems: 'center' },
  uploadText: { fontFamily: typography.family.bold, color: colors.white, marginTop: 16, textAlign: 'center' },

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
