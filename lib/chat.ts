import { supabase } from '@/lib/supabase';

export const subscribeToChat = (chatId, onNewMessage) => {
  // Subscribe to realtime changes in the messages table for a specific chat
  const channel = supabase
    .channel(`realtime-chat-${chatId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'messages', filter: `chat_id=eq.${chatId}` },
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
  const { error } = await supabase.from('messages').insert({
    chat_id: chatId,
    sender_id: senderId,
    text,
    created_at: new Date().toISOString(),
  });
  return error;
};

export const fetchMessages = async (chatId) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });
  return { data, error };
};
