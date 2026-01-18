import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
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
  online: '#10B981',
  unread: '#EF4444',
};

// Mock chat conversations
const CONVERSATIONS = [
  {
    id: 's1',
    name: 'Alex Johnson',
    avatar: require('../../assets/images/partial-react-logo.png'),
    lastMessage: 'I can do $50 off if you pick it up today.',
    time: '2m ago',
    unreadCount: 2,
    isOnline: true,
    product: 'Compact Car',
  },
  {
    id: 's2',
    name: 'Maya Lee',
    avatar: require('../../assets/images/icon.png'),
    lastMessage: 'Sure, let me know when you are free.',
    time: '1h ago',
    unreadCount: 0,
    isOnline: false,
    product: 'Modern Sofa',
  },
  {
    id: 's3',
    name: 'Sam Carter',
    avatar: require('../../assets/images/react-logo.png'),
    lastMessage: 'Is the price negotiable?',
    time: '3h ago',
    unreadCount: 1,
    isOnline: true,
    product: 'Smartphone',
  },
  {
    id: 's4',
    name: 'Jordan Smith',
    avatar: require('../../assets/images/partial-react-logo.png'),
    lastMessage: 'Thanks for your interest!',
    time: 'Yesterday',
    unreadCount: 0,
    isOnline: false,
    product: 'Vintage Bicycle',
  },
];

// Chat Item Component
const ChatItem: React.FC<{
  conversation: typeof CONVERSATIONS[number];
  onPress: () => void;
}> = ({ conversation, onPress }) => (
  <TouchableOpacity style={styles.chatItem} onPress={onPress} activeOpacity={0.7}>
    <View style={styles.avatarContainer}>
      <Image source={conversation.avatar} style={styles.avatar} />
      {conversation.isOnline && <View style={styles.onlineIndicator} />}
    </View>

    <View style={styles.chatContent}>
      <View style={styles.chatHeader}>
        <Text style={styles.chatName}>{conversation.name}</Text>
        <Text style={[styles.chatTime, conversation.unreadCount > 0 && styles.chatTimeUnread]}>
          {conversation.time}
        </Text>
      </View>
      <View style={styles.chatPreview}>
        <View style={styles.productBadge}>
          <Ionicons name="pricetag" size={10} color={colors.primary} />
          <Text style={styles.productText}>{conversation.product}</Text>
        </View>
      </View>
      <Text
        style={[styles.lastMessage, conversation.unreadCount > 0 && styles.lastMessageUnread]}
        numberOfLines={1}
      >
        {conversation.lastMessage}
      </Text>
    </View>

    {conversation.unreadCount > 0 && (
      <View style={styles.unreadBadge}>
        <Text style={styles.unreadText}>{conversation.unreadCount}</Text>
      </View>
    )}
  </TouchableOpacity>
);

// Main Chats Screen
export default function ChatsScreen() {
  const router = useRouter();

  const handleChatPress = (id: string) => {
    router.push(`/chat/${id}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="search-outline" size={22} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="create-outline" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Active Conversations */}
        {CONVERSATIONS.map((conversation) => (
          <ChatItem
            key={conversation.id}
            conversation={conversation}
            onPress={() => handleChatPress(conversation.id)}
          />
        ))}

        {CONVERSATIONS.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={64} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptySubtitle}>
              Start a conversation by messaging a seller
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: colors.text,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Chat Item
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: colors.border,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.online,
    borderWidth: 2,
    borderColor: colors.white,
  },
  chatContent: {
    flex: 1,
    marginLeft: 14,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  chatTime: {
    fontSize: 12,
    color: colors.textTertiary,
    fontWeight: '500',
  },
  chatTimeUnread: {
    color: colors.primary,
    fontWeight: '600',
  },
  chatPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  productBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    gap: 4,
  },
  productText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  lastMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '400',
  },
  lastMessageUnread: {
    color: colors.text,
    fontWeight: '600',
  },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.unread,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },

  // Empty State
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
});
