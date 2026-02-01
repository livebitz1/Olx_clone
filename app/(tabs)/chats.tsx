import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { fetchConversations } from '@/lib/chat';
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

// Helper to format date
const formatTime = (dateString: string) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  // If less than 24 hours, show time
  if (diff < 24 * 60 * 60 * 1000 && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  // If yesterday
  if (diff < 48 * 60 * 60 * 1000 && date.getDate() === now.getDate() - 1) {
    return 'Yesterday';
  }
  // Otherwise date
  return date.toLocaleDateString();
};

export default function ChatsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadConversations = useCallback(async () => {
    if (!user?.id) return;
    setIsLoading(true);
    const { data, error } = await fetchConversations(user.id);
    if (!error && data) {
      setConversations(data);
    }
    setIsLoading(false);
  }, [user?.id]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (user?.id) {
      const { data, error } = await fetchConversations(user.id);
      if (!error && data) {
        setConversations(data);
      }
    }
    setRefreshing(false);
  }, [user?.id]);

  // Reload when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadConversations();
    }, [loadConversations])
  );

  const handleChatPress = (chatId: string) => {
    router.push(`/chat/${chatId}`);
  };

  const getOtherParticipant = (chat: any) => {
    if (!user) return { name: 'User', avatar: null };
    // If I am the buyer, show seller. If I am seller, show buyer.
    if (chat.buyer_id === user.id) {
      return chat.seller || { name: 'Seller', avatar: null };
    }
    return chat.buyer || { name: 'Buyer', avatar: null };
  };

  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>Please log in to view messages</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {isLoading && !refreshing ? (
          <View style={{ padding: 20 }}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : conversations.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={64} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptySubtitle}>
              Start a conversation by messaging a seller on their listing.
            </Text>
          </View>
        ) : (
          conversations.map((chat) => {
            const otherUser = getOtherParticipant(chat);
            const lastMsg = chat.lastMessage;

            return (
              <TouchableOpacity
                key={chat.id}
                style={styles.chatItem}
                onPress={() => handleChatPress(chat.id)}
                activeOpacity={0.7}
              >
                {/* Avatar */}
                <View style={styles.avatarContainer}>
                  {otherUser.avatar ? (
                    <Image source={{ uri: otherUser.avatar }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, { backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center' }]}>
                      <Ionicons name="person" size={24} color={colors.textSecondary} />
                    </View>
                  )}
                </View>

                {/* Content */}
                <View style={styles.chatContent}>
                  <View style={styles.chatHeader}>
                    <Text style={styles.userName} numberOfLines={1}>
                      {otherUser.name || 'Unknown User'}
                    </Text>
                    {lastMsg && (
                      <Text style={styles.timeText}>
                        {formatTime(lastMsg.created_at)}
                      </Text>
                    )}
                  </View>

                  <View style={styles.chatFooter}>
                    <Text style={styles.lastMessage} numberOfLines={1}>
                      {lastMsg ? lastMsg.text : 'No messages yet'}
                    </Text>
                    {/* Listing Title Hint */}
                    {chat.listing && (
                      <View style={styles.listingBadge}>
                        <Ionicons name="pricetag-outline" size={10} color={colors.textSecondary} />
                        <Text style={styles.listingTitle} numberOfLines={1}>
                          {chat.listing.title}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          })
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
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 20,
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
  chatItem: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarContainer: {
    marginRight: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  chatContent: {
    flex: 1,
    justifyContent: 'center',
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  timeText: {
    fontSize: 12,
    color: colors.textSecondary,
  },
  chatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
    marginRight: 8,
  },
  listingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 4,
    maxWidth: 100,
  },
  listingTitle: {
    fontSize: 10,
    color: colors.textSecondary,
  },
});
