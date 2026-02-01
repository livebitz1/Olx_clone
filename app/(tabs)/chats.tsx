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
  TextInput,
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
  const [searchQuery, setSearchQuery] = useState('');

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

  // Filter conversations based on search
  const filteredConversations = conversations.filter(chat => {
    const otherUser = getOtherParticipant(chat);
    return otherUser.name?.toLowerCase().includes(searchQuery.toLowerCase());
  });

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
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchWrapper}>
          <Ionicons name="search" size={20} color="#94A3B8" />
          <TextInput
            placeholder="Search messages..."
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563EB" />
        }
      >
        {isLoading && !refreshing ? (
          <View style={{ padding: 20 }}>
            <ActivityIndicator size="large" color="#2563EB" />
          </View>
        ) : filteredConversations.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>
              {searchQuery ? 'No results found' : 'No messages yet'}
            </Text>
            <Text style={styles.emptySubtitle}>
              {searchQuery ? 'Try a different keyword' : 'Start a conversation by messaging a seller on their listing.'}
            </Text>
          </View>
        ) : (
          filteredConversations.map((chat) => {
            const otherUser = getOtherParticipant(chat);
            const lastMsg = chat.lastMessage;

            // Mock unread logic: If last message exists and is NOT from me. 
            // In a real app, we'd check a 'read' status flag from DB.
            const isUnread = lastMsg && lastMsg.sender_id !== user.id;

            return (
              <TouchableOpacity
                key={chat.id}
                style={[styles.chatItem, isUnread && styles.unreadItem]}
                onPress={() => handleChatPress(chat.id)}
                activeOpacity={0.7}
              >
                {/* Avatar */}
                <View style={styles.avatarContainer}>
                  {otherUser.avatar ? (
                    <Image source={{ uri: otherUser.avatar }} style={styles.avatar} />
                  ) : (
                    <View style={[styles.avatar, { backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' }]}>
                      <Text style={{ fontSize: 20, color: '#64748B', fontWeight: 'bold' }}>
                        {otherUser.name?.[0]?.toUpperCase() || '?'}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Content */}
                <View style={styles.chatContent}>
                  <View style={styles.chatHeader}>
                    <Text style={[styles.userName, isUnread && styles.unreadText]} numberOfLines={1}>
                      {otherUser.name || 'Unknown User'}
                    </Text>
                    {lastMsg && (
                      <Text style={[styles.timeText, isUnread && styles.unreadTime]}>
                        {formatTime(lastMsg.created_at)}
                      </Text>
                    )}
                  </View>

                  <View style={styles.chatFooter}>
                    <Text style={[styles.lastMessage, isUnread && styles.unreadMessage]} numberOfLines={1}>
                      {lastMsg ? lastMsg.text : 'No messages yet'}
                    </Text>
                  </View>
                  {chat.listing && !isUnread && (
                    <View style={styles.listingBadge}>
                      <Ionicons name="pricetag" size={12} color="#64748B" />
                      <Text style={styles.listingTitle} numberOfLines={1}>
                        {chat.listing.title}
                      </Text>
                    </View>
                  )}
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
    backgroundColor: '#F8FAFC',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 4,
    zIndex: 10,
  },
  searchWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 50,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  searchInput: {
    flex: 1,
    marginLeft: 12,
    fontSize: 16,
    color: '#0F172A',
    fontWeight: '500',
    height: '100%',
    textAlignVertical: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 120,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#334155',
    marginTop: 20,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#94A3B8',
    marginTop: 10,
    textAlign: 'center',
    lineHeight: 24,
  },
  chatItem: {
    flexDirection: 'row',
    padding: 20, // Increased padding
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 20,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 }, // Softer shadow
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  unreadItem: {
    backgroundColor: '#FFFFFF',
    borderColor: 'transparent', // No border distinction
  },
  avatarContainer: {
    marginRight: 16,
    justifyContent: 'center',
  },
  avatar: {
    width: 56, // Slightly smaller avatar for better proportion
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F1F5F9',
  },
  chatContent: {
    flex: 1,
    justifyContent: 'center',
    paddingVertical: 2,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  userName: {
    fontSize: 16, // Refined font size
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
    marginRight: 8,
    letterSpacing: -0.3,
  },
  unreadText: {
    color: '#0F172A',
    fontWeight: '800', // Only bolder text for unread
  },
  timeText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  unreadTime: {
    color: '#2563EB',
    fontWeight: '600',
  },
  chatFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  lastMessage: {
    fontSize: 14,
    color: '#64748B',
    flex: 1,
    lineHeight: 20,
  },
  unreadMessage: {
    color: '#334155',
    fontWeight: '600',
  },
  listingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC', // Very subtle badge
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    maxWidth: 120,
    marginTop: 8, // Moved below text
    alignSelf: 'flex-start',
  },
  listingTitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#64748B',
    marginLeft: 6,
  },
});
