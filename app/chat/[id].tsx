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

// Message type
type Message = {
  id: string;
  text: string;
  sender: 'user' | 'seller';
  timestamp: Date;
};

// Mock seller data
const MOCK_SELLERS: Record<string, { name: string; avatar: any; isOnline: boolean; lastSeen: string }> = {
  s1: {
    name: 'Alex Johnson',
    avatar: require('../../assets/images/partial-react-logo.png'),
    isOnline: true,
    lastSeen: 'Online',
  },
  s2: {
    name: 'Maya Lee',
    avatar: require('../../assets/images/icon.png'),
    isOnline: false,
    lastSeen: 'Last seen 2h ago',
  },
  // User IDs from profile pages
  seller1: {
    name: 'Alex Johnson',
    avatar: require('../../assets/images/partial-react-logo.png'),
    isOnline: true,
    lastSeen: 'Online',
  },
  seller2: {
    name: 'Maya Lee',
    avatar: require('../../assets/images/icon.png'),
    isOnline: false,
    lastSeen: 'Last seen 2h ago',
  },
  seller3: {
    name: 'Sam Carter',
    avatar: require('../../assets/images/react-logo.png'),
    isOnline: true,
    lastSeen: 'Online',
  },
  default: {
    name: 'Seller',
    avatar: require('../../assets/images/react-logo.png'),
    isOnline: true,
    lastSeen: 'Online',
  },
};

// Mock initial messages
const INITIAL_MESSAGES: Message[] = [
  {
    id: 'm1',
    text: 'Hi! Is this item still available?',
    sender: 'user',
    timestamp: new Date(Date.now() - 3600000 * 2),
  },
  {
    id: 'm2',
    text: "Yes, it is still available! Are you interested?",
    sender: 'seller',
    timestamp: new Date(Date.now() - 3600000 * 1.5),
  },
  {
    id: 'm3',
    text: "Yes, I am. What is the best price you can offer?",
    sender: 'user',
    timestamp: new Date(Date.now() - 3600000),
  },
  {
    id: 'm4',
    text: 'I can do $50 off if you pick it up today. Does that work for you?',
    sender: 'seller',
    timestamp: new Date(Date.now() - 1800000),
  },
  {
    id: 'm5',
    text: 'That sounds great! Where can I meet you?',
    sender: 'user',
    timestamp: new Date(Date.now() - 900000),
  },
];

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
const MessageBubble: React.FC<{ message: Message }> = ({ message }) => {
  const isUser = message.sender === 'user';

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
        {formatTime(message.timestamp)}
      </Text>
    </View>
  );
};

// Chat Header Component
const ChatHeader: React.FC<{
  seller: typeof MOCK_SELLERS['default'];
  onBack: () => void;
}> = ({ seller, onBack }) => (
  <View style={styles.header}>
    <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
      <View style={styles.backButtonInner}>
        <Ionicons name="arrow-back" size={20} color={colors.primary} />
      </View>
    </TouchableOpacity>

    <TouchableOpacity style={styles.headerContent} activeOpacity={0.8}>
      <View style={styles.avatarContainer}>
        <Image source={seller.avatar} style={styles.avatar} />
        {seller.isOnline && <View style={styles.onlineIndicator} />}
      </View>
      <View style={styles.headerInfo}>
        <Text style={styles.headerName}>{seller.name}</Text>
        <View style={styles.statusRow}>
          {seller.isOnline && <View style={styles.statusDot} />}
          <Text style={[styles.headerStatus, seller.isOnline && styles.headerStatusOnline]}>
            {seller.lastSeen}
          </Text>
        </View>
      </View>
    </TouchableOpacity>

    <View style={styles.headerActions}>
      <TouchableOpacity style={styles.headerIconButton} activeOpacity={0.7}>
        <Ionicons name="videocam-outline" size={22} color={colors.text} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.headerIconButton} activeOpacity={0.7}>
        <Ionicons name="call-outline" size={20} color={colors.text} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.headerIconButton} activeOpacity={0.7}>
        <Ionicons name="ellipsis-vertical" size={20} color={colors.text} />
      </TouchableOpacity>
    </View>
  </View>
);

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
  const sellerId = (params as any).id ?? 'default';

  const seller = MOCK_SELLERS[sellerId] ?? MOCK_SELLERS.default;

  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  // Handle send message
  const handleSend = () => {
    if (inputText.trim().length === 0) return;

    const newMessage: Message = {
      id: `m${Date.now()}`,
      text: inputText.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputText('');

    // Simulate seller response after a delay
    setTimeout(() => {
      const responses = [
        "Got it! Let me check on that for you.",
        "Sure, I will get back to you shortly.",
        "Thanks for your message!",
        "That works for me!",
        "I will send you the details soon.",
      ];
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];

      const sellerReply: Message = {
        id: `m${Date.now() + 1}`,
        text: randomResponse,
        sender: 'seller',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, sellerReply]);
    }, 1500);
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <ChatHeader seller={seller} onBack={handleBack} />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* Chat Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          {/* Date Divider */}
          <View style={styles.dateDivider}>
            <Text style={styles.dateDividerText}>Today</Text>
          </View>

          {messages.map((message) => (
            <MessageBubble key={message.id} message={message} />
          ))}

          <View style={{ height: 16 }} />
        </ScrollView>

        {/* Message Input */}
        <MessageInput value={inputText} onChangeText={setInputText} onSend={handleSend} />
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
