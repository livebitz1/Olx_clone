import { supabase } from '@/lib/supabase';

export async function fetchMessagesForChat(chatId: string) {
  const { data, error } = await supabase
    .from('message')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}

export function subscribeToChatMessages(chatId: string, onNewMessage: (msg: any) => void) {
  return supabase
    .channel(`realtime-message-${chatId}`)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'message', filter: `chat_id=eq.${chatId}` },
      (payload) => {
        if (payload.eventType === 'INSERT') {
          onNewMessage(payload.new);
        }
      }
    )
    .subscribe();
}

export async function sendMessageToChat(chatId: string, senderId: string, text: string) {
  const { error } = await supabase.from('message').insert({
    chat_id: chatId,
    sender_id: senderId,
    text,
    created_at: new Date().toISOString(),
  });
  return error;
}
