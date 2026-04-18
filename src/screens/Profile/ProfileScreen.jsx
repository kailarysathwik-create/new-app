import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
  Alert,
  Modal,
  PanResponder,
} from 'react-native';
import { MotiView } from 'moti';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Settings, Anchor, Camera, ChevronRight } from 'lucide-react-native';
import { colors, spacing, typography, shadows, borders } from '../../theme/tokens';
import { useAuthStore } from '../../store/authStore';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import GridBackground from '../../components/ui/GridBackground';
import NeoButton from '../../components/ui/NeoButton';

const CROP_SIZE = 260;

function StatItem({ label, count }) {
  return (
    <View style={styles.statContainer}>
      <Text style={styles.statCount}>{count}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { profile, user, updateProfile } = useAuthStore();
  const router = useRouter();
  const [stats, setStats] = React.useState({ anchors: 0, followers: 0, following: 0 });
  const [loadingStats, setLoadingStats] = React.useState(true);
  const [updatingAvatar, setUpdatingAvatar] = React.useState(false);
  const [cropVisible, setCropVisible] = React.useState(false);
  const [cropAsset, setCropAsset] = React.useState(null);
  const [cropScale, setCropScale] = React.useState(1);
  const [cropOffset, setCropOffset] = React.useState({ x: 0, y: 0 });

  const clampOffset = React.useCallback((asset, scale, offset) => {
    if (!asset?.width || !asset?.height) return { x: 0, y: 0 };
    const baseScale = Math.max(CROP_SIZE / asset.width, CROP_SIZE / asset.height);
    const renderedW = asset.width * baseScale * scale;
    const renderedH = asset.height * baseScale * scale;
    const maxX = Math.max(0, (renderedW - CROP_SIZE) / 2);
    const maxY = Math.max(0, (renderedH - CROP_SIZE) / 2);
    return {
      x: Math.min(maxX, Math.max(-maxX, offset.x)),
      y: Math.min(maxY, Math.max(-maxY, offset.y)),
    };
  }, []);

  const uploadAvatarUri = async (localUri) => {
    setUpdatingAvatar(true);
    try {
      let avatarUrl = localUri;

      try {
        const response = await fetch(localUri);
        const blob = await response.blob();
        const path = `avatars/${user.id}-${Date.now()}.jpg`;
        const uploadRes = await supabase.storage
          .from('avatars')
          .upload(path, blob, { contentType: 'image/jpeg', upsert: true });

        if (!uploadRes.error) {
          const { data } = supabase.storage.from('avatars').getPublicUrl(path);
          if (data?.publicUrl) avatarUrl = data.publicUrl;
        }
      } catch (_storageError) {
        // Keep local URI fallback if storage bucket is unavailable.
      }

      const { error } = await updateProfile({ avatar_url: avatarUrl });
      if (error) throw error;
    } catch (error) {
      Alert.alert('Profile update failed', error?.message || 'Could not update profile picture.');
    } finally {
      setUpdatingAvatar(false);
    }
  };

  const handleConfirmCrop = async () => {
    if (!cropAsset?.uri || !cropAsset?.width || !cropAsset?.height) return;

    try {
      const baseScale = Math.max(CROP_SIZE / cropAsset.width, CROP_SIZE / cropAsset.height);
      const totalScale = baseScale * cropScale;
      const renderedW = cropAsset.width * totalScale;
      const renderedH = cropAsset.height * totalScale;

      const originX = Math.max(0, ((renderedW - CROP_SIZE) / 2 - cropOffset.x) / totalScale);
      const originY = Math.max(0, ((renderedH - CROP_SIZE) / 2 - cropOffset.y) / totalScale);
      const cropWidth = Math.min(cropAsset.width - originX, CROP_SIZE / totalScale);
      const cropHeight = Math.min(cropAsset.height - originY, CROP_SIZE / totalScale);

      const result = await ImageManipulator.manipulateAsync(
        cropAsset.uri,
        [
          {
            crop: {
              originX,
              originY,
              width: Math.max(1, cropWidth),
              height: Math.max(1, cropHeight),
            },
          },
          { resize: { width: 512, height: 512 } },
        ],
        { compress: 0.9, format: ImageManipulator.SaveFormat.JPEG }
      );

      setCropVisible(false);
      await uploadAvatarUri(result.uri);
    } catch (error) {
      Alert.alert('Crop failed', error?.message || 'Could not crop image.');
    }
  };

  const handleChangeAvatar = async () => {
    if (!user?.id || updatingAvatar) return;

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Allow photo access to change profile picture.');
      return;
    }

    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.85,
    });

    if (picked.canceled || !picked.assets?.[0]?.uri) return;

    const asset = picked.assets[0];
    setCropAsset(asset);
    setCropScale(1);
    setCropOffset({ x: 0, y: 0 });
    setCropVisible(true);
  };

  const panResponder = React.useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderMove: (_evt, gestureState) => {
          if (!cropAsset) return;
          const next = clampOffset(cropAsset, cropScale, {
            x: cropOffset.x + gestureState.dx,
            y: cropOffset.y + gestureState.dy,
          });
          setCropOffset(next);
        },
      }),
    [cropAsset, cropOffset, cropScale, clampOffset]
  );

  const adjustZoom = (delta) => {
    if (!cropAsset) return;
    const nextScale = Math.min(3, Math.max(1, cropScale + delta));
    setCropScale(nextScale);
    setCropOffset((prev) => clampOffset(cropAsset, nextScale, prev));
  };

  React.useEffect(() => {
    if (!profile) return;

    const fetchStats = async () => {
      setLoadingStats(true);
      const [postsRes, followersRes, followingRes] = await Promise.all([
        supabase.from('posts').select('*', { count: 'exact', head: true }).eq('user_id', profile.id),
        supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', profile.id)
          .eq('status', 'accepted'),
        supabase
          .from('follows')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', profile.id)
          .eq('status', 'accepted'),
      ]);

      setStats({
        anchors: postsRes.count || 0,
        followers: followersRes.count || 0,
        following: followingRes.count || 0,
      });
      setLoadingStats(false);
    };

    fetchStats();
  }, [profile]);

  if (!profile) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GridBackground fill="#F7E3BE" stroke="rgba(0,0,0,0.09)" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerEyebrow}>PROFILE</Text>
            <Text style={styles.username}>@{profile.username}</Text>
          </View>
          <NeoButton onPress={() => router.push('/settings')} style={styles.settingsBtn}>
            <Settings color={colors.black} size={22} />
          </NeoButton>
        </View>

        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 260 }}
          style={styles.profileSection}
        >
          <TouchableOpacity onPress={handleChangeAvatar} activeOpacity={0.9} style={styles.avatarTouch}>
            <View style={styles.avatarBorder}>
              <Image
                source={
                  profile.avatar_url
                    ? { uri: profile.avatar_url }
                    : require('../../../assets/images/default-avatar.png')
                }
                style={styles.avatar}
              />
              {updatingAvatar ? (
                <View style={styles.avatarLoading}>
                  <ActivityIndicator color={colors.black} size="small" />
                </View>
              ) : null}
            </View>
          </TouchableOpacity>

          <View style={styles.statsRow}>
            <StatItem count={loadingStats ? '...' : stats.anchors} label="Anchors" />
            <StatItem count={loadingStats ? '...' : stats.followers} label="Followers" />
            <StatItem count={loadingStats ? '...' : stats.following} label="Following" />
          </View>
        </MotiView>

        <View style={styles.bioSection}>
          <Text style={styles.displayName}>{profile.username}</Text>
          <Text style={styles.bioText}>
            {profile.bio || 'Digital architect of the private web. Building the future of Saily.'}
          </Text>
        </View>

        <View style={styles.btnRow}>
          <NeoButton style={styles.mainBtn} onPress={handleChangeAvatar}>
            <Camera color={colors.black} size={18} strokeWidth={2.5} />
            <Text style={styles.mainBtnText}>{updatingAvatar ? 'Updating...' : 'Change Photo'}</Text>
          </NeoButton>
          <NeoButton style={styles.iconBtn} onPress={() => router.push('/settings')}>
            <Settings color={colors.black} size={20} />
          </NeoButton>
        </View>

        <View style={styles.anchorSection}>
          <View style={styles.anchorHeader}>
            <Text style={styles.anchorEyebrow}>PROFILE SECTION</Text>
            <Anchor color={colors.black} size={20} strokeWidth={2.4} />
          </View>
          <Text style={styles.anchorTitle}>MY ANCHORS</Text>
          <Text style={styles.anchorText}>
            {loadingStats ? 'Loading your harbour...' : `You have ${stats.anchors} anchors currently tied to your profile.`}
          </Text>
          <NeoButton style={styles.anchorCta} onPress={() => router.push('/(tabs)')}>
            <Text style={styles.anchorCtaText}>Open Home Stream</Text>
            <ChevronRight color={colors.black} size={18} />
          </NeoButton>
        </View>
      </ScrollView>

      <Modal visible={cropVisible} animationType="slide" transparent onRequestClose={() => setCropVisible(false)}>
        <View style={styles.cropOverlay}>
          <View style={styles.cropCard}>
            <Text style={styles.cropTitle}>Adjust Profile Photo</Text>
            <Text style={styles.cropHint}>Drag to position and zoom in or out.</Text>

            <View style={styles.cropFrame} {...panResponder.panHandlers}>
              {cropAsset?.uri ? (
                <Image
                  source={{ uri: cropAsset.uri }}
                  style={[
                    styles.cropImage,
                    {
                      width:
                        cropAsset.width *
                        Math.max(CROP_SIZE / cropAsset.width, CROP_SIZE / cropAsset.height) *
                        cropScale,
                      height:
                        cropAsset.height *
                        Math.max(CROP_SIZE / cropAsset.width, CROP_SIZE / cropAsset.height) *
                        cropScale,
                      transform: [{ translateX: cropOffset.x }, { translateY: cropOffset.y }],
                    },
                  ]}
                />
              ) : null}
              <View style={styles.cropMask} pointerEvents="none" />
            </View>

            <View style={styles.zoomRow}>
              <NeoButton style={styles.zoomBtn} onPress={() => adjustZoom(-0.1)}>
                <Text style={styles.zoomBtnText}>-</Text>
              </NeoButton>
              <Text style={styles.zoomValue}>{cropScale.toFixed(1)}x</Text>
              <NeoButton style={styles.zoomBtn} onPress={() => adjustZoom(0.1)}>
                <Text style={styles.zoomBtnText}>+</Text>
              </NeoButton>
            </View>

            <View style={styles.cropActions}>
              <NeoButton style={[styles.cropActionBtn, styles.cancelBtn]} onPress={() => setCropVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </NeoButton>
              <NeoButton style={[styles.cropActionBtn, styles.saveBtn]} onPress={handleConfirmCrop}>
                <Text style={styles.saveBtnText}>Use Photo</Text>
              </NeoButton>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7E3BE',
  },
  scrollContent: {
    paddingBottom: 140,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 980 : '100%',
    alignSelf: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  headerEyebrow: {
    fontFamily: typography.family.black,
    color: colors.accentWarm,
    fontSize: 11,
    letterSpacing: 1.5,
    marginBottom: 6,
  },
  username: {
    fontFamily: typography.family.black,
    color: colors.black,
    fontSize: 28,
    letterSpacing: 0.5,
  },
  settingsBtn: {
    width: 52,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: borders.thick,
    borderColor: borders.color,
    ...shadows.brutal,
  },
  profileSection: {
    backgroundColor: '#FFF8EB',
    borderWidth: borders.thick,
    borderColor: borders.color,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadows.brutal,
  },
  avatarBorder: {
    width: 104,
    height: 104,
    backgroundColor: colors.accent,
    borderWidth: borders.thick,
    borderColor: borders.color,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.brutalSmall,
  },
  avatarTouch: {
    marginRight: spacing.lg,
  },
  avatar: {
    width: 90,
    height: 90,
    borderWidth: 3,
    borderColor: colors.black,
  },
  avatarLoading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.72)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  statContainer: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: '#FFE1A8',
    borderWidth: 2,
    borderColor: colors.black,
    paddingVertical: 14,
    ...shadows.brutalSmall,
  },
  statCount: {
    fontFamily: typography.family.black,
    color: colors.black,
    fontSize: 20,
  },
  statLabel: {
    fontFamily: typography.family.medium,
    color: '#6B4D37',
    fontSize: 11,
    marginTop: 4,
  },
  bioSection: {
    marginTop: spacing.lg,
    backgroundColor: colors.white,
    borderWidth: borders.thick,
    borderColor: borders.color,
    padding: spacing.lg,
    ...shadows.brutal,
  },
  displayName: {
    fontFamily: typography.family.black,
    color: colors.black,
    fontSize: 18,
  },
  bioText: {
    fontFamily: typography.family.medium,
    color: '#5B4637',
    fontSize: 14,
    marginTop: 8,
    lineHeight: 21,
  },
  btnRow: {
    flexDirection: 'row',
    marginTop: spacing.lg,
  },
  mainBtn: {
    flex: 1,
    backgroundColor: colors.accentSecondary,
    paddingVertical: 14,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    borderWidth: borders.thick,
    borderColor: colors.black,
    marginRight: spacing.md,
    ...shadows.brutal,
  },
  mainBtnText: {
    fontFamily: typography.family.black,
    color: colors.black,
    fontSize: 14,
    marginLeft: 8,
  },
  iconBtn: {
    width: 58,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: borders.thick,
    borderColor: colors.black,
    ...shadows.brutal,
  },
  anchorSection: {
    marginTop: spacing.lg,
    backgroundColor: '#FFCF7B',
    borderWidth: borders.thick,
    borderColor: borders.color,
    padding: spacing.lg,
    ...shadows.brutal,
  },
  anchorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  anchorEyebrow: {
    fontFamily: typography.family.black,
    color: '#8F3800',
    fontSize: 11,
    letterSpacing: 1.4,
  },
  anchorTitle: {
    fontFamily: typography.family.black,
    color: colors.black,
    fontSize: 26,
  },
  anchorText: {
    marginTop: 8,
    fontFamily: typography.family.medium,
    color: '#523E2C',
    fontSize: 14,
    lineHeight: 20,
  },
  anchorCta: {
    marginTop: spacing.md,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: borders.medium,
    borderColor: colors.black,
    paddingHorizontal: 14,
    paddingVertical: 10,
    ...shadows.brutalSmall,
  },
  anchorCtaText: {
    fontFamily: typography.family.black,
    color: colors.black,
    fontSize: 12,
    marginRight: 8,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cropOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  cropCard: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFF8EB',
    borderWidth: borders.thick,
    borderColor: colors.black,
    padding: spacing.lg,
    ...shadows.brutal,
  },
  cropTitle: {
    fontFamily: typography.family.black,
    color: colors.black,
    fontSize: 22,
    textAlign: 'center',
  },
  cropHint: {
    marginTop: 8,
    marginBottom: 14,
    textAlign: 'center',
    color: '#5B4637',
    fontFamily: typography.family.medium,
    fontSize: 13,
  },
  cropFrame: {
    width: CROP_SIZE,
    height: CROP_SIZE,
    alignSelf: 'center',
    borderRadius: CROP_SIZE / 2,
    overflow: 'hidden',
    backgroundColor: '#F4D7AA',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.black,
  },
  cropImage: {
    position: 'absolute',
  },
  cropMask: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.45)',
    borderRadius: CROP_SIZE / 2,
  },
  zoomRow: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomBtn: {
    width: 42,
    height: 42,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: borders.medium,
    borderColor: colors.black,
    backgroundColor: colors.white,
    ...shadows.brutalSmall,
  },
  zoomBtnText: {
    color: colors.black,
    fontSize: 22,
    fontFamily: typography.family.black,
    marginTop: -1,
  },
  zoomValue: {
    marginHorizontal: 16,
    color: colors.black,
    fontFamily: typography.family.bold,
    fontSize: 14,
  },
  cropActions: {
    flexDirection: 'row',
    marginTop: 18,
  },
  cropActionBtn: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: borders.medium,
    borderColor: colors.black,
    ...shadows.brutalSmall,
  },
  cancelBtn: {
    marginRight: 8,
    backgroundColor: colors.white,
  },
  cancelBtnText: {
    color: colors.black,
    fontFamily: typography.family.bold,
  },
  saveBtn: {
    marginLeft: 8,
    backgroundColor: colors.accent,
  },
  saveBtnText: {
    color: colors.black,
    fontFamily: typography.family.black,
  },
});
