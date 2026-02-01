import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { fetchMessages, getChat, sendMessage, subscribeToChat } from '@/lib/chat';
import { useAuth } from '@/contexts/OTPAuthContext';

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
const formatTime = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Message Bubble Component
const MessageBubble = ({ message, isUser }: { message: any; isUser: boolean }) => {
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
        {formatTime(message.created_at)}
      </Text>
    </View>
  );
};

export default function ChatScreen() {
  const { id } = useLocalSearchParams();
  const chatId = Array.isArray(id) ? id[0] : id;
  const router = useRouter();
  const { user } = useAuth();

  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [chatDetails, setChatDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);

  // Load chat details and initial messages
  useEffect(() => {
    if (!chatId || !user?.id) return;

    const loadData = async () => {
      setLoading(true);

      // 1. Get Chat Participants
      const { data: chatData, error: chatError } = await getChat(chatId);
      if (chatData) {
        setChatDetails(chatData);
      }

      // 2. Get Messages
      const { data: msgsData, error: msgsError } = await fetchMessages(chatId);
      if (msgsData) {
        setMessages(msgsData);
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: false }), 100);
      }

      setLoading(false);
    };

    loadData();

    // 3. Subscribe
    const channel = subscribeToChat(chatId, (newMsg) => {
      setMessages((prev) => {
        // Dedup just in case
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev, newMsg];
      });
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    });

    return () => {
      channel.unsubscribe();
    };
  }, [chatId, user?.id]);

  const handleSend = async () => {
    if (!inputText.trim() || !user?.id || !chatId) return;

    const textPayload = inputText.trim();
    setInputText(''); // Clear immediately for UX

    // Optimistic update could go here, but let's rely on fast subscription for now to stay truthful
    const error = await sendMessage(chatId, user.id, textPayload);

    if (error) {
      alert('Failed to send message');
      // If we did optimistic update, we'd revert here
    }
  };

  const getOtherParticipant = () => {
    if (!chatDetails || !user) return { name: 'Chat', avatar: null };
    if (chatDetails.buyer_id === user.id) {
      return chatDetails.seller || { name: 'Seller', avatar: null };
    }
    return chatDetails.buyer || { name: 'Buyer', avatar: null };
  };

  const otherUser = getOtherParticipant();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/(tabs)/chats');
    }
  };

  if (loading && !chatDetails) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerContent}>
          <View style={styles.avatarContainer}>
            {otherUser.avatar ? (
              <Image source={{ uri: otherUser.avatar }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' }]}>
                <Ionicons name="person" size={20} color={colors.textSecondary} />
              </View>
            )}
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>{otherUser.name || 'User'}</Text>
            {chatDetails?.listing && (
              <Text style={styles.headerLimit} numberOfLines={1}>
                Re: {chatDetails.listing.title}
              </Text>
            )}
          </View>
        </View>

        <TouchableOpacity style={styles.headerButton}>
          <Ionicons name="ellipsis-vertical" size={20} color={colors.text} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 100}
      >
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isUser={msg.sender_id === user?.id}
            />
          ))}
          <View style={{ height: 12 }} />
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          <TouchableOpacity style={styles.attachButton}>
            <Ionicons name="add" size={24} color={colors.primary} />
          </TouchableOpacity>

          <TextInput
            style={styles.textInput}
            placeholder="Type a message..."
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={1000}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              inputText.trim().length > 0 && styles.sendButtonActive
            ]}
            onPress={handleSend}
            disabled={inputText.trim().length === 0}
          >
            <Ionicons
              name="send"
              size={18}
              color={inputText.trim().length > 0 ? colors.white : colors.textTertiary}
            />
          </TouchableOpacity>
        </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 12,
  },
  backButton: {
    padding: 4,
  },
  headerButton: {
    padding: 8,
  },
  avatarContainer: {
    marginRight: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  headerLimit: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
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
    paddingVertical: 10,
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
    fontSize: 10,
    color: colors.textTertiary,
    marginTop: 4,
    marginLeft: 4,
  },
  messageTimeRight: {
    textAlign: 'right',
    marginRight: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  attachButton: {
    padding: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginHorizontal: 8,
    maxHeight: 100,
    fontSize: 15,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonActive: {
    backgroundColor: colors.primary,
  },
});
