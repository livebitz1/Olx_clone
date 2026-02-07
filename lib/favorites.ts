import { supabase } from './supabase';

// Simple UUID v4 generator to avoid crypto polyfill issues
const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

/**
 * Toggle favorite status for a post
 */
export const toggleFavorite = async (userId: string, postId: string) => {
    try {
        // Check if it's already favorited
        const { data: existing, error: checkError } = await supabase
            .from('saved_items')
            .select('id')
            .eq('user_id', userId)
            .eq('post_id', postId)
            .maybeSingle();

        if (checkError) throw checkError;

        if (existing) {
            // Unfavorite
            const { error: deleteError } = await supabase
                .from('saved_items')
                .delete()
                .eq('user_id', userId)
                .eq('post_id', postId);

            if (deleteError) throw deleteError;
            return { favorited: false, error: null };
        } else {
            // Favorite
            const { error: insertError } = await supabase
                .from('saved_items')
                .insert({
                    id: generateUUID(),
                    user_id: userId,
                    post_id: postId,
                });

            if (insertError) throw insertError;
            return { favorited: true, error: null };
        }
    } catch (error: any) {
        console.error('Error toggling favorite:', error);
        return { favorited: null, error };
    }
};

/**
 * Check if a post is favorited by a user
 */
export const isFavorited = async (userId: string, postId: string) => {
    try {
        const { data, error } = await supabase
            .from('saved_items')
            .select('id')
            .eq('user_id', userId)
            .eq('post_id', postId)
            .maybeSingle();

        if (error) throw error;
        return !!data;
    } catch (error) {
        console.error('Error checking favorite status:', error);
        return false;
    }
};

/**
 * Fetch all saved items for a user
 */
export const fetchSavedItems = async (userId: string) => {
    try {
        const { data, error } = await supabase
            .from('saved_items')
            .select(`
        id,
        created_at,
        post:posts(*)
      `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Filter out items where post might be null (if deleted)
        return { data: data.filter(item => item.post), error: null };
    } catch (error: any) {
        console.error('Error fetching saved items:', error);
        return { data: [], error };
    }
};
