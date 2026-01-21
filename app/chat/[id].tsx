import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { fetchMessagesForChat, subscribeToChatMessages, sendMessageToChat } from '@/lib/chatRealtime';
import { getAuth } from 'firebase/auth';
import { supabase } from '@/lib/supabase';

// Color scheme
const colors = {
  background: '#F8FAFC',
  white: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  border: '#E2E8F0',
  primary: '#2F80ED',
  primaryLight: '#EFF6FF',
  messageSent: '#2F80ED',
  messageReceived: '#F1F5F9',
  online: '#10B981',
  inputBg: '#FFFFFF',
};

// Format timestamp
const formatTime = (date: Date): string => {
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const formattedHours = hours % 12 || 12;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
  return `${formattedHours}:${formattedMinutes} ${ampm}`;
};

// Message Bubble Component
const MessageBubble: React.FC<{ message: any }> = ({ message }) => {
  const isUser = message.sender_id === getAuth().currentUser?.uid;

  return (
    <View
      style={[
        styles.messageBubbleContainer,
        isUser ? styles.messageBubbleContainerRight : styles.messageBubbleContainerLeft,
      ]}
    >
      <View
        style={[
          styles.messageBubble,
          isUser ? styles.messageBubbleSent : styles.messageBubbleReceived,
        ]}
      >
        <Text style={[styles.messageText, isUser && styles.messageTextSent]}>
          {message.text}
        </Text>
      </View>
      <Text style={[styles.messageTime, isUser && styles.messageTimeRight]}>
        {formatTime(new Date(message.created_at))}
      </Text>
    </View>
  );
};

// Message Input Component
const MessageInput: React.FC<{
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
}> = ({ value, onChangeText, onSend }) => {
  const canSend = value.trim().length > 0;

  return (
    <View style={styles.inputContainer}>
      <TouchableOpacity style={styles.attachButton}>
        <Ionicons name="attach" size={24} color={colors.textSecondary} />
      </TouchableOpacity>

      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.textInput}
          placeholder="Type a message..."
          placeholderTextColor={colors.textTertiary}
          value={value}
          onChangeText={onChangeText}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity style={styles.emojiButton}>
          <Ionicons name="happy-outline" size={22} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.sendButton, canSend && styles.sendButtonActive]}
        onPress={onSend}
        disabled={!canSend}
      >
        <Ionicons name="send" size={20} color={canSend ? colors.white : colors.textTertiary} />
      </TouchableOpacity>
    </View>
  );
};

// Main Chat Screen
export default function ChatScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const chatId = (params as any).id;
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);
  const userId = getAuth().currentUser?.uid;
  const [seller, setSeller] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const initialFetched = useRef(false);

  // Fetch chat and seller info
  useEffect(() => {
    if (!chatId || !userId) return;
    (async () => {
      // Get chat row
      const { data: chat } = await supabase.from('chat').select('*').eq('id', chatId).single();
      if (!chat) return;
      // Determine seller id (the other user)
      const sellerId = chat.user1_id === userId ? chat.user2_id : chat.user1_id;
      // Fetch seller info
      const { data: sellerData } = await supabase.from('users').select('id, name, avatar').eq('id', sellerId).single();
      setSeller(sellerData);
    })();
  }, [chatId, userId]);

  // Fetch and subscribe to messages
  useEffect(() => {
    if (!chatId) return;
    setLoading(true);
    let isMounted = true;
    fetchMessagesForChat(chatId)
      .then((data) => {
        if (isMounted) setMessages(data || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    // Subscribe to new messages via sockets
    const channel = subscribeToChatMessages(chatId, (msg) => {
      console.log('[Realtime] New message received via socket:', msg);
      setMessages((prev) => {
        // Deduplicate by id
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });
    // Clean up socket subscription on unmount
    return () => {
      isMounted = false;
      if (channel) channel.unsubscribe();
    };
  }, [chatId]);

  useEffect(() => {
    console.log('[Chat] Messages state after fetch/subscribe:', messages);
  }, [messages]);

  // Always sort messages by created_at
  const sortedMessages = [...messages].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  console.log('Sorted messages for render:', sortedMessages);

  // Scroll to bottom on new messages
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  // Handle send message
  const handleSend = async () => {
    if (!inputText.trim() || !chatId || !userId) return;
    setInputText('');
    const error = await sendMessageToChat(chatId, userId, inputText.trim());
    console.log('Send message:', { chatId, userId, text: inputText.trim(), error });
    if (error) alert('Failed to send message');
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/');
    }
  };

  // TEMP: Debug - fetch and log all messages in the table
  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from('message').select('*');
      if (error) {
        console.error('[Chat][DEBUG] Error fetching all messages:', error);
      } else {
        console.log('[Chat][DEBUG] All messages in table:', data);
      }
    })();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Enhanced ChatHeader with real seller info */}
      {seller && (
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton} activeOpacity={0.7}>
            <View style={styles.backButtonInner}>
              <Ionicons name="arrow-back" size={20} color={colors.primary} />
            </View>
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <View style={styles.avatarContainer}>
              <Image source={seller.avatar ? { uri: seller.avatar } : require('../../assets/images/react-logo.png')} style={styles.avatar} />
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.headerName}>{seller.name || 'User'}</Text>
              {/* You can add online status here if you track it */}
            </View>
          </View>
        </View>
      )}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Text style={{ color: colors.textTertiary }}>Loading messages...</Text>
          </View>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={{ paddingVertical: 12 }}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {sortedMessages.map((msg) => (
              <MessageBubble key={msg.id || msg.created_at} message={msg} />
            ))}
          </ScrollView>
        )}
        <MessageInput
          value={inputText}
          onChangeText={setInputText}
          onSend={handleSend}
        />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 4,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: colors.border,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.online,
    borderWidth: 2,
    borderColor: colors.white,
  },
  headerInfo: {
    marginLeft: 12,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.online,
    marginRight: 5,
  },
  headerStatus: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  headerStatusOnline: {
    color: colors.online,
    fontWeight: '500',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 2,
  },
  headerIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Messages
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  dateDivider: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateDividerText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textTertiary,
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },

  // Message Bubble
  messageBubbleContainer: {
    marginBottom: 8,
    maxWidth: '80%',
  },
  messageBubbleContainerLeft: {
    alignSelf: 'flex-start',
  },
  messageBubbleContainerRight: {
    alignSelf: 'flex-end',
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  messageBubbleSent: {
    backgroundColor: colors.messageSent,
    borderBottomRightRadius: 4,
  },
  messageBubbleReceived: {
    backgroundColor: colors.messageReceived,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
    color: colors.text,
  },
  messageTextSent: {
    color: colors.white,
  },
  messageTime: {
    fontSize: 11,
    color: colors.textTertiary,
    marginTop: 4,
    marginLeft: 4,
  },
  messageTimeRight: {
    textAlign: 'right',
    marginRight: 4,
  },

  // Input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  },
  attachButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.background,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 44,
    maxHeight: 120,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    maxHeight: 100,
    paddingTop: 0,
    paddingBottom: 0,
  },
  emojiButton: {
    marginLeft: 8,
    padding: 4,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});
