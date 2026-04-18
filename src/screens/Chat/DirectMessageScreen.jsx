import React, { useEffect, useState, useCallback, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, KeyboardAvoidingView, Platform, ActivityIndicator, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Send, Info, Plus } from 'lucide-react-native';
import { BlurView } from 'expo-blur';
import { MotiView, AnimatePresence } from 'moti';
import { colors, spacing, radius, typography, shadows, borders } from '../../theme/tokens';
import { supabase } from '../../lib/supabase';
import { decryptMessage, encryptMessage } from '../../crypto/encryption';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';

// ─── GLOW TRAIL COMPONENT ──────────────────────────────────────────────────
function GlowTrail({ isVisible }) {
  if (!isVisible) return null;
  return (
    <MotiView
      from={{ rotate: '0deg', opacity: 0 }}
      animate={{ rotate: '360deg', opacity: 1 }}
      transition={{ 
        rotate: { loop: true, duration: 2000, type: 'timing' },
        opacity: { duration: 500 }
      }}
      style={styles.glowContainer}
    >
      <View style={styles.glowTrail} />
    </MotiView>
  );
}

// ─── CHAT BUBBLE COMPONENT ─────────────────────────────────────────────────
function ChatBubble({ item, isOwn, content, lastInteractedMsgId, setLastInteractedMsgId }) {
  const isGlowing = !isOwn && lastInteractedMsgId === item.id;

  return (
    <MotiView
      from={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', damping: 12 }}
      style={[styles.bubbleWrapper, isOwn ? styles.ownWrapper : styles.receivedWrapper]}
    >
      <View style={[styles.bubble, isOwn ? styles.bubbleSent : styles.bubbleReceived]}>
        <BlurView intensity={isOwn ? 0 : 30} tint="dark" style={StyleSheet.absoluteFill} />
        <GlowTrail isVisible={isGlowing} />
        
        <MotiView
            from={{ opacity: 0, translateY: 5 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 300, type: 'timing', duration: 400 }}
        >
            <Text style={[styles.bubbleText, isOwn && { color: colors.white }]}>
                {content || "..."}
            </Text>
        </MotiView>
      </View>
    </MotiView>
  );
}

export default function DirectMessageScreen() {
  const { id: conversationId, recipientProfile: recipientProfileRaw } = useLocalSearchParams();
  const recipientProfile = recipientProfileRaw ? JSON.parse(recipientProfileRaw) : null;
  const router = useRouter();
  const { profile } = useAuthStore();
  const { appendMessage, setMessages, activeMessages } = useChatStore();

  const [inputText, setInputText] = useState('');
  const [decryptedMessages, setDecryptedMessages] = useState({});
  const [lastInteractedMsgId, setLastInteractedMsgId] = useState(null);
  const [isMutual, setIsMutual] = useState(true); // Default true until check
  const [checkingMutual, setCheckingMutual] = useState(true);
  const flatListRef = useRef(null);

  useEffect(() => {
    if (!conversationId) return;
    const sub = supabase.channel(`room:${conversationId}`).on('postgres_changes', { 
        event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` 
    }, payload => {
      const msg = payload.new;
      appendMessage(msg);
      autoDecrypt(msg);
      if (msg.sender_id !== profile.id) {
          setLastInteractedMsgId(msg.id);
      }
    }).subscribe();
    return () => supabase.removeChannel(sub);
  }, [conversationId, profile.id]);

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

  const checkIfMutual = useCallback(async () => {
    if (!recipientProfile?.id) return;
    setCheckingMutual(true);
    const { data: f1 } = await supabase.from('follows').select('status').eq('follower_id', profile.id).eq('following_id', recipientProfile.id).eq('status', 'accepted').single();
    const { data: f2 } = await supabase.from('follows').select('status').eq('follower_id', recipientProfile.id).eq('following_id', profile.id).eq('status', 'accepted').single();
    setIsMutual(!!f1 && !!f2);
    setCheckingMutual(false);
  }, [profile.id, recipientProfile?.id]);

  useEffect(() => { 
    fetchMessages(); 
    checkIfMutual();
  }, [fetchMessages, checkIfMutual]);

  const sendMessage = async () => {
    if (!inputText.trim() || !recipientProfile?.public_key || !isMutual) return;
    setLastInteractedMsgId(null);
    const { cipher, nonce } = await encryptMessage(inputText, recipientProfile.public_key);
    await supabase.from('messages').insert({ conversation_id: conversationId, sender_id: profile.id, encrypted_content: cipher, nonce });
    setInputText('');
  };

  const handleInvite = () => {
    const message = `⚓ Set sail with me on Saily! Join the private chat.`;
    const url = `whatsapp://send?text=${encodeURIComponent(message)}`;
    Linking.openURL(url).catch(() => Linking.openURL(`https://wa.me/?text=${encodeURIComponent(message)}`));
  };

  return (
    <View style={styles.container} onTouchStart={() => setLastInteractedMsgId(null)}>
      {/* Brutalist Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft color={colors.black} size={24} strokeWidth={3} />
        </TouchableOpacity>
        
        <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{recipientProfile?.username || 'Chat'}</Text>
            <View style={styles.secureBadge}>
                <Text style={styles.statusText}>ENCRYPTED CHANNEL</Text>
            </View>
        </View>

        <TouchableOpacity onPress={handleInvite} style={styles.infoBtn}>
            <Plus color={colors.black} size={20} strokeWidth={3} />
        </TouchableOpacity>
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
          renderItem={({ item }) => (
            <ChatBubble 
                item={item} 
                isOwn={item.sender_id === profile.id}
                content={decryptedMessages[item.id]}
                lastInteractedMsgId={lastInteractedMsgId}
                setLastInteractedMsgId={setLastInteractedMsgId}
            />
          )}
        />

        {/* Input Area or Privacy Lock */}
        {checkingMutual ? (
             <View style={styles.inputArea}><ActivityIndicator color={colors.accent} /></View>
        ) : isMutual ? (
            <View style={styles.inputArea}>
                <View style={styles.inputRow}>
                    <TouchableOpacity onPress={handleInvite} style={styles.invitePlus}>
                        <Plus color={colors.black} size={24} strokeWidth={3} />
                    </TouchableOpacity>
                    <View style={styles.inputContainer}>
                        <TextInput 
                            style={styles.input} 
                            value={inputText} 
                            onChangeText={setInputText} 
                            placeholder="Cipher Message..." 
                            placeholderTextColor={colors.textMuted}
                            multiline
                        />
                        <TouchableOpacity 
                            style={[styles.sendBtn, !inputText.trim() && { opacity: 0.5 }]} 
                            onPress={sendMessage}
                            disabled={!inputText.trim()}
                        >
                            <Send color={colors.white} size={20} strokeWidth={3} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        ) : (
            <View style={styles.lockArea}>
                <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
                <Text style={styles.lockText}>ENCRYPTION CHANNEL LOCKED</Text>
                <Text style={styles.lockSub}>Mutual following required to vibe in the Harbour. Follow back to unlock.</Text>
                <TouchableOpacity style={styles.profileBtn} onPress={() => router.push(`/user/${recipientProfile.id}`)}>
                    <Text style={styles.profileBtnText}>VIEW HARBOUR PROFILE</Text>
                </TouchableOpacity>
            </View>
        )}
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
    backgroundColor: colors.accent,
    borderBottomWidth: borders.thick,
    borderColor: colors.black,
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
    textTransform: 'uppercase',
    letterSpacing: 1
  },
  secureBadge: { 
    backgroundColor: colors.black,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 2,
  },
  statusText: { 
    fontFamily: typography.family.black,
    color: colors.white, 
    fontSize: 8,
  },
  infoBtn: { 
    width: 40, 
    height: 40, 
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.black,
    justifyContent: 'center', 
    alignItems: 'center',
    ...shadows.brutalSmall 
  },
  
  list: { padding: spacing.lg, paddingBottom: 40 },
  bubbleWrapper: { flexDirection: 'row', marginBottom: spacing.lg },
  ownWrapper: { justifyContent: 'flex-end' },
  receivedWrapper: { justifyContent: 'flex-start' },
  
  bubble: { 
    maxWidth: '85%', 
    padding: spacing.md,
    borderWidth: 3,
    borderColor: colors.black,
    overflow: 'hidden',
    ...shadows.brutalSmall,
  },
  bubbleSent: { 
    backgroundColor: colors.accent,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderBottomLeftRadius: radius.xl,
    ...shadows.brutal,
  },
  bubbleReceived: { 
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    borderBottomRightRadius: radius.xl,
  },
  bubbleText: { 
    fontFamily: typography.family.bold,
    color: colors.black, 
    fontSize: 15,
  },

  // Animation Styles
  glowContainer: {
    position: 'absolute',
    top: -10, left: -10, right: -10, bottom: -10,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: -1,
  },
  glowTrail: {
    width: '40%',
    height: 10,
    backgroundColor: colors.accent,
    borderRadius: 5,
    shadowColor: colors.accent,
    shadowRadius: 15,
    shadowOpacity: 1,
    elevation: 10,
    position: 'absolute',
    top: 0,
  },
  
  inputArea: {
    paddingBottom: Platform.OS === 'ios' ? spacing.xl : spacing.lg,
    paddingTop: spacing.md,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.white,
    borderTopWidth: borders.thick,
    borderColor: colors.black,
  },
  inputRow: { flexDirection: 'row', alignItems: 'center' },
  invitePlus: { padding: spacing.md },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.black,
    paddingHorizontal: spacing.md,
    paddingVertical: 2,
    ...shadows.brutalSmall,
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
    marginLeft: spacing.sm,
  },
  lockArea: { padding: spacing.xl, alignItems: 'center', backgroundColor: colors.accent, borderTopWidth: 3, borderColor: colors.black },
  lockText: { fontFamily: typography.family.black, color: colors.black, fontSize: 13, letterSpacing: 1 },
  lockSub: { fontFamily: typography.family.bold, color: colors.black, fontSize: 10, textAlign: 'center', marginTop: 8, opacity: 0.7 },
  profileBtn: { marginTop: 16, backgroundColor: colors.black, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 4 },
  profileBtnText: { fontFamily: typography.family.black, color: colors.white, fontSize: 10 },
});



