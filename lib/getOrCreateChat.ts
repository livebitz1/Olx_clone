import { supabase } from '@/lib/supabase';

export async function getOrCreateChat(userId1: string, userId2: string) {
  // Always order user ids to avoid duplicate chats
  const [a, b] = [userId1, userId2].sort();
  console.log('[getOrCreateChat] Looking for chat between:', a, b);
  // Find existing chat where (user1_id = a AND user2_id = b) OR (user1_id = b AND user2_id = a)
  const { data: chats, error } = await supabase
    .from('chat')
    .select('*')
    .or(`and(user1_id.eq.${a},user2_id.eq.${b}),and(user1_id.eq.${b},user2_id.eq.${a})`);
  if (error) {
    console.error('[getOrCreateChat] Error:', error);
    throw error;
  }
  if (chats && chats.length > 0) {
    // Always return the oldest chat (to avoid duplicates)
    const sorted = chats.sort((c1, c2) => new Date(c1.created_at).getTime() - new Date(c2.created_at).getTime());
    console.log('[getOrCreateChat] Found existing chat:', sorted[0]);
    return sorted[0];
  }
  // If not found, create new chat
  const { data, error: insertError } = await supabase
    .from('chat')
    .insert([{ user1_id: a, user2_id: b }])
    .select()
    .single();
  if (insertError) {
    console.error('[getOrCreateChat] Insert error:', insertError);
    throw insertError;
  }
  console.log('[getOrCreateChat] Created new chat:', data);
  return data;
}
