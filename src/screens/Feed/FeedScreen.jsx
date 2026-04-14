import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, RefreshControl, Dimensions, Alert, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import * as ImagePicker from 'expo-image-picker';
import { Heart, MessageCircle, Send, MoreHorizontal, Wind, Play, Plus, ShieldCheck } from 'lucide-react-native';
import { colors, spacing, radius, typography, shadows, borders } from '../../theme/tokens';
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
        <View style={[styles.storyFrame, isOwn && styles.storyFrameOwn]}>
            <View style={styles.storyInner}>
            {isOwn && !profile?.avatar_url ? (
                <Plus color={colors.white} size={24} />
            ) : profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={styles.storyImg} />
            ) : (
                <Text style={styles.storyInitial}>{profile?.username?.[0]?.toUpperCase() ?? '＋'}</Text>
            )}
            </View>
        </View>
      </TouchableOpacity>
      <Text style={styles.storyUser} numberOfLines={1}>{isOwn ? 'NEW' : profile?.username}</Text>
    </MotiView>
  );
}

function PostCard({ post, index }) {
  const [liked, setLiked] = useState(false);
  const [resolvedUri, setResolvedUri] = useState(post.media_url);
  const { cloudNode } = useAuthStore();

  useEffect(() => {
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
          <View style={styles.avatarFrame}>
            <Image 
                source={{ uri: post.profiles?.avatar_url || `https://ui-avatars.com/api/?name=${post.profiles?.username}` }} 
                style={styles.postAvatar} 
            />
          </View>
          <View>
            <Text style={styles.postUsername}>{post.profiles?.username}</Text>
            <View style={styles.secureRow}>
                <ShieldCheck size={10} color={colors.black} />
                <Text style={styles.secureText}>DRIVE SECURED</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.moreBtn}><MoreHorizontal color={colors.black} size={20} /></TouchableOpacity>
      </View>

      <View style={styles.mediaFrame}>
        <Image source={{ uri: resolvedUri }} style={styles.postMedia} />
      </View>

      <View style={styles.actionRow}>
        <View style={styles.leftActions}>
          <TouchableOpacity onPress={() => setLiked(!liked)} style={styles.actionIcon}>
            <Heart size={26} color={colors.black} fill={liked ? colors.accentWarm : 'transparent'} strokeWidth={3} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIcon}><MessageCircle size={26} color={colors.black} strokeWidth={3} /></TouchableOpacity>
          <TouchableOpacity style={styles.actionIcon}><Send size={26} color={colors.black} strokeWidth={3} /></TouchableOpacity>
        </View>
      </View>

      <View style={styles.captionArea}>
        <Text style={styles.captionText}>
          <Text style={styles.captionBold}>{post.profiles?.username}</Text> {post.caption}
        </Text>
        <Text style={styles.timeLabel}>VERIFIED CIPHER</Text>
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
      Alert.alert("Cloud Node Required", "Link your 5TB Google Drive in Profile to enable secure social voyage.");
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
        const { fileId, error } = await uploadToCloud(result.assets[0].uri, fileName, cloudNode.accessToken, cloudNode.folderId);
        if (error) throw error;

        const { error: dbError } = await supabase.from('posts').insert({
            user_id: user.id,
            caption: "NEW SECURE VOYAGE",
            media_url: 'cloud://' + fileId,
            cloud_file_id: fileId,
        });

        if (dbError) throw dbError;
        fetchFeed();
    } catch (e) {
        Alert.alert("Voyage Failed", e.message);
    } finally {
        setIsUploading(false);
    }
  };

  const renderFeed = () => (
    <View style={{ flex: 1 }}>
      {isUploading && (
        <View style={styles.uploadOverlay}>
             <ActivityIndicator color={colors.black} size="large" />
             <Text style={styles.uploadText}>ANCHORING TO 5TB DRIVE...</Text>
        </View>
      )}
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => <PostCard post={item} index={index} />}
        ListHeaderComponent={() => (
            <View style={styles.storiesWrapper}>
            <View style={styles.breezeHeader}>
                <Wind color={colors.black} size={18} strokeWidth={3} />
                <Text style={styles.breezeTitle}>ACTIVE BREEZES</Text>
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

  return (
    <View style={styles.container}>
      {/* Brutalist Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>SAILY</Text>
        <View style={styles.tabRow}>
            <TouchableOpacity onPress={() => setActiveTab('feed')} style={[styles.tab, activeTab === 'feed' && styles.tabActive]}>
                <Text style={[styles.tabText, activeTab === 'feed' && styles.tabTextActive]}>FEED</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setActiveTab('reels')} style={[styles.tab, activeTab === 'reels' && styles.tabActive]}>
                <Text style={[styles.tabText, activeTab === 'reels' && styles.tabTextActive]}>REELS</Text>
            </TouchableOpacity>
        </View>
      </View>

      {renderFeed()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { 
    paddingHorizontal: spacing.lg, 
    paddingTop: spacing.xxl, 
    paddingBottom: spacing.md, 
    backgroundColor: colors.accent,
    borderBottomWidth: borders.thick, 
    borderBottomColor: borders.color, 
    zIndex: 10,
    ...shadows.brutalSmall
  },
  headerTitle: { 
    fontFamily: typography.family.black,
    fontSize: 28, 
    color: colors.black, 
    letterSpacing: 1, 
    textAlign: 'center', 
    marginBottom: 12 
  },
  tabRow: { flexDirection: 'row', justifyContent: 'center' },
  tab: { 
    paddingHorizontal: 24, paddingVertical: 8, 
    borderWidth: borders.medium, borderColor: borders.color, 
    marginHorizontal: 4, backgroundColor: colors.white,
    ...shadows.brutalSmall
  },
  tabActive: { backgroundColor: colors.black },
  tabText: { fontFamily: typography.family.black, color: colors.black, fontSize: 12 },
  tabTextActive: { color: colors.white },
  
  storiesWrapper: { 
    paddingVertical: spacing.md, 
    borderBottomWidth: borders.medium, 
    borderBottomColor: borders.color,
    backgroundColor: colors.white 
  },
  breezeHeader: { flexDirection: 'row', alignItems: 'center', marginLeft: spacing.lg, marginBottom: 12 },
  breezeTitle: { fontFamily: typography.family.black, color: colors.black, fontSize: 13, marginLeft: 8 },
  storyContainer: { alignItems: 'center', marginHorizontal: spacing.sm, paddingLeft: spacing.sm },
  storyFrame: { 
    width: 72, height: 72, 
    borderWidth: borders.thick, borderColor: borders.color, 
    justifyContent: 'center', alignItems: 'center',
    backgroundColor: colors.white,
    ...shadows.brutalSmall
  },
  storyFrameOwn: { backgroundColor: colors.accentSecondary },
  storyInner: { width: 60, height: 60, backgroundColor: colors.black, justifyContent: 'center', alignItems: 'center', overflow: 'hidden' },
  storyImg: { width: '100%', height: '100%' },
  storyInitial: { color: colors.white, fontFamily: typography.family.black, fontSize: 24 },
  storyUser: { fontFamily: typography.family.black, color: colors.black, fontSize: 9, marginTop: 8, textAlign: 'center', textTransform: 'uppercase' },
  
  uploadOverlay: { 
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, 
    justifyContent: 'center', alignItems: 'center', backgroundColor: colors.accent 
  },
  uploadText: { fontFamily: typography.family.black, color: colors.black, marginTop: 16 },

  postCard: { marginBottom: spacing.xl, backgroundColor: colors.white, borderWidth: borders.thick, borderColor: borders.color, margin: spacing.md, ...shadows.brutal },
  postHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md, borderBottomWidth: borders.medium, borderColor: borders.color },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  avatarFrame: { width: 44, height: 44, borderWidth: borders.medium, borderColor: borders.color, marginRight: spacing.sm, overflow: 'hidden' },
  postAvatar: { width: '100%', height: '100%' },
  postUsername: { fontFamily: typography.family.black, color: colors.black, fontSize: 15, textTransform: 'uppercase' },
  secureRow: { flexDirection: 'row', alignItems: 'center', marginTop: 1 },
  secureText: { fontFamily: typography.family.bold, color: colors.textMuted, fontSize: 8, marginLeft: 3 },
  moreBtn: { width: 36, height: 36, borderWidth: 2, borderColor: borders.color, justifyContent: 'center', alignItems: 'center' },
  
  mediaFrame: { width: '100%', aspectRatio: 1, backgroundColor: colors.bgSurface, borderBottomWidth: borders.medium, borderColor: borders.color },
  postMedia: { width: '100%', height: '100%' },
  
  actionRow: { flexDirection: 'row', padding: spacing.md },
  leftActions: { flexDirection: 'row' },
  actionIcon: { marginRight: spacing.lg },
  
  captionArea: { paddingHorizontal: spacing.md, paddingBottom: spacing.md },
  captionText: { fontFamily: typography.family.regular, color: colors.black, fontSize: 14, lineHeight: 18 },
  captionBold: { fontFamily: typography.family.black },
  timeLabel: { fontFamily: typography.family.black, color: colors.accent, fontSize: 10, marginTop: 8 },
});

