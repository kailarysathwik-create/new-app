import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, Image, ActivityIndicator, Modal } from 'react-native';
import { BlurView } from 'expo-blur';
import { Search, Music, Play, Pause, X, Check } from 'lucide-react-native';
import { colors, spacing, radius, typography, shadows, borders } from '../../theme/tokens';

let AudioModule = null;
try {
  AudioModule = require('expo-av');
} catch (_error) {
  AudioModule = null;
}
const Audio = AudioModule?.Audio ?? null;

export default function MusicPickerModal({ visible, onClose, onSelect }) {
  const [query, setQuery] = useState('');
  const [songs, setSongs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [playingId, setPlayingId] = useState(null);
  const [sound, setSound] = useState(null);

  const searchSongs = async (text) => {
    setQuery(text);
    if (text.length < 2) return;
    
    setLoading(true);
    try {
      const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(text)}&media=music&limit=20`);
      const data = await response.json();
      setSongs(data.results || []);
    } catch (error) {
      console.error('Music search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const playPreview = async (song) => {
    if (!Audio) return;
    if (playingId === song.trackId) {
      await sound?.unloadAsync();
      setPlayingId(null);
      setSound(null);
      return;
    }

    if (sound) {
      await sound.unloadAsync();
    }

    try {
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: song.previewUrl },
        { shouldPlay: true }
      );
      setSound(newSound);
      setPlayingId(song.trackId);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.didJustFinish) {
          setPlayingId(null);
        }
      });
    } catch (e) {
      console.warn('[MusicPicker] Audio not available:', e.message);
    }
  };

  useEffect(() => {
    return () => {
      sound?.unloadAsync();
    };
  }, [sound]);

  const renderSong = ({ item }) => (
    <TouchableOpacity 
      style={styles.songItem} 
      onPress={() => playPreview(item)}
    >
      <Image source={{ uri: item.artworkUrl100 }} style={styles.artwork} />
      <View style={styles.songInfo}>
        <Text style={styles.songName} numberOfLines={1}>{item.trackName}</Text>
        <Text style={styles.artistName} numberOfLines={1}>{item.artistName}</Text>
      </View>
      <View style={styles.songActions}>
        {playingId === item.trackId ? (
          <Pause size={20} color={colors.accent} fill={colors.accent} />
        ) : (
          <Play size={20} color={colors.white} fill={colors.white} />
        )}
        <TouchableOpacity 
          style={styles.selectBtn} 
          onPress={() => {
            onSelect({
              id: item.trackId,
              title: item.trackName,
              artist: item.artistName,
              previewUrl: item.previewUrl,
              artworkUrl: item.artworkUrl100
            });
            onClose();
          }}
        >
          <Check size={20} color={colors.black} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill}>
        <View style={styles.modalContent}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <Text style={styles.title}>SONG LIBRARY</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X color={colors.white} size={24} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <Search color={colors.textMuted} size={20} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search Anchors & Vibes..."
              placeholderTextColor={colors.textMuted}
              value={query}
              onChangeText={searchSongs}
              autoFocus
            />
          </View>

          {loading ? (
            <ActivityIndicator color={colors.accent} style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={songs}
              keyExtractor={(item) => item.trackId.toString()}
              renderItem={renderSong}
              contentContainerStyle={styles.list}
              ListEmptyComponent={
                query.length > 1 ? (
                  <Text style={styles.emptyText}>No waves found for this search.</Text>
                ) : (
                  <View style={styles.emptyState}>
                    <Music color={colors.accent} size={48} strokeWidth={1} />
                    <Text style={styles.emptyText}>Find the perfect soundtrack for your Anchor.</Text>
                  </View>
                )
              }
            />
          )}
        </View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    flex: 1,
    marginTop: 60,
    backgroundColor: 'rgba(10, 10, 10, 0.9)',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  title: {
    fontFamily: typography.family.black,
    color: colors.white,
    fontSize: 20,
    letterSpacing: 2,
  },
  closeBtn: { padding: 4 },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  searchIcon: { marginRight: spacing.sm },
  searchInput: {
    flex: 1,
    color: colors.white,
    fontFamily: typography.family.bold,
    fontSize: 16,
    paddingVertical: 12,
  },
  list: { padding: spacing.lg },
  songItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    padding: spacing.sm,
    borderRadius: radius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  artwork: { width: 50, height: 50, borderRadius: radius.sm },
  songInfo: { flex: 1, marginLeft: spacing.md },
  songName: { fontFamily: typography.family.bold, color: colors.white, fontSize: 14 },
  artistName: { fontFamily: typography.family.medium, color: colors.textMuted, fontSize: 12, marginTop: 2 },
  songActions: { flexDirection: 'row', alignItems: 'center' },
  selectBtn: {
    backgroundColor: colors.accent,
    padding: 8,
    borderRadius: radius.full,
    marginLeft: spacing.lg,
    borderWidth: 2,
    borderColor: colors.black,
    ...shadows.brutalSmall,
  },
  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyText: {
    fontFamily: typography.family.medium,
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 20,
    paddingHorizontal: 40,
  },
});
