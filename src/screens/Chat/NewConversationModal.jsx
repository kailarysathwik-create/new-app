import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MessageSquarePlus, Search, ShieldCheck, X } from 'lucide-react-native';
import { MotiView } from 'moti';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator, Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { colors, radius, shadows, spacing, typography } from '../../theme/tokens';
import { haptics } from '../../utils/haptics';

function UserResult({ user, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75}>
      <MotiView
        from={{ opacity: 0, translateX: -20 }}
        animate={{ opacity: 1, translateX: 0 }}
        style={styles.userCard}
      >
        <LinearGradient
          colors={[colors.accent, colors.accentSecondary]}
          style={styles.avatarBorder}
        >
          <View style={styles.avatarInner}>
            <Text style={styles.avatarLetter}>
              {user.username?.[0]?.toUpperCase() ?? '?'}
            </Text>
          </View>
        </LinearGradient>

        <View style={styles.userInfo}>
          <Text style={styles.username}>@{user.username}</Text>
          <View style={styles.secureRow}>
            <ShieldCheck size={11} color={colors.success} />
            <Text style={styles.secureText}>Encrypted node available</Text>
          </View>
        </View>

        <View style={styles.startBtn}>
          <MessageSquarePlus size={18} color={colors.white} />
        </View>
      </MotiView>
    </TouchableOpacity>
  );
}

export default function NewConversationModal() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [starting, setStarting] = useState(false);

  const searchUsers = useCallback(async (text) => {
    setQuery(text);
    if (text.trim().length < 2) { setResults([]); return; }
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, username, public_key, avatar_url')
      .ilike('username', `%${text.trim()}%`)
      .neq('id', profile?.id)
      .limit(20);
    setResults(data ?? []);
    setLoading(false);
  }, [profile]);

  const startConversation = async (otherUser) => {
    if (starting) return;
    haptics.medium();
    setStarting(true);
    try {
      // Check if a conversation already exists between these two users
      const { data: existing } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', profile.id);

      let sharedConvoId = null;
      if (existing && existing.length > 0) {
        const myConvoIds = existing.map((e) => e.conversation_id);
        const { data: overlap } = await supabase
          .from('conversation_participants')
          .select('conversation_id')
          .eq('user_id', otherUser.id)
          .in('conversation_id', myConvoIds);
        if (overlap && overlap.length > 0) {
          sharedConvoId = overlap[0].conversation_id;
        }
      }

      if (!sharedConvoId) {
        // Create a new conversation
        const { data: convo, error: convoError } = await supabase
          .from('conversations')
          .insert({ is_hidden: false })
          .select()
          .single();
        if (convoError) throw convoError;

        // Add both participants
        await supabase.from('conversation_participants').insert([
          { conversation_id: convo.id, user_id: profile.id },
          { conversation_id: convo.id, user_id: otherUser.id },
        ]);
        sharedConvoId = convo.id;
      }

      router.dismiss();
      router.push({
        pathname: `/chat/${sharedConvoId}`,
        params: { recipientProfile: JSON.stringify(otherUser) },
      });
    } catch (e) {
      Alert.alert('Error', 'Could not create secure channel: ' + e.message);
    } finally {
      setStarting(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[colors.bgCard, '#0A001F']} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.dismiss()} style={styles.closeBtn}>
          <X color={colors.textMuted} size={22} />
        </TouchableOpacity>
        <Text style={styles.title}>New Message</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Search Input */}
      <BlurView intensity={15} tint="dark" style={styles.searchBar}>
        <Search color={colors.textMuted} size={18} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search Saily users..."
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={searchUsers}
          autoFocus
          autoCapitalize="none"
        />
        {loading && <ActivityIndicator size="small" color={colors.accent} />}
      </BlurView>

      {/* Results */}
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <UserResult user={item} onPress={() => startConversation(item)} />
        )}
        ListEmptyComponent={
          query.length >= 2 && !loading ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyText}>No users found for &quot;{query}&quot;</Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <MessageSquarePlus color={colors.textMuted} size={40} style={{ marginBottom: 12 }} />
              <Text style={styles.emptyText}>Type a username to start sailing</Text>
            </View>
          )
        }
      />

      {starting && (
        <BlurView intensity={40} tint="dark" style={styles.loadingOverlay}>
          <ActivityIndicator color={colors.accent} size="large" />
          <Text style={styles.loadingText}>Establishing ship...</Text>
        </BlurView>
      )}
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
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.bgSurface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  title: {
    fontFamily: typography.family.black,
    color: colors.white,
    fontSize: 18,
    letterSpacing: 0.5,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.md,
    height: 52,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.glassBorder,
    overflow: 'hidden',
    marginBottom: spacing.lg,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontFamily: typography.family.regular,
    color: colors.white,
    fontSize: 16,
  },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 60 },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.glassBorder,
  },
  avatarBorder: {
    padding: 2,
    borderRadius: 26,
    width: 52,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarLetter: {
    fontFamily: typography.family.black,
    color: colors.accent,
    fontSize: 20,
  },
  userInfo: { flex: 1, marginLeft: spacing.md },
  username: {
    fontFamily: typography.family.bold,
    color: colors.white,
    fontSize: 15,
  },
  secureRow: { flexDirection: 'row', alignItems: 'center', marginTop: 3 },
  secureText: {
    fontFamily: typography.family.medium,
    color: colors.success,
    fontSize: 11,
    marginLeft: 4,
  },
  startBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.brutal,
    borderWidth: 1.5,
    borderColor: colors.black,
  },
  emptyState: { paddingTop: 60, alignItems: 'center' },
  emptyText: {
    fontFamily: typography.family.medium,
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99,
  },
  loadingText: {
    fontFamily: typography.family.bold,
    color: colors.white,
    marginTop: spacing.md,
  },
});
