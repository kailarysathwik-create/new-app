import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Dimensions, TextInput, ActivityIndicator, Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, Sparkles, TrendingUp, Filter, UserPlus } from 'lucide-react-native';
import { MotiView } from 'moti';
import { useRouter } from 'expo-router';
import { colors, spacing, radius, typography, shadows } from '../../theme/tokens';
import NeoButton from '../../components/ui/NeoButton';
import GridBackground from '../../components/ui/GridBackground';
import { supabase } from '../../lib/supabase';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = width / 2 - spacing.md * 1.5;

function DiscoveryCard({ post, index }) {
  const router = useRouter();
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.9, translateY: 10 }}
      animate={{ opacity: 1, scale: 1, translateY: 0 }}
      transition={{ delay: index * 50, type: 'timing' }}
      style={styles.card}
    >
      <TouchableOpacity activeOpacity={0.9} onPress={() => router.push(`/user/${post.user_id}`)}>
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
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
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

  useEffect(() => {
    if (search.length > 1) {
      setIsSearching(true);
      const searchUsers = async () => {
        const cleanTerm = search.replace(/@/g, '').trim();
        const { data } = await supabase
          .from('profiles')
          .select('id, username, avatar_url, bio')
          .ilike('username', `%${cleanTerm}%`)
          .limit(20);
        setSearchResults(data || []);
      };
      
      const timeoutId = setTimeout(searchUsers, 300); // Debounce
      return () => clearTimeout(timeoutId);
    } else {
      setIsSearching(false);
      setSearchResults([]);
    }
  }, [search]);

  const handleInvite = () => {
    const inviteLink = 'https://saily.so/invite-placeholder'; // Later add original link
    const message = `⚓ Set sail with me on Saily! The private web is here. Join the Harbour: ${inviteLink}`;
    const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
    
    Linking.canOpenURL(url).then(supported => {
      if (supported) {
        Linking.openURL(url);
      } else {
        const webUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
        Linking.openURL(webUrl);
      }
    });
  };

  const UserSearchCard = ({ user, index }) => {
    const router = useRouter();
    return (
      <MotiView
        from={{ opacity: 0, translateX: -20 }}
        animate={{ opacity: 1, translateX: 0 }}
        transition={{ delay: index * 50, type: 'timing' }}
        style={styles.userCard}
      >
        <TouchableOpacity style={styles.userCardInner} onPress={() => router.push(`/user/${user.id}`)}>
          <Image 
            source={user.avatar_url ? { uri: user.avatar_url } : require('../../../assets/images/defaultavatar.png')} 
            style={styles.userAvatar} 
          />
          <View style={styles.userInfo}>
            <Text style={styles.userUsername}>@{user.username}</Text>
            {user.bio && <Text style={styles.userBio} numberOfLines={1}>{user.bio}</Text>}
          </View>
          <UserPlus color={colors.accent} size={20} />
        </TouchableOpacity>
      </MotiView>
    );
  };

  return (
    <View style={styles.container}>
      <GridBackground fill="#F7E3BE" stroke="rgba(255,92,0,0.12)" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Image 
              source={require('../../../assets/images/explore-logo.png')} 
              style={styles.exploreLogo} 
              resizeMode="contain"
          />
          <NeoButton style={styles.filterBtn}>
            <Filter color={colors.black} size={20} />
          </NeoButton>
        </View>

        <View style={styles.searchWrapper}>
          <View style={styles.searchBar}>
            <Search color={colors.textMuted} size={18} />
            <TextInput
              placeholder="Search users..."
              placeholderTextColor="#6C584C"
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              autoCapitalize="none"
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

      {loading && !isSearching ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} size="large" />
          <Text style={styles.loadingText}>Navigating the Harbour...</Text>
        </View>
      ) : isSearching ? (
        <FlatList
          key="search-list"
          data={searchResults}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: spacing.lg }}
          renderItem={({ item, index }) => <UserSearchCard user={item} index={index} />}
          ListEmptyComponent={() => (
            <View style={styles.center}>
               <Text style={styles.loadingText}>No users found.</Text>
            </View>
          )}
        />
      ) : (
        <FlatList
          key="explore-list"
          data={posts}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => <DiscoveryCard post={item} index={index} />}
          onRefresh={fetchDiscovery}
          refreshing={loading}
          ListHeaderComponent={() => (
            <View>
                <View style={styles.craftingNotice}>
                    <Text style={styles.craftingText}>Under crafting, in time meet your people, if they are not here invite and sail together.</Text>
                </View>
                <View style={styles.trendingHeader}>
                    <TrendingUp color={colors.accentSecondary} size={16} />
                    <Text style={styles.trendingTitle}>HARBOUR TRENDS</Text>
                </View>
            </View>
          )}
          ListEmptyComponent={() => (
            <MotiView 
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                style={styles.emptyContainer}
            >
                <View style={styles.emptyIconCircle}>
                    <UserPlus color={colors.accent} size={32} />
                </View>
                <Text style={styles.emptyTitle}>NO LAND IN SIGHT</Text>
                <Text style={styles.emptySub}>
                    Is it a person? Then invite them to sail! Meet your people in the Harbour.
                </Text>
                <TouchableOpacity style={styles.inviteBtn} onPress={handleInvite}>
                    <Text style={styles.inviteBtnText}>SEND WHATSAPP INVITE ⚓</Text>
                </TouchableOpacity>
            </MotiView>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7E3BE' },
  header: { paddingTop: spacing.xxl, paddingHorizontal: spacing.lg },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  exploreLogo: { 
    width: 120, 
    height: 32,
    flex: 1, 
  },
  filterBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFF8EB',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: colors.black,
    ...shadows.brutalSmall,
  },
  searchWrapper: { marginBottom: spacing.lg },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8EB',
    paddingHorizontal: spacing.md,
    height: 50,
    borderRadius: radius.md,
    borderWidth: 3,
    borderColor: colors.black,
    ...shadows.brutalSmall,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    color: colors.black,
    fontFamily: typography.family.regular,
    fontSize: 14,
  },
  categories: { marginBottom: spacing.lg },
  catItem: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: radius.full,
    backgroundColor: '#FFF8EB',
    marginRight: spacing.sm,
    borderWidth: 3,
    borderColor: colors.black,
    ...shadows.brutalSmall,
  },
  catItemActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  catText: {
    fontFamily: typography.family.bold,
    color: colors.black,
    fontSize: 13,
  },
  catTextActive: { color: colors.black },
  list: { paddingHorizontal: spacing.md, paddingBottom: 100 },
  trendingHeader: { flexDirection: 'row', alignItems: 'center', marginHorizontal: spacing.sm, marginBottom: spacing.md },
  trendingTitle: {
    fontFamily: typography.family.black,
    color: colors.black,
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
    backgroundColor: '#FFF8EB',
    borderWidth: 3,
    borderColor: colors.black,
    ...shadows.brutal,
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
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  loadingText: {
    color: colors.black,
    fontFamily: typography.family.medium,
    marginTop: spacing.md,
  },
  craftingNotice: {
    backgroundColor: '#FFF8E1',
    borderWidth: 1.5,
    borderColor: '#FFD54F',
    marginHorizontal: spacing.sm,
    padding: 10,
    marginBottom: 20,
    borderRadius: 4,
  },
  craftingText: {
    color: '#F57F17',
    fontSize: 10,
    fontFamily: typography.family.bold,
    textAlign: 'center',
    lineHeight: 14,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
  },
  emptyIconCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: '#FFF8EB',
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: spacing.lg,
      borderWidth: 3,
      borderColor: colors.black,
      ...shadows.brutalSmall,
  },
  emptyTitle: {
      fontFamily: typography.family.black,
      color: colors.black,
      fontSize: 18,
      letterSpacing: 1,
      marginBottom: spacing.sm,
  },
  emptySub: {
      fontFamily: typography.family.medium,
      color: '#5C4634',
      fontSize: 14,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: spacing.xl,
  },
  inviteBtn: {
      backgroundColor: colors.accent,
      paddingHorizontal: spacing.xl,
      paddingVertical: 16,
      borderRadius: radius.md,
      marginTop: spacing.xl,
      borderWidth: 3,
      borderColor: colors.black,
      ...shadows.brutal,
  },
  inviteBtnText: {
      color: colors.black,
      fontFamily: typography.family.black,
      letterSpacing: 1,
      fontSize: 14,
  },
  userCard: {
    marginBottom: spacing.md,
    backgroundColor: '#FFF8EB',
    borderRadius: radius.md,
    borderWidth: 3,
    borderColor: colors.black,
    overflow: 'hidden',
    ...shadows.brutalSmall,
  },
  userCardInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  userInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  userUsername: {
    fontFamily: typography.family.black,
    color: colors.black,
    fontSize: 16,
  },
  userBio: {
    fontFamily: typography.family.regular,
    color: '#6C584C',
    fontSize: 12,
    marginTop: 4,
  },
});
