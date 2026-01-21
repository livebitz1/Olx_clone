import { supabase } from '@/lib/supabase';

export async function getOrCreateChat(userId1: string, userId2: string) {
  // Always order user ids to avoid duplicate chats
  const [a, b] = [userId1, userId2].sort();
  // Try to find existing chat
  let { data: chat, error } = await supabase
    .from('chat') // Fixed to lowercase to match table name
    .select('*')
    .or(`user1_id.eq.${a},user2_id.eq.${b}`)
    .or(`user1_id.eq.${b},user2_id.eq.${a}`)
    .maybeSingle();
  if (chat) return chat;
  // If not found, create new chat
  const { data, error: insertError } = await supabase
    .from('chat') // Fixed to lowercase to match table name
    .insert([{ user1_id: a, user2_id: b }])
    .select()
    .single();
  if (insertError) throw insertError;
  return data;
}
