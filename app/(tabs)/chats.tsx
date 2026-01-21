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
import { fetchMessages, subscribeToChat, sendMessage } from '@/lib/chat';

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
  const [messages, setMessages] = useState<any[]>([]);
  const [chatId, setChatId] = useState<string | null>(null); // Set this from route params or context
  const [input, setInput] = useState('');
  const [userId, setUserId] = useState<string>(''); // Set this from auth context or Firebase

  useEffect(() => {
    if (!chatId) return;
    // Initial fetch
    fetchMessages(chatId).then(({ data }) => {
      if (data) setMessages(data);
    });
    // Subscribe to realtime updates
    const channel = subscribeToChat(chatId, (newMsg: any) => {
      setMessages((prev) => [...prev, newMsg]);
    });
    return () => {
      if (channel) {
        // Unsubscribe on unmount
        channel.unsubscribe();
      }
    };
  }, [chatId]);

  const handleSend = async () => {
    if (!input.trim() || !chatId || !userId) return;
    const error = await sendMessage(chatId, userId, input.trim());
    if (!error) setInput('');
    else alert('Failed to send message');
  };

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
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubbles-outline" size={64} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptySubtitle}>
              Start a conversation by messaging a seller
            </Text>
          </View>
        ) : (
          messages.map((msg) => (
            <View key={msg.id} style={{ padding: 12 }}>
              <Text style={{ fontWeight: 'bold' }}>{msg.sender_id}</Text>
              <Text>{msg.text}</Text>
              <Text style={{ color: colors.textTertiary, fontSize: 12 }}>
                {msg.created_at}
              </Text>
            </View>
          ))
        )}
      </ScrollView>
      {/* Chat input bar */}
      <View
        style={{
          flexDirection: 'row',
          padding: 12,
          backgroundColor: colors.white,
          borderTopWidth: 1,
          borderTopColor: colors.border,
        }}
      >
        <TextInput
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 8,
          }}
          value={input}
          onChangeText={setInput}
          placeholder="Type a message..."
        />
        <TouchableOpacity
          onPress={handleSend}
          style={{
            marginLeft: 8,
            backgroundColor: colors.primary,
            borderRadius: 20,
            padding: 10,
          }}
        >
          <Ionicons name="send" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>
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
});
