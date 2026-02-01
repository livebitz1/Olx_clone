import { supabase } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Chat, Message } from '@/lib/types';

// Simple UUID v4 generator to avoid crypto polyfill issues
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

/**
 * Fetch all conversations for a specific user
 */
export const fetchConversations = async (userId: string) => {
  // We want chats where the user is either the buyer or the seller
  const { data, error } = await supabase
    .from('chats')
    .select(`
      *,
      buyer:users!buyer_id(id, name, avatar),
      seller:users!seller_id(id, name, avatar),
      listing:posts(id, title, images, price),
      messages(id, text, created_at, sender_id)
    `)
    .or(`buyer_id.eq.${userId},seller_id.eq.${userId}`)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('Error fetching conversations:', error);
    return { data: [], error };
  }

  // Process data to get the last message efficiently
  // Note: Supabase might return all messages if we don't limit properly in the select
  // For production, we'd use a more optimized query or a trigger to update 'last_message' on the chat row.
  // Here we sort messages in JS if needed.
  const processedData = data.map((chat: any) => {
    const sortedMessages = (chat.messages || []).sort(
      (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return {
      ...chat,
      lastMessage: sortedMessages[0] || null,
    };
  });

  return { data: processedData, error: null };
};

/**
 * Get details for a single chat
 */
export const getChat = async (chatId: string) => {
  const { data, error } = await supabase
    .from('chats')
    .select(`
      *,
      buyer:users!buyer_id(id, name, avatar),
      seller:users!seller_id(id, name, avatar),
      listing:posts(id, title, images, price)
    `)
    .eq('id', chatId)
    .single();

  return { data, error };
};

/**
 * Get an existing chat or create a new one
 */
export const getOrCreateChat = async (buyerId: string, sellerId: string, listingId: string) => {
  // First, check if a chat already exists between these two users (in either direction)
  // We want to reuse the conversation regardless of who was the original buyer/seller
  const { data: existingChat, error: fetchError } = await supabase
    .from('chats')
    .select('id')
    .or(`and(buyer_id.eq.${buyerId},seller_id.eq.${sellerId}),and(buyer_id.eq.${sellerId},seller_id.eq.${buyerId})`)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingChat && existingChat.id) {
    // Chat exists! Optionally update the listing_id to reflect the latest item of interest
    // and bump the updated_at timestamp.
    const { error: updateError } = await supabase
      .from('chats')
      .update({
        listing_id: listingId,
        updated_at: new Date().toISOString()
      })
      .eq('id', existingChat.id);

    if (updateError) {
      console.error('Error updating existing chat:', updateError);
    }

    return { chatId: existingChat.id, error: null };
  }

  // If not found, create a new chat
  // Generate a UUID for the new chat
  const chatId = generateUUID();

  const { data: newChat, error: createError } = await supabase
    .from('chats')
    .insert({
      id: chatId,
      buyer_id: buyerId,
      seller_id: sellerId,
      listing_id: listingId,
      updated_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (createError) {
    console.error('Error creating chat:', createError);
    return { chatId: null, error: createError };
  }

  return { chatId: newChat.id, error: null };
};

/**
 * Fetch messages for a specific chat
 */
export const fetchMessages = async (chatId: string) => {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true });

  return { data, error };
};

/**
 * Send a message and update the chat's updated_at timestamp
 */
export const sendMessage = async (chatId: string, senderId: string, text: string) => {
  // 1. Insert message
  const { error: msgError } = await supabase.from('messages').insert({
    id: generateUUID(),
    chat_id: chatId,
    sender_id: senderId,
    text,
    created_at: new Date().toISOString(),
  });

  if (msgError) {
    console.error('Error sending message:', msgError);
    return msgError;
  }

  // 2. Update chat timestamp
  const { error: chatError } = await supabase
    .from('chats')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', chatId);

  if (chatError) {
    console.error('Error updating chat timestamp:', chatError);
  }

  return null;
};

/**
 * Subscribe to realtime messages for a specific chat
 */
export const subscribeToChat = (chatId: string, onNewMessage: (msg: any) => void): RealtimeChannel => {
  return supabase
    .channel(`chat:${chatId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `chat_id=eq.${chatId}`,
      },
      (payload) => {
        onNewMessage(payload.new);
      }
    )
    .subscribe();
};
