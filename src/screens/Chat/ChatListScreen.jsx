import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, MessageSquarePlus, Shield, ChevronRight, Lock } from 'lucide-react-native';
import { router } from 'expo-router';
import { colors, spacing, radius, typography, shadows } from '../../theme/tokens';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';

function ConvoTile({ conversation, onPress }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <BlurView intensity={10} tint="dark" style={styles.convoCard}>
            <View style={styles.avatarWrapper}>
                <LinearGradient
                    colors={[colors.accent, colors.accentSecondary]}
                    style={styles.avatarGlow}
                />
                <View style={styles.avatarInner}>
                    <Text style={styles.avatarLetter}>
                        {conversation.otherUser?.username?.[0]?.toUpperCase() ?? '?'}
                    </Text>
                </View>
                <View style={styles.onlineBadge} />
            </View>

            <View style={styles.convoBody}>
                <View style={styles.convoHeader}>
                    <Text style={styles.convoName}>{conversation.otherUser?.username}</Text>
                    <Text style={styles.convoTime}>12:45 PM</Text>
                </View>
                <View style={styles.messageRow}>
                    <Lock size={12} color={colors.success} style={{ marginRight: 4 }} />
                    <Text style={styles.convoPreview} numberOfLines={1}>
                        Cipher payload received...
                    </Text>
                </View>
            </View>
            <ChevronRight color={colors.textMuted} size={18} />
        </BlurView>
    </TouchableOpacity>
  );
}

export default function ChatListScreen() {
  const { profile } = useAuthStore();
  const { conversations, setConversations } = useChatStore();
  const [loading, setLoading] = useState(true);

  const fetchConversations = async () => {
    if (!profile) return;
    setLoading(true);
    const { data } = await supabase.from('conversation_participants').select('conversation_id, conversations(id, is_hidden)').eq('user_id', profile.id);
    if (data) {
      const convos = await Promise.all(data.map(async (item) => {
        const { data: p } = await supabase.from('conversation_participants').select('profiles(id, username, public_key, avatar_url)').eq('conversation_id', item.conversation_id).neq('user_id', profile.id).single();
        return { ...item.conversations, otherUser: p?.profiles };
      }));
      setConversations(convos);
    }
    setLoading(false);
  };

  useEffect(() => { fetchConversations(); }, [profile]);

  return (
    <View style={styles.container}>
      <LinearGradient colors={[colors.bg, '#0A001F']} style={StyleSheet.absoluteFill} />
      
      {/* Header */}
      <View style={styles.topBar}>
        <Text style={styles.title}>Messages</Text>
        <TouchableOpacity style={styles.iconBtn}>
            <MessageSquarePlus color={colors.white} size={24} />
        </TouchableOpacity>
      </View>

      {/* Search Bar (Brutal) */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchBar}>
            <Search color={colors.textMuted} size={20} />
            <TextInput 
                placeholder="Search encrypted node..." 
                placeholderTextColor={colors.textMuted}
                style={styles.searchInput}
            />
        </View>
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.accent} /></View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ConvoTile
              conversation={item}
              onPress={() => router.push({ 
                pathname: `/chat/${item.id}`, 
                params: { recipientProfile: JSON.stringify(item.otherUser) } 
              })}
            />
          )}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.center}>
                <Shield color={colors.textMuted} size={48} style={{ marginBottom: 16 }} />
                <Text style={styles.emptyText}>No secure channels established.</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.md,
  },
  title: { fontSize: typography.size.xl, fontWeight: '900', color: colors.white, letterSpacing: 1 },
  iconBtn: { backgroundColor: colors.accent, padding: 10, borderRadius: 12, ...shadows.brutal, borderWidth: 2, borderColor: colors.black },
  searchWrapper: { paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
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
  searchInput: { flex: 1, marginLeft: spacing.sm, color: colors.white, fontSize: 14 },
  list: { paddingHorizontal: spacing.lg },
  convoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.glassBorder,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  avatarWrapper: { width: 54, height: 54, borderRadius: 27, justifyContent: 'center', alignItems: 'center' },
  avatarGlow: { position: 'absolute', width: '100%', height: '100%', borderRadius: 27, opacity: 0.3 },
  avatarInner: { width: 48, height: 48, borderRadius: 24, backgroundColor: colors.bgSurface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: colors.glassBorder },
  avatarLetter: { color: colors.accentSecondary, fontWeight: 'bold', fontSize: 18 },
  onlineBadge: { position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, borderRadius: 6, backgroundColor: colors.success, borderWidth: 2, borderColor: colors.bg },
  convoBody: { flex: 1, marginLeft: spacing.md },
  convoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  convoName: { color: colors.white, fontWeight: 'bold', fontSize: 15 },
  convoTime: { color: colors.textMuted, fontSize: 11 },
  messageRow: { flexDirection: 'row', alignItems: 'center' },
  convoPreview: { color: colors.textSecondary, fontSize: 13, flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyText: { color: colors.textMuted, fontSize: 14 },
});
