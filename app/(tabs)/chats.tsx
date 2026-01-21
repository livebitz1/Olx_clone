import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { fetchUserChats } from '@/lib/chat';
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
  online: '#10B981',
  unread: '#EF4444',
};

// Main Chats Screen
export default function ChatsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const userId = user?.id || '';
  const [conversations, setConversations] = useState<any[]>([]);

  useEffect(() => {
    if (!userId) return;
    fetchUserChats(userId).then(({ data }) => {
      if (data) setConversations(data);
    });
  }, [userId]);

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
        {conversations.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={64} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptySubtitle}>
              Start a conversation by messaging a seller
            </Text>
          </View>
        ) : (
          // Group by otherUser.id to ensure only one card per user
          Object.values(
            conversations.reduce((acc, conv) => {
              if (!conv.otherUser?.id) return acc;
              // If this user already exists, keep the one with the latest message
              if (!acc[conv.otherUser.id] || (conv.lastMessage && acc[conv.otherUser.id].lastMessage && new Date(conv.lastMessage.created_at) > new Date(acc[conv.otherUser.id].lastMessage.created_at))) {
                acc[conv.otherUser.id] = conv;
              }
              return acc;
            }, {})
          ).map((conv: any) => (
            <TouchableOpacity
              key={conv.chatId}
              style={styles.chatCard}
              onPress={() => handleChatPress(conv.chatId)}
              activeOpacity={0.8}
            >
              <View style={styles.cardRow}>
                <Image
                  source={conv.otherUser?.avatar ? { uri: conv.otherUser.avatar } : require('../../assets/images/react-logo.png')}
                  style={styles.cardAvatar}
                />
                <View style={styles.cardContent}>
                  <Text style={styles.cardName}>{conv.otherUser?.name || conv.otherUser?.id}</Text>
                  <Text style={styles.cardText} numberOfLines={1} ellipsizeMode="tail">
                    {conv.lastMessage?.text || 'No messages yet'}
                  </Text>
                </View>
                <View style={styles.cardMeta}>
                  {conv.lastMessage?.created_at && (
                    <Text style={styles.cardTime}>
                      {new Date(conv.lastMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))
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

  // Chat Card
  chatCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    marginHorizontal: 12,
    marginVertical: 6,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: colors.primaryLight,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  cardName: {
    fontWeight: '700',
    fontSize: 16,
    color: colors.text,
  },
  cardText: {
    color: colors.textSecondary,
    fontSize: 14,
    marginTop: 2,
  },
  cardMeta: {
    alignItems: 'flex-end',
    marginLeft: 8,
  },
  cardTime: {
    color: colors.textTertiary,
    fontSize: 12,
  },
});
