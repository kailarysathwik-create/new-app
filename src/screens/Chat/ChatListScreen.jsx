import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, TextInput, Platform, Image } from 'react-native';
import { MotiView } from 'moti';
import { Search, MessageSquarePlus, Shield, ChevronRight, Lock } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { colors, spacing, radius, shadows } from '../../theme/tokens';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';
import GridBackground from '../../components/ui/GridBackground';

function ConvoTile({ conversation, onPress }) {
  return (
    <MotiView from={{ opacity: 0, translateY: 10 }} animate={{ opacity: 1, translateY: 0 }} transition={{ type: 'timing', duration: 260 }}>
      <TouchableOpacity onPress={onPress} activeOpacity={0.82}>
        <View style={styles.convoCard}>
          <View style={styles.avatarWrapper}>
            <View style={styles.avatarGlow} />
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
          <ChevronRight color={colors.black} size={18} />
        </View>
      </TouchableOpacity>
    </MotiView>
  );
}

export default function ChatListScreen() {
  const router = useRouter();
  const { profile } = useAuthStore();
  const { conversations, setConversations } = useChatStore();
  const [loading, setLoading] = useState(true);

  const fetchConversations = useCallback(async () => {
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
  }, [profile, setConversations]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  return (
    <View style={styles.container}>
      <GridBackground fill="#F7E3BE" stroke="rgba(255,92,0,0.12)" />

      <View style={styles.contentWrap}>
        {/* Header */}
        <View style={styles.topBar}>
          <Image 
              source={require('../../../assets/images/chat-logo.png')} 
              style={styles.chatLogo} 
              resizeMode="contain"
          />
          <TouchableOpacity style={styles.iconBtn}>
              <MessageSquarePlus color={colors.black} size={24} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7E3BE' },
  contentWrap: {
    flex: 1,
    width: '100%',
    maxWidth: Platform.OS === 'web' ? 980 : '100%',
    alignSelf: 'center',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.md,
  },
  chatLogo: { 
    width: 100, 
    height: 32,
  },
  iconBtn: { backgroundColor: colors.accent, padding: 10, borderRadius: 12, ...shadows.brutal, borderWidth: 3, borderColor: colors.black },
  searchWrapper: { paddingHorizontal: spacing.lg, marginBottom: spacing.lg },
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
  searchInput: { flex: 1, marginLeft: spacing.sm, color: colors.black, fontSize: 14 },
  list: { paddingHorizontal: spacing.lg, paddingBottom: Platform.OS === 'web' ? spacing.xl : 0 },
  convoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 3,
    borderColor: colors.black,
    marginBottom: spacing.md,
    overflow: 'hidden',
    backgroundColor: '#FFF8EB',
    ...shadows.brutal,
    ...(Platform.OS === 'web' ? { maxWidth: 820, alignSelf: 'center', width: '100%' } : null),
  },
  avatarWrapper: { width: 54, height: 54, borderRadius: 27, justifyContent: 'center', alignItems: 'center' },
  avatarGlow: { position: 'absolute', width: '100%', height: '100%', borderRadius: 27, backgroundColor: colors.accent, borderWidth: 2, borderColor: colors.black },
  avatarInner: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFF4DA', justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: colors.black },
  avatarLetter: { color: colors.black, fontWeight: 'bold', fontSize: 18 },
  onlineBadge: { position: 'absolute', bottom: 2, right: 2, width: 12, height: 12, borderRadius: 6, backgroundColor: colors.success, borderWidth: 2, borderColor: '#FFF8EB' },
  convoBody: { flex: 1, marginLeft: spacing.md },
  convoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  convoName: { color: colors.black, fontWeight: 'bold', fontSize: 15 },
  convoTime: { color: '#6C584C', fontSize: 11 },
  messageRow: { flexDirection: 'row', alignItems: 'center' },
  convoPreview: { color: '#5C4634', fontSize: 13, flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyText: { color: colors.black, fontSize: 14 },
});
