import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Dimensions, TextInput, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, Compass, Sparkles, TrendingUp, Filter } from 'lucide-react-native';
import { MotiView } from 'moti';
import { colors, spacing, radius, typography, shadows } from '../../theme/tokens';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = width / 2 - spacing.md * 1.5;

function DiscoveryCard({ post, index }) {
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.9, translateY: 10 }}
      animate={{ opacity: 1, scale: 1, translateY: 0 }}
      transition={{ delay: index * 50, type: 'timing' }}
      style={styles.card}
    >
      <TouchableOpacity activeOpacity={0.9}>
        <Image 
          source={{ uri: post.media_url || `https://picsum.photos/seed/${post.id}/400/600` }} 
          style={styles.cardMedia} 
        />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.8)']}
          style={styles.cardOverlay}
        >
          <Text style={styles.cardUser}>@{post.profiles?.username}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </MotiView>
  );
}

export default function ExploreScreen() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchDiscovery = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('posts')
      .select('*, profiles(username)')
      .limit(20)
      .order('created_at', { ascending: false });
    setPosts(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchDiscovery();
  }, []);

  return (
    <View style={styles.container}>
      <LinearGradient colors={[colors.bg, '#050510']} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Compass color={colors.accent} size={28} />
          <Text style={styles.title}>Discover</Text>
          <TouchableOpacity style={styles.filterBtn}>
            <Filter color={colors.white} size={20} />
          </TouchableOpacity>
        </View>

        <View style={styles.searchWrapper}>
          <View style={styles.searchBar}>
            <Search color={colors.textMuted} size={18} />
            <TextInput
              placeholder="Search global node..."
              placeholderTextColor={colors.textMuted}
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
            />
            <Sparkles color={colors.accentSecondary} size={16} />
          </View>
        </View>
      </View>

      {/* Categories */}
      <View style={styles.categories}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={['All', 'Photography', 'Art', 'Crypto', 'Nodes', 'Sailing']}
          contentContainerStyle={{ paddingHorizontal: spacing.lg }}
          renderItem={({ item }) => (
            <TouchableOpacity style={[styles.catItem, item === 'All' && styles.catItemActive]}>
              <Text style={[styles.catText, item === 'All' && styles.catTextActive]}>{item}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} size="large" />
          <Text style={styles.loadingText}>Syncing global stream...</Text>
        </View>
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => <DiscoveryCard post={item} index={index} />}
          onRefresh={fetchDiscovery}
          refreshing={loading}
          ListHeaderComponent={() => (
            <View style={styles.trendingHeader}>
              <TrendingUp color={colors.accentSecondary} size={16} />
              <Text style={styles.trendingTitle}>Sailing Trends</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { paddingTop: spacing.xxl, paddingHorizontal: spacing.lg },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  title: {
    fontFamily: typography.family.black,
    color: colors.white,
    fontSize: typography.size.xl,
    marginLeft: spacing.sm,
    flex: 1,
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.bgSurface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  searchWrapper: { marginBottom: spacing.lg },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
    paddingHorizontal: spacing.md,
    height: 50,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.glassBorder,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    color: colors.white,
    fontFamily: typography.family.regular,
    fontSize: 14,
  },
  categories: { marginBottom: spacing.lg },
  catItem: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: colors.bgSurface,
    marginRight: spacing.sm,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  catItemActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  catText: {
    fontFamily: typography.family.bold,
    color: colors.textSecondary,
    fontSize: 13,
  },
  catTextActive: { color: colors.white },
  list: { paddingHorizontal: spacing.md, paddingBottom: 100 },
  trendingHeader: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.sm, marginBottom: spacing.md },
  trendingTitle: {
    fontFamily: typography.family.black,
    color: colors.white,
    fontSize: 14,
    marginLeft: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  card: {
    width: COLUMN_WIDTH,
    height: COLUMN_WIDTH * 1.4,
    margin: spacing.sm / 2,
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.bgSurface,
    ...shadows.glass,
  },
  cardMedia: { width: '100%', height: '100%' },
  cardOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.sm,
    height: '40%',
    justifyContent: 'flex-end',
  },
  cardUser: {
    color: colors.white,
    fontFamily: typography.family.bold,
    fontSize: 12,
  },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: {
    color: colors.textSecondary,
    fontFamily: typography.family.medium,
    marginTop: spacing.md,
  },
});
