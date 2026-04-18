import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { MotiView } from 'moti';
import * as ImagePicker from 'expo-image-picker';
import {
  Heart,
  MessageCircle,
  Send,
  MoreHorizontal,
  Wind,
  Plus,
  ShieldCheck,
  Music,
  Anchor as AnchorIcon,
} from 'lucide-react-native';
import { colors, spacing, typography, shadows, borders } from '../../theme/tokens';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { uploadToHarbour, downloadFromHarbour } from '../../lib/cloudNode';
import MusicPickerModal from '../../components/Music/MusicPickerModal';
import BreezeViewer from '../../components/Breezes/BreezeViewer';
import NeoButton from '../../components/ui/NeoButton';
import GridBackground from '../../components/ui/GridBackground';
import { useRouter } from 'expo-router';

let AudioModule = null;
try {
  AudioModule = require('expo-av');
} catch (_error) {
  AudioModule = null;
}
const Audio = AudioModule?.Audio ?? null;

function BreezeItem({ item, isOwn, index, onAdd, onView, onProfile }) {
  const profile = item?.profiles || item;
  const isActive = isOwn || item?.isActive;

  const handlePress = () => {
    if (isOwn) {
      onAdd();
      return;
    }

    if (isActive) {
      onView(item);
      return;
    }

    onProfile(item.user_id);
  };

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ delay: index * 70, type: 'timing' }}
      style={styles.storyContainer}
    >
      <TouchableOpacity onPress={handlePress} activeOpacity={0.9}>
        <View style={[styles.storyFrame, isOwn && styles.storyFrameOwn, !isActive && styles.storyFrameInactive]}>
          <View style={[styles.storyInner, isOwn && styles.storyInnerOwn, !isActive && styles.storyInnerInactive]}>
            {isOwn && !profile?.avatar_url ? (
              <Plus color={colors.black} size={24} strokeWidth={3} />
            ) : profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.storyImg} />
            ) : (
              <Text style={styles.storyInitial}>{profile?.username?.[0]?.toUpperCase() ?? '+'}</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
      <Text style={styles.storyUser} numberOfLines={1}>
        {isOwn ? 'CAST' : profile?.username}
      </Text>
      {!isOwn && !isActive ? <Text style={styles.storyStatus}>OFFLINE</Text> : null}
    </MotiView>
  );
}

function AnchorCard({ post, index }) {
  const [liked, setLiked] = useState(false);
  const [resolvedUri, setResolvedUri] = useState(post.media_url);
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const { cloudNode } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (post.cloud_file_id) {
      downloadFromHarbour(post.cloud_file_id, post.user_id).then((res) => {
        if (res.localUri) setResolvedUri(res.localUri);
      });
    }
  }, [post.cloud_file_id, post.user_id, cloudNode]);

  const togglePlayback = async () => {
    if (!post.song_preview_url || !Audio) return;

    if (sound) {
      if (isPlaying) {
        await sound.pauseAsync();
        setIsPlaying(false);
      } else {
        await sound.playAsync();
        setIsPlaying(true);
      }
      return;
    }

    const { sound: newSound } = await Audio.Sound.createAsync(
      { uri: post.song_preview_url },
      { shouldPlay: true }
    );
    setSound(newSound);
    setIsPlaying(true);
  };

  return (
    <MotiView
      from={{ opacity: 0, translateY: 30 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ delay: index * 100, type: 'timing' }}
      style={[styles.postCard, Platform.OS === 'web' && styles.postCardWeb]}
    >
      <View style={styles.postHeader}>
        <TouchableOpacity style={styles.userInfo} onPress={() => router.push(`/user/${post.user_id}`)}>
          <View style={styles.avatarFrame}>
            <Image
              source={
                post.profiles?.avatar_url
                  ? { uri: post.profiles.avatar_url }
                  : require('../../../assets/images/defaultavatar.png')
              }
              style={styles.postAvatar}
            />
          </View>
          <View>
            <Text style={styles.postUsername}>{post.profiles?.username}</Text>
            <View style={styles.secureRow}>
              <ShieldCheck size={10} color={colors.black} />
              <Text style={styles.secureText}>ANCHORED IN HARBOUR</Text>
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.moreBtn} activeOpacity={0.9}>
          <MoreHorizontal color={colors.black} size={20} />
        </TouchableOpacity>
      </View>

      <View style={styles.mediaFrame}>
        <Image source={{ uri: resolvedUri }} style={styles.postMedia} />
      </View>

      <View style={styles.actionRow}>
        <View style={styles.leftActions}>
          <TouchableOpacity onPress={() => setLiked(!liked)} style={styles.actionIcon} activeOpacity={0.85}>
            <Heart size={24} color={colors.black} fill={liked ? colors.accentWarm : 'transparent'} strokeWidth={3} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIcon} activeOpacity={0.85}>
            <MessageCircle size={24} color={colors.black} strokeWidth={3} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionIcon} activeOpacity={0.85}>
            <Send size={24} color={colors.black} strokeWidth={3} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.captionArea}>
        <Text style={styles.captionText}>
          <Text style={styles.captionBold}>{post.profiles?.username}</Text> {post.caption}
        </Text>
        <View style={styles.bottomMeta}>
          <Text style={styles.timeLabel}>HARBOUR CIPHER</Text>
          {post.song_title ? (
            <TouchableOpacity onPress={togglePlayback} style={styles.musicPill} activeOpacity={0.9}>
              <Music size={12} color={colors.black} />
              <Text style={styles.musicText}>
                {post.song_title} {isPlaying ? ' - PLAYING' : ' - VIBE'}
              </Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </MotiView>
  );
}

export default function FeedScreen() {
  const { profile, user } = useAuthStore();
  const router = useRouter();
  const [posts, setPosts] = useState([]);
  const [breezeItems, setBreezeItems] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [musicModalVisible, setMusicModalVisible] = useState(false);
  const [pendingMedia, setPendingMedia] = useState(null);
  const [uploadTarget, setUploadTarget] = useState(null);
  const [viewerStory, setViewerStory] = useState(null);
  const [viewerVisible, setViewerVisible] = useState(false);
  const [fabOpen, setFabOpen] = useState(false);
  const [hasNewSignals, setHasNewSignals] = useState(false);

  const fetchSignalsStatus = useCallback(async () => {
    if (!user?.id) return;

    const { count } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false);

    setHasNewSignals((count || 0) > 0);
  }, [user?.id]);

  const fetchAnchors = useCallback(async () => {
    const { data } = await supabase
      .from('posts')
      .select('*, profiles(username, avatar_url)')
      .order('created_at', { ascending: false });

    setPosts(data || []);
    setRefreshing(false);
  }, []);

  const fetchBreezes = useCallback(async () => {
    if (!user?.id) return;

    const now = new Date().toISOString();
    const [{ data: storyData }, { data: followRows }] = await Promise.all([
      supabase
        .from('stories')
        .select('*, profiles(username, avatar_url)')
        .gt('expires_at', now)
        .order('created_at', { ascending: false }),
      supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', user.id)
        .eq('status', 'accepted'),
    ]);

    const followedIds = [...new Set((followRows || []).map((row) => row.following_id).filter(Boolean))];
    let followedProfiles = [];

    if (followedIds.length > 0) {
      const { data } = await supabase
        .from('profiles')
        .select('id, username, avatar_url')
        .in('id', followedIds);
      followedProfiles = data || [];
    }

    const activeStories = (storyData || [])
      .filter((story) => story.user_id !== user.id)
      .map((story) => ({
        ...story,
        isActive: true,
      }));

    const activeUserIds = new Set(activeStories.map((story) => story.user_id));
    const inactiveProfiles = followedProfiles
      .filter((followedProfile) => !activeUserIds.has(followedProfile.id))
      .map((followedProfile) => ({
        id: `profile-${followedProfile.id}`,
        user_id: followedProfile.id,
        profiles: followedProfile,
        isActive: false,
      }));

    setBreezeItems([
      { id: `self-${user.id}`, isOwn: true, profiles: profile, user_id: user.id, isActive: true },
      ...activeStories,
      ...inactiveProfiles,
    ]);
  }, [profile, user?.id]);

  const fetchFeed = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchAnchors(), fetchBreezes(), fetchSignalsStatus()]);
    setRefreshing(false);
  }, [fetchAnchors, fetchBreezes, fetchSignalsStatus]);

  useEffect(() => {
    fetchAnchors();
    fetchBreezes();
    fetchSignalsStatus();

    if (!user?.id) return undefined;

    const channel = supabase
      .channel('radar_signals')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchSignalsStatus()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchAnchors, fetchBreezes, fetchSignalsStatus, user?.id]);

  const handleMediaPick = async (target) => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });

    if (result.canceled) return;

    setPendingMedia(result.assets[0].uri);
    setUploadTarget(target);
    setMusicModalVisible(true);
    setFabOpen(false);
  };

  const handleFinishUpload = async (song) => {
    try {
      setIsUploading(true);
      const fileName = `${uploadTarget}_${Date.now()}.jpg`;
      const { fileId, publicUrl, error, viaFallback } = await uploadToHarbour(pendingMedia, fileName, user.id);
      if (error) throw error;

      if (uploadTarget === 'breeze') {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);
        await supabase.from('stories').insert({
          user_id: user.id,
          media_url: publicUrl || `cloud://${fileId}`,
          cloud_file_id: publicUrl ? null : fileId,
          expires_at: expiresAt.toISOString(),
          song_title: song?.title,
          song_artist: song?.artist,
          song_preview_url: song?.previewUrl,
          song_artwork_url: song?.artworkUrl,
        });
        fetchBreezes();
      } else {
        await supabase.from('posts').insert({
          user_id: user.id,
          media_url: publicUrl || `cloud://${fileId}`,
          cloud_file_id: publicUrl ? null : fileId,
          caption: 'New Harbour Anchor',
          song_title: song?.title,
          song_artist: song?.artist,
          song_preview_url: song?.previewUrl,
          song_artwork_url: song?.artworkUrl,
        });
        fetchAnchors();
      }

      if (viaFallback) {
        Alert.alert('Uploaded', 'Harbour service is offline, so this file was uploaded via backup storage.');
      }
    } catch (e) {
      const message = e?.message?.includes('non-2xx')
        ? 'Harbour upload service is unavailable right now. Please deploy or enable the edge function and try again.'
        : e?.message || 'Unknown upload error';
      Alert.alert('Upload Failed', message);
    } finally {
      setIsUploading(false);
      setPendingMedia(null);
      setMusicModalVisible(false);
    }
  };

  const handleAddBreeze = () => handleMediaPick('breeze');
  const handleAddAnchor = () => handleMediaPick('anchor');

  const openStory = (story) => {
    setViewerStory(story);
    setViewerVisible(true);
  };

  const renderFeed = () => (
    <View style={styles.feedWrap}>
      {isUploading ? (
        <View style={styles.uploadOverlay}>
          <ActivityIndicator color={colors.black} size="large" />
          <Text style={styles.uploadText}>ANCHORING TO HARBOUR...</Text>
        </View>
      ) : null}

      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => <AnchorCard post={item} index={index} />}
        ListHeaderComponent={() => (
          <View style={styles.heroSection}>
            <View style={styles.heroRow}>
              <View style={styles.heroCopy}>
                <Text style={styles.heroEyebrow}>HOME STREAM</Text>
                <Text style={styles.heroTitle}>ACTIVE BREEZES</Text>
                <Text style={styles.heroSubtext}>
                  Active breezes stay first, but your people still show up here even when they are offline.
                </Text>
              </View>

              <NeoButton onPress={() => router.push('/radar')} style={styles.radarCard}>
                <Image
                  source={require('../../../assets/images/radar-logo.png')}
                  style={styles.radarLogo}
                  resizeMode="contain"
                />
                <Text style={styles.radarLabel}>RADAR</Text>
                {hasNewSignals ? <View style={styles.radarDot} /> : null}
              </NeoButton>
            </View>

            <View style={[styles.storiesWrapper, Platform.OS === 'web' && styles.storiesWrapperWeb]}>
              <View style={styles.breezeHeader}>
                <Wind color={colors.black} size={18} strokeWidth={3} />
                <Text style={styles.breezeTitle}>ACTIVE BREEZES</Text>
              </View>
              <FlatList
                horizontal
                showsHorizontalScrollIndicator={false}
                data={breezeItems}
                renderItem={({ item, index }) => (
                  <BreezeItem
                    item={item}
                    isOwn={item.isOwn}
                    index={index}
                    onAdd={handleAddBreeze}
                    onView={openStory}
                    onProfile={(userId) => router.push(`/user/${userId}`)}
                  />
                )}
              />
            </View>
          </View>
        )}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchFeed()} tintColor={colors.accent} />}
        contentContainerStyle={styles.feedListContent}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <GridBackground fill="#F7E3BE" stroke="rgba(0,0,0,0.09)" />

      {renderFeed()}

      <View style={styles.fabContainer}>
        {fabOpen ? (
          <MotiView from={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} style={styles.fabMenu}>
            <NeoButton activeTranslateX={2} activeTranslateY={2} style={styles.fabMenuItem} onPress={handleAddAnchor}>
              <Text style={styles.fabMenuText}>DROP ANCHOR</Text>
              <AnchorIcon color={colors.black} size={20} />
            </NeoButton>
            <NeoButton
              activeTranslateX={2}
              activeTranslateY={2}
              style={[styles.fabMenuItem, styles.fabMenuItemAlt]}
              onPress={handleAddBreeze}
            >
              <Text style={styles.fabMenuText}>CAST BREEZE</Text>
              <Wind color={colors.black} size={20} />
            </NeoButton>
          </MotiView>
        ) : null}

        <NeoButton style={styles.fabMain} onPress={() => setFabOpen(!fabOpen)}>
          <Plus color={colors.black} size={28} strokeWidth={3} />
        </NeoButton>
      </View>

      <MusicPickerModal visible={musicModalVisible} onClose={() => setMusicModalVisible(false)} onSelect={handleFinishUpload} />

      <BreezeViewer visible={viewerVisible} story={viewerStory} onClose={() => setViewerVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7E3BE',
  },
  heroSection: {
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  heroCopy: {
    flex: 1,
    backgroundColor: '#FFF8EB',
    borderWidth: borders.thick,
    borderColor: borders.color,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginRight: spacing.md,
    ...shadows.brutal,
  },
  heroEyebrow: {
    fontFamily: typography.family.black,
    color: colors.accentWarm,
    fontSize: 11,
    letterSpacing: 1,
    marginBottom: 6,
  },
  heroTitle: {
    fontFamily: typography.family.black,
    color: colors.black,
    fontSize: 24,
  },
  heroSubtext: {
    marginTop: 6,
    fontFamily: typography.family.medium,
    color: '#5C4634',
    fontSize: 13,
    lineHeight: 18,
  },
  storiesWrapper: {
    paddingVertical: spacing.md,
    backgroundColor: '#FFF8EB',
    borderWidth: borders.thick,
    borderColor: borders.color,
    ...shadows.brutal,
  },
  storiesWrapperWeb: {
    marginBottom: spacing.sm,
  },
  breezeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.lg,
    marginBottom: 12,
  },
  breezeTitle: {
    fontFamily: typography.family.black,
    color: colors.black,
    fontSize: 13,
    marginLeft: 8,
    letterSpacing: 0.8,
  },
  radarCard: {
    width: 98,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderWidth: borders.thick,
    borderColor: borders.color,
    paddingVertical: 12,
    position: 'relative',
    ...shadows.brutal,
  },
  radarLogo: {
    width: 32,
    height: 32,
  },
  radarLabel: {
    marginTop: 8,
    fontFamily: typography.family.black,
    color: colors.black,
    fontSize: 12,
    letterSpacing: 1,
  },
  radarDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.accentWarm,
    borderWidth: 2,
    borderColor: colors.black,
  },
  storyContainer: {
    alignItems: 'center',
    marginHorizontal: spacing.sm,
    paddingLeft: spacing.sm,
  },
  storyFrame: {
    width: 74,
    height: 74,
    borderWidth: borders.thick,
    borderColor: borders.color,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
    ...shadows.brutalSmall,
  },
  storyFrameOwn: {
    backgroundColor: colors.accentSecondary,
  },
  storyFrameInactive: {
    backgroundColor: '#F5DDB5',
  },
  storyInner: {
    width: 60,
    height: 60,
    backgroundColor: '#FFECD0',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  storyInnerOwn: {
    backgroundColor: '#FFF7D1',
  },
  storyInnerInactive: {
    backgroundColor: '#EAD7B8',
    opacity: 0.72,
  },
  storyImg: {
    width: '100%',
    height: '100%',
  },
  storyInitial: {
    color: colors.black,
    fontFamily: typography.family.black,
    fontSize: 24,
  },
  storyUser: {
    fontFamily: typography.family.black,
    color: colors.black,
    fontSize: 9,
    marginTop: 8,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  storyStatus: {
    marginTop: 2,
    fontFamily: typography.family.black,
    color: '#8F3800',
    fontSize: 8,
    letterSpacing: 0.8,
  },
  uploadOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.accentSecondary,
  },
  uploadText: {
    fontFamily: typography.family.black,
    color: colors.black,
    marginTop: 16,
  },
  postCard: {
    marginBottom: spacing.xl,
    backgroundColor: '#FFF8EB',
    borderWidth: borders.thick,
    borderColor: borders.color,
    marginHorizontal: spacing.md,
    ...shadows.brutal,
  },
  postCardWeb: {
    width: '100%',
    maxWidth: 760,
    alignSelf: 'center',
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: borders.medium,
    borderColor: borders.color,
    backgroundColor: '#FFE2B8',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarFrame: {
    width: 44,
    height: 44,
    borderWidth: borders.medium,
    borderColor: borders.color,
    marginRight: spacing.sm,
    overflow: 'hidden',
    backgroundColor: colors.white,
  },
  postAvatar: {
    width: '100%',
    height: '100%',
  },
  postUsername: {
    fontFamily: typography.family.black,
    color: colors.black,
    fontSize: 15,
    textTransform: 'uppercase',
  },
  secureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  secureText: {
    fontFamily: typography.family.bold,
    color: '#6E4D35',
    fontSize: 8,
    marginLeft: 3,
  },
  moreBtn: {
    width: 38,
    height: 38,
    borderWidth: 2,
    borderColor: borders.color,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
    ...shadows.brutalSmall,
  },
  mediaFrame: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#F6D5A7',
    borderBottomWidth: borders.medium,
    borderColor: borders.color,
  },
  postMedia: {
    width: '100%',
    height: '100%',
  },
  actionRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  leftActions: {
    flexDirection: 'row',
  },
  actionIcon: {
    width: 42,
    height: 42,
    marginRight: spacing.md,
    borderWidth: 2,
    borderColor: colors.black,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.brutalSmall,
  },
  captionArea: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    paddingTop: spacing.sm,
  },
  captionText: {
    fontFamily: typography.family.regular,
    color: colors.black,
    fontSize: 14,
    lineHeight: 19,
  },
  captionBold: {
    fontFamily: typography.family.black,
  },
  bottomMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  timeLabel: {
    fontFamily: typography.family.black,
    color: colors.accentWarm,
    fontSize: 10,
  },
  musicPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD089',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 2,
    borderColor: colors.black,
    ...shadows.brutalSmall,
  },
  musicText: {
    color: colors.black,
    fontSize: 9,
    fontFamily: typography.family.black,
    marginLeft: 5,
  },
  feedWrap: {
    flex: 1,
    width: '100%',
    maxWidth: 980,
    alignSelf: 'center',
  },
  feedListContent: {
    paddingBottom: 140,
  },
  fabContainer: {
    position: 'absolute',
    bottom: 34,
    right: 20,
    alignItems: 'flex-end',
    zIndex: 100,
  },
  fabMain: {
    width: 60,
    height: 60,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.black,
    borderRadius: 10,
    ...shadows.brutal,
  },
  fabMenu: {
    marginBottom: 18,
  },
  fabMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: colors.black,
    minWidth: 170,
    ...shadows.brutalSmall,
  },
  fabMenuItemAlt: {
    backgroundColor: '#FFF3D7',
  },
  fabMenuText: {
    fontFamily: typography.family.black,
    color: colors.black,
    fontSize: 12,
    marginRight: 10,
  },
});
