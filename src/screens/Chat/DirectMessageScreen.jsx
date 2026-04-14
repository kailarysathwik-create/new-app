import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Send, Info } from 'lucide-react-native';
import { colors, spacing, radius, typography, shadows, borders } from '../../theme/tokens';
import { supabase } from '../../lib/supabase';
import { decryptMessage, encryptMessage } from '../../crypto/encryption';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';

export default function DirectMessageScreen() {
  const { id: conversationId, recipientProfile: recipientProfileRaw } = useLocalSearchParams();
  const recipientProfile = recipientProfileRaw ? JSON.parse(recipientProfileRaw) : null;
  const router = useRouter();
  const { profile } = useAuthStore();
  const { appendMessage, setMessages, activeMessages } = useChatStore();

  const [inputText, setInputText] = useState('');
  const [decryptedMessages, setDecryptedMessages] = useState({});
  const flatListRef = useRef(null);

  useEffect(() => {
    if (!conversationId) return;
    const sub = supabase.channel(`room:${conversationId}`).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, payload => {
      const msg = payload.new;
      appendMessage(msg);
      autoDecrypt(msg);
    }).subscribe();
    return () => supabase.removeChannel(sub);
  }, [conversationId]);

  const autoDecrypt = useCallback(async (msg) => {
    if (!recipientProfile?.public_key) return;
    try {
        const text = await decryptMessage(msg.encrypted_content, msg.nonce, recipientProfile.public_key);
        setDecryptedMessages(prev => ({ ...prev, [msg.id]: text }));
    } catch (e) {
        setDecryptedMessages(prev => ({ ...prev, [msg.id]: "[Secure Message]" }));
    }
  }, [recipientProfile]);

  const fetchMessages = useCallback(async () => {
    const { data } = await supabase.from('messages').select('*').eq('conversation_id', conversationId).order('created_at', { ascending: true });
    setMessages(data ?? []);
    if (data) data.forEach(autoDecrypt);
  }, [conversationId, autoDecrypt]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  const sendMessage = async () => {
    if (!inputText.trim() || !recipientProfile?.public_key) return;
    const { cipher, nonce } = await encryptMessage(inputText, recipientProfile.public_key);
    await supabase.from('messages').insert({ conversation_id: conversationId, sender_id: profile.id, encrypted_content: cipher, nonce });
    setInputText('');
  };

  return (
    <View style={styles.container}>
      {/* Normal Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft color={colors.black} size={24} />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{recipientProfile?.username || 'Chat'}</Text>
            <Text style={styles.statusText}>Active Now</Text>
        </View>

        <TouchableOpacity><Info color={colors.black} size={20} /></TouchableOpacity>
      </View>

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
            const content = decryptedMessages[item.id];
            
            return (
              <View style={[styles.bubbleWrapper, isOwn ? styles.ownWrapper : styles.receivedWrapper]}>
                <View style={[styles.bubble, isOwn ? styles.bubbleSent : styles.bubbleReceived]}>
                  <Text style={[styles.bubbleText, isOwn && { color: colors.white }]}>
                    {content || "..."}
                  </Text>
                </View>
              </View>
            );
          }}
        />

        {/* Normal Input Bar */}
        <View style={styles.inputArea}>
            <View style={styles.inputContainer}>
                <TextInput 
                    style={styles.input} 
                    value={inputText} 
                    onChangeText={setInputText} 
                    placeholder="Message..." 
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
        </View>
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
    backgroundColor: colors.white,
    borderBottomWidth: borders.thick,
    borderColor: borders.color,
    justifyContent: 'space-between',
    zIndex: 10,
    ...shadows.brutalSmall,
  },
  backBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerInfo: { alignItems: 'center' },
  headerName: { 
    fontFamily: typography.family.black,
    color: colors.black, 
    fontSize: 18, 
    textTransform: 'uppercase'
  },
  statusText: { 
    fontFamily: typography.family.bold,
    color: colors.success, 
    fontSize: 10, 
    marginTop: 2
  },
  
  list: { padding: spacing.lg, paddingBottom: 40 },
  bubbleWrapper: { flexDirection: 'row', marginBottom: spacing.md },
  ownWrapper: { justifyContent: 'flex-end' },
  receivedWrapper: { justifyContent: 'flex-start' },
  
  bubble: { 
    maxWidth: '80%', 
    padding: spacing.md,
    borderWidth: borders.medium,
    borderColor: borders.color,
    ...shadows.brutalSmall,
  },
  bubbleSent: { 
    backgroundColor: colors.accent,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderBottomLeftRadius: radius.lg,
  },
  bubbleReceived: { 
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
  bubbleText: { 
    fontFamily: typography.family.medium,
    color: colors.black, 
    fontSize: 15,
  },
  
  inputArea: {
    paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.lg,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.white,
    borderTopWidth: borders.thick,
    borderColor: borders.color,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  input: { 
    flex: 1, 
    color: colors.black, 
    fontFamily: typography.family.bold,
    fontSize: 14, 
    maxHeight: 100, 
    paddingVertical: 12 
  },
  sendBtn: {
    width: 44,
    height: 44,
    backgroundColor: colors.black,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: radius.full,
    marginLeft: spacing.sm,
  },
});


