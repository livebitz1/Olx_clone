import { supabase } from './supabase';

/**
 * Follow a user
 */
export const followUser = async (followerId: string, followingId: string) => {
    const { error } = await supabase
        .from('follows')
        .insert({
            follower_id: followerId,
            following_id: followingId,
        });

    return { error };
};

/**
 * Unfollow a user
 */
export const unfollowUser = async (followerId: string, followingId: string) => {
    const { error } = await supabase
        .from('follows')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', followingId);

    return { error };
};

/**
 * Check if a user is following another user
 */
export const checkIsFollowing = async (followerId: string, followingId: string) => {
    const { data, error } = await supabase
        .from('follows')
        .select('*')
        .eq('follower_id', followerId)
        .eq('following_id', followingId)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found", which is not an error here
        console.error('Error checking follow status:', error);
    }

    return { isFollowing: !!data, error: error && error.code !== 'PGRST116' ? error : null };
};

/**
 * Get follower count for a user
 */
export const getFollowersCount = async (userId: string) => {
    const { count, error } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId);

    return { count: count || 0, error };
};

/**
 * Get following count for a user
 */
export const getFollowingCount = async (userId: string) => {
    const { count, error } = await supabase
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId);

    return { count: count || 0, error };
};
