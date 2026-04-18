import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  Modal,
  TouchableOpacity,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { X, Music, Volume2, VolumeX } from 'lucide-react-native';
import { MotiView } from 'moti';
import { colors, spacing, radius, typography } from '../../theme/tokens';
import { downloadFromHarbour } from '../../lib/cloudNode';

let AudioModule = null;
try {
  AudioModule = require('expo-av');
} catch (_error) {
  AudioModule = null;
}
const Audio = AudioModule?.Audio ?? null;

export default function BreezeViewer({ visible, story, onClose }) {
  const [sound, setSound] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [resolvedUri, setResolvedUri] = useState(null);
  const [mediaLoading, setMediaLoading] = useState(false);

  useEffect(() => {
    let interval;

    if (visible) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress((p) => {
          if (p >= 1) {
            clearInterval(interval);
            onClose();
            return 1;
          }
          return p + 0.01;
        });
      }, 50);
    }

    return () => {
      clearInterval(interval);
      sound?.unloadAsync();
    };
  }, [visible, story, sound, onClose]);

  useEffect(() => {
    let active = true;

    const resolveStoryMedia = async () => {
      if (!visible || !story) {
        if (active) {
          setResolvedUri(null);
          setMediaLoading(false);
        }
        return;
      }

      if (!story.cloud_file_id) {
        setResolvedUri(story.media_url || null);
        setMediaLoading(false);
        return;
      }

      setMediaLoading(true);
      const { localUri } = await downloadFromHarbour(story.cloud_file_id, story.user_id);

      if (!active) return;

      setResolvedUri(localUri || story.media_url || null);
      setMediaLoading(false);
    };

    resolveStoryMedia();

    return () => {
      active = false;
    };
  }, [visible, story]);

  useEffect(() => {
    const startAudio = async () => {
      if (!visible || !Audio || !story?.song_preview_url) return;

      try {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: story.song_preview_url },
          { shouldPlay: true, isLooping: true }
        );
        setSound(newSound);
      } catch (e) {
        console.warn('[BreezeViewer] Audio not available:', e.message);
      }
    };

    startAudio();
  }, [visible, story?.song_preview_url]);

  const toggleMute = async () => {
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    await sound?.setIsMutedAsync(newMuted);
  };

  if (!story) return null;

  return (
    <Modal visible={visible} animationType="fade" transparent statusBarTranslucent>
      <View style={styles.container}>
        {resolvedUri ? (
          <Image source={{ uri: resolvedUri }} style={styles.fullImage} resizeMode="cover" />
        ) : (
          <View style={styles.placeholder}>
            <ActivityIndicator color={colors.white} size="large" />
            <Text style={styles.placeholderText}>
              {mediaLoading ? 'Decrypting breeze...' : 'No breeze media available'}
            </Text>
          </View>
        )}

        <View style={styles.overlay}>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
          </View>

          <View style={styles.header}>
            <View style={styles.userInfo}>
              <Image
                source={
                  story.profiles?.avatar_url
                    ? { uri: story.profiles.avatar_url }
                    : require('../../../assets/images/defaultavatar.png')
                }
                style={styles.avatar}
              />
              <Text style={styles.username}>{story.profiles?.username}</Text>
              <Text style={styles.timeLabel}>BREEZE</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X color={colors.white} size={28} />
            </TouchableOpacity>
          </View>

          {story.song_title ? (
            <MotiView
              from={{ translateY: 50, opacity: 0 }}
              animate={{ translateY: 0, opacity: 1 }}
              style={styles.musicSticker}
            >
              <BlurView intensity={40} tint="dark" style={styles.stickerInner}>
                <Music color={colors.accent} size={16} strokeWidth={3} />
                <View style={styles.musicInfo}>
                  <Text style={styles.songTitle} numberOfLines={1}>
                    {story.song_title}
                  </Text>
                  <Text style={styles.songArtist} numberOfLines={1}>
                    {story.song_artist}
                  </Text>
                </View>
                <TouchableOpacity onPress={toggleMute} style={styles.muteBtn}>
                  {isMuted ? <VolumeX color={colors.white} size={18} /> : <Volume2 color={colors.white} size={18} />}
                </TouchableOpacity>
              </BlurView>
            </MotiView>
          ) : null}

          <View style={styles.footer}>
            <Text style={styles.secureText}>SAILY END-TO-END ENCRYPTED BREEZE</Text>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.black,
  },
  fullImage: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A120A',
  },
  placeholderText: {
    marginTop: spacing.md,
    color: colors.white,
    fontFamily: typography.family.bold,
    fontSize: 14,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'ios' ? 50 : 30,
  },
  progressContainer: {
    height: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
    width: '100%',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  username: {
    marginLeft: 10,
    fontFamily: typography.family.black,
    color: colors.white,
    fontSize: 14,
    textTransform: 'uppercase',
  },
  timeLabel: {
    marginLeft: 8,
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: typography.family.bold,
  },
  closeBtn: {
    padding: 8,
  },
  musicSticker: {
    position: 'absolute',
    bottom: 120,
    alignSelf: 'center',
    width: '80%',
  },
  stickerInner: {
    padding: 12,
    borderRadius: radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  musicInfo: {
    flex: 1,
    marginLeft: 10,
  },
  songTitle: {
    fontFamily: typography.family.black,
    color: colors.white,
    fontSize: 12,
    textTransform: 'uppercase',
  },
  songArtist: {
    fontFamily: typography.family.bold,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
  },
  muteBtn: {
    padding: 4,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    width: '100%',
    alignItems: 'center',
  },
  secureText: {
    fontFamily: typography.family.black,
    color: 'rgba(255,255,255,0.4)',
    fontSize: 8,
    letterSpacing: 1,
  },
});
