import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, Send, ShieldCheck, Lock, Info } from 'lucide-react-native';
import { colors, spacing, radius, typography, shadows } from '../../theme/tokens';
import { supabase } from '../../lib/supabase';
import { encryptMessage, decryptMessage } from '../../crypto/encryption';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';

export default function DirectMessageScreen() {
  const { id: conversationId, recipientProfile: recipientProfileRaw } = useLocalSearchParams();
  const recipientProfile = recipientProfileRaw ? JSON.parse(recipientProfileRaw) : null;
  const router = useRouter();
  const { profile } = useAuthStore();
  const { appendMessage, setMessages, activeMessages } = useChatStore();

  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef(null);

  useEffect(() => {
    if (!conversationId) return;
    const sub = supabase.channel(`room:${conversationId}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, payload => {
      appendMessage(payload.new);
    }).subscribe();
    return () => supabase.removeChannel(sub);
  }, [conversationId]);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('messages').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: true });
    setMessages(data ?? []);
    setLoading(false);
  }, [conversationId]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  const sendMessage = async () => {
    if (!inputText.trim() || !recipientProfile?.public_key) return;
    const { cipher, nonce } = await encryptMessage(inputText, recipientProfile.public_key);
    await supabase.from('messages').insert({ conversation_id: conversationId, sender_id: profile.id, encrypted_content: cipher, nonce });
    setInputText('');
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={[colors.bg, '#050510']} style={StyleSheet.absoluteFill} />
      
      {/* Immersive Header */}
      <BlurView intensity={40} tint="dark" style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft color={colors.white} size={24} />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{recipientProfile?.username}</Text>
            <View style={styles.statusRow}>
                <ShieldCheck size={12} color={colors.success} />
                <Text style={styles.statusText}>E2E Encrypted</Text>
            </View>
        </View>

        <TouchableOpacity><Info color={colors.textMuted} size={20} /></TouchableOpacity>
      </BlurView>

      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <FlatList
          ref={flatListRef}
          data={activeMessages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          renderItem={({ item }) => {
            const isOwn = item.sender_id === profile.id;
            return (
              <View style={[styles.bubbleWrapper, isOwn ? styles.ownWrapper : styles.receivedWrapper]}>
                {!isOwn && (
                    <View style={styles.receivedAvatar}>
                        <Text style={styles.avatarTxt}>{recipientProfile?.username?.[0]?.toUpperCase()}</Text>
                    </View>
                )}
                <View style={[styles.bubble, isOwn ? styles.bubbleSent : styles.bubbleReceived]}>
                  {isOwn && (
                    <LinearGradient 
                        colors={[colors.accent, colors.accentSecondary]} 
                        start={{x:0, y:0}} end={{x:1, y:1}}
                        style={StyleSheet.absoluteFill} 
                    />
                  )}
                  <View style={styles.bubbleContent}>
                    <Lock size={12} color={isOwn ? colors.white : colors.accentSecondary} style={{ marginBottom: 4 }} />
                    <Text style={[styles.bubbleText, isOwn && { color: colors.white }]}>
                      🔒 Encrypted Message
                    </Text>
                  </View>
                </View>
              </View>
            );
          }}
        />

        {/* Floating Input Bar */}
        <BlurView intensity={30} tint="dark" style={styles.inputArea}>
            <View style={styles.inputContainer}>
                <TextInput 
                    style={styles.input} 
                    value={inputText} 
                    onChangeText={setInputText} 
                    placeholder="Type in cipher..." 
                    placeholderTextColor={colors.textMuted}
                    multiline
                />
                <TouchableOpacity 
                    style={[styles.sendBtn, !inputText.trim() && { opacity: 0.5 }]} 
                    onPress={sendMessage}
                    disabled={!inputText.trim()}
                >
                    <Send color={colors.white} size={20} />
                </TouchableOpacity>
            </View>
        </BlurView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.md,
    justifyContent: 'space-between',
    zIndex: 10,
    borderBottomWidth: 1,
    borderColor: colors.glassBorder,
  },
  backBtn: { padding: spacing.xs },
  headerInfo: { alignItems: 'center' },
  headerName: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
  statusRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  statusText: { color: colors.success, fontSize: 10, marginLeft: 4, fontWeight: '600' },
  
  list: { padding: spacing.lg, paddingBottom: 40 },
  bubbleWrapper: { flexDirection: 'row', marginBottom: spacing.md, alignItems: 'flex-end' },
  ownWrapper: { justifyContent: 'flex-end' },
  receivedWrapper: { justifyContent: 'flex-start' },
  receivedAvatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.bgSurface, justifyContent: 'center', alignItems: 'center', marginRight: 8, borderWidth: 1, borderColor: colors.glassBorder },
  avatarTxt: { fontSize: 10, color: colors.textSecondary, fontWeight: 'bold' },
  
  bubble: { maxWidth: '75%', borderRadius: 20, overflow: 'hidden', padding: spacing.md },
  bubbleSent: { borderBottomRightRadius: 4, ...shadows.brutal, borderWidth: 1, borderColor: colors.black },
  bubbleReceived: { backgroundColor: colors.bgSurface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.glassBorder },
  bubbleContent: { zIndex: 1 },
  bubbleText: { color: colors.textSecondary, fontSize: 14, fontWeight: '500' },
  
  inputArea: {
    paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.lg,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
    borderTopWidth: 1,
    borderColor: colors.glassBorder,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgSurface,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderWidth: 1.5,
    borderColor: colors.glassBorder,
  },
  input: { flex: 1, color: colors.white, fontSize: 15, maxHeight: 100, paddingVertical: 8 },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
});
