import { supabase } from '@/lib/supabase';

export const subscribeToChat = (chatId, onNewMessage) => {
  // Subscribe to realtime changes in the message table for a specific chat
  const channel = supabase
    .channel(`realtime-chat-${chatId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'message', filter: `chat_id=eq.${chatId}` },
      (payload) => {
        if (payload.eventType === 'INSERT') {
          onNewMessage(payload.new);
        }
      }
    )
    .subscribe();

  return channel;
};

export const sendMessage = async (chatId, senderId, text) => {
  const { error } = await supabase.from('message').insert({
    chat_id: chatId,
    sender_id: senderId,
    text,
    created_at: new Date().toISOString(),
  });
  return error;
};

export const fetchMessages = async (chatId) => {
  const { data, error } = await supabase
    .from('message')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });
  return { data, error };
};

// Fetch all chats for a user, with latest message and other user info
export const fetchUserChats = async (userId) => {
  // 1. Get all chats where user is a participant
  const { data: chats, error: chatError } = await supabase
    .from('chat')
    .select('*')
    .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
    .order('updated_at', { ascending: false });
  if (chatError) return { data: null, error: chatError };
  if (!chats || chats.length === 0) return { data: [], error: null };

  // 2. For each chat, fetch latest message and other user info
  const chatDetails = await Promise.all(
    chats.map(async (chat) => {
      // Latest message
      const { data: messages } = await supabase
        .from('message')
        .select('*')
        .eq('chat_id', chat.id)
        .order('created_at', { ascending: false })
        .limit(1);
      const lastMessage = messages && messages[0];
      // Other user
      const otherUserId = chat.user1_id === userId ? chat.user2_id : chat.user1_id;
      const { data: users } = await supabase
        .from('users')
        .select('id, name, avatar')
        .eq('id', otherUserId)
        .limit(1);
      const otherUser = users && users[0];
      return {
        chatId: chat.id,
        otherUser,
        lastMessage,
        updated_at: chat.updated_at,
      };
    })
  );
  // Sort by chat updated_at (already sorted, but just in case)
  chatDetails.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
  return { data: chatDetails, error: null };
};
