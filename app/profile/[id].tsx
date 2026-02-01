import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/OTPAuthContext';
import { fetchConversations } from '@/lib/chat';
import { checkIsFollowing, followUser, unfollowUser, getFollowersCount } from '@/lib/follow';

const { width } = Dimensions.get('window');
const GRID_ITEM_SIZE = (width - 48) / 3;

// Color scheme
const colors = {
  background: '#F8FAFC',
  white: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  border: '#E2E8F0',
  primary: '#2563EB',
  primaryLight: '#EFF6FF',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
};

// Types
type User = {
  id: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  location: string | null;
  created_at: string;
  is_verified: boolean;
};

type Listing = {
  id: string;
  title: string;
  price: number;
  images: string[];
  is_sold: boolean;
};

// Stat Item Component
const StatItem: React.FC<{ value: string | number; label: string; onPress?: () => void }> = ({ value, label, onPress }) => (
  <TouchableOpacity style={styles.statItem} onPress={onPress} disabled={!onPress} activeOpacity={0.7}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </TouchableOpacity>
);

// Listing Grid Item Component
const ListingGridItem: React.FC<{ listing: Listing; onPress: () => void }> = ({ listing, onPress }) => {
  const imageSource = listing.images && listing.images.length > 0
    ? { uri: listing.images[0] }
    : null;

  return (
    <TouchableOpacity style={styles.gridItem} onPress={onPress} activeOpacity={0.8}>
      {imageSource ? (
        <Image source={imageSource} style={styles.gridImage} />
      ) : (
        <View style={[styles.gridImage, { backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' }]}>
          <Ionicons name="image-outline" size={24} color="#94A3B8" />
        </View>
      )}
      {listing.is_sold && (
        <View style={styles.soldBadge}>
          <Text style={styles.soldBadgeText}>SOLD</Text>
        </View>
      )}
      <View style={styles.gridItemOverlay}>
        <Text style={styles.gridPrice}>${listing.price}</Text>
      </View>
    </TouchableOpacity>
  );
};

// Main User Profile Screen
export default function UserProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const userId = (params as any).id;
  const { user: currentUser } = useAuth();

  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    activeListings: 0,
    itemsSold: 0,
  });
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  useEffect(() => {
    if (userId) {
      fetchProfileData();
    }
  }, [userId]);

  const fetchProfileData = async () => {
    setIsLoading(true);
    try {
      // 1. Fetch User Details
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userError) throw userError;
      setProfileUser(userData);

      // 2. Fetch User Listings
      const { data: postsData, error: postsError } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      const userListings = postsData || [];
      setListings(userListings);

      // 3. Calculate Stats
      const soldCount = userListings.filter((l: any) => l.is_sold).length;
      const activeCount = userListings.length - soldCount;
      setStats({
        activeListings: activeCount,
        itemsSold: soldCount,
      });

      // 4. Fetch Follow Status and Count
      if (currentUser && currentUser.id !== userId) {
        const { isFollowing } = await checkIsFollowing(currentUser.id, userId);
        setIsFollowing(isFollowing);
      }
      const { count: fCount } = await getFollowersCount(userId);
      setFollowersCount(fCount || 0);

    } catch (error) {
      console.error('Error fetching profile:', error);
      Alert.alert('Error', 'Failed to load user profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/');
    }
  };

  const handleChat = async () => {
    if (!currentUser) {
      Alert.alert('Login Required', 'Please login to chat with seller');
      return;
    }
    if (currentUser.id === userId) {
      // Chatting with self
      return;
    }

    // Attempt to find an existing chat with this user
    // Since our chat model requires a listing_id, detailed "General Chat" isn't fully supported yet
    // Strategy: Find *any* chat with this user or prompt to go to a listing
    // For now, simpler approach: if they have listings, redirect to their first active listing

    // Check for existing conversations
    const { data: convs } = await fetchConversations(currentUser.id);
    const existingChat = convs?.find((c: any) =>
      (c.buyer_id === currentUser.id && c.seller_id === userId) ||
      (c.buyer_id === userId && c.seller_id === currentUser.id)
    );

    if (existingChat) {
      router.push(`/chat/${existingChat.id}`);
    } else {
      // If no existing chat, and user has active listings, suggest visiting a listing
      if (listings.length > 0) {
        Alert.alert('Start Chat', 'Please select one of the seller\'s items to start a conversation.');
      } else {
        Alert.alert('No Items', 'This seller has no items to chat about.');
      }
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUser) {
      Alert.alert('Login Required', 'Please login to follow users');
      return;
    }
    if (isFollowLoading) return;

    // Optimistic update
    const newStatus = !isFollowing;
    setIsFollowing(newStatus);
    setFollowersCount((prev) => (newStatus ? prev + 1 : Math.max(0, prev - 1)));
    setIsFollowLoading(true);

    try {
      if (newStatus) {
        await followUser(currentUser.id, userId);
      } else {
        await unfollowUser(currentUser.id, userId);
      }
    } catch (error) {
      // Revert on error
      setIsFollowing(!newStatus);
      setFollowersCount((prev) => (!newStatus ? prev + 1 : Math.max(0, prev - 1)));
      console.error('Error toggling follow:', error);
      Alert.alert('Error', 'Failed to update follow status');
    } finally {
      setIsFollowLoading(false);
    }
  };

  const handleListingPress = (listingId: string) => {
    router.push(`/listing/${listingId}`);
  };

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!profileUser) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>User not found</Text>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={{ color: colors.primary, marginTop: 10 }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const joinDate = new Date(profileUser.created_at).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={handleBack} activeOpacity={0.7}>
          <View style={styles.backButtonInner}>
            <Ionicons name="arrow-back" size={20} color={colors.primary} />
          </View>
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>
          {profileUser.name || 'User Profile'}
        </Text>
        <TouchableOpacity style={styles.moreButton} activeOpacity={0.7}>
          <Ionicons name="ellipsis-horizontal" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.header}>
          {/* Avatar & Stats Row */}
          <View style={styles.avatarStatsRow}>
            <View style={styles.avatarWrapper}>
              {profileUser.avatar ? (
                <Image source={{ uri: profileUser.avatar }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, { backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' }]}>
                  <Ionicons name="person" size={40} color="#94A3B8" />
                </View>
              )}
              {profileUser.is_verified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                </View>
              )}
            </View>

            <View style={styles.statsRow}>
              <StatItem value={stats.activeListings} label="Listings" />
              <StatItem value={stats.itemsSold} label="Sold" />
              <StatItem
                value={followersCount}
                label="Followers"
                onPress={() => router.push({
                  pathname: '/profile/connections',
                  params: { userId: profileUser.id, tab: 'followers', name: profileUser.name }
                })}
              />
            </View>
          </View>

          {/* User Info */}
          <View style={styles.userInfo}>
            <Text style={styles.fullName}>{profileUser.name || 'Olx User'}</Text>
            {/* Username logic if needed, falling back to name or placeholder */}
            <Text style={styles.username}>@{profileUser.name?.replace(/\s+/g, '').toLowerCase() || 'user'}</Text>

            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.location}>{profileUser.location || 'Location not set'}</Text>
              <Text style={styles.joinedDate}>• Joined {joinDate}</Text>
            </View>

            {profileUser.bio && <Text style={styles.bio}>{profileUser.bio}</Text>}

            {/* Rating Placeholder (Real app would fetch from reviews table) */}
            <View style={styles.ratingContainer}>
              {[1, 2, 3, 4, 5].map((star) => (
                <Ionicons key={star} name="star-outline" size={14} color={colors.warning} />
              ))}
              <Text style={styles.ratingText}>No ratings yet</Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[
                styles.chatButton,
                currentUser?.id === userId && { backgroundColor: colors.textSecondary }
              ]}
              onPress={handleChat}
              activeOpacity={0.8}
              disabled={currentUser?.id === userId}
            >
              <Ionicons name="chatbubble-outline" size={18} color={colors.white} />
              <Text style={styles.chatButtonText}>
                {currentUser?.id === userId ? 'My Profile' : 'Chat'}
              </Text>
            </TouchableOpacity>

            {currentUser?.id !== userId && (
              <TouchableOpacity
                style={[
                  styles.followButton,
                  isFollowing && { backgroundColor: styles.container.backgroundColor, borderWidth: 1, borderColor: colors.primary }
                ]}
                onPress={handleFollowToggle}
                activeOpacity={0.8}
                disabled={isFollowLoading}
              >
                <Ionicons
                  name={isFollowing ? "person-remove-outline" : "person-add-outline"}
                  size={18}
                  color={isFollowing ? colors.primary : colors.primary}
                />
                <Text style={styles.followButtonText}>
                  {isFollowing ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Listings Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Listings</Text>
          <Text style={styles.sectionCount}>{stats.activeListings}</Text>
        </View>

        {listings.length > 0 ? (
          <View style={styles.listingsGrid}>
            {listings.map((listing) => (
              <ListingGridItem
                key={listing.id}
                listing={listing}
                onPress={() => handleListingPress(listing.id)}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={48} color={colors.textTertiary} />
            <Text style={styles.emptyStateText}>No active listings</Text>
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 20,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  moreButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // Header
  header: {
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    marginBottom: 8,
  },
  avatarStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 86,
    height: 86,
    borderRadius: 43,
    borderWidth: 3,
    borderColor: colors.border,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.white,
    borderRadius: 10,
  },
  statsRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginLeft: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // User Info
  userInfo: {
    marginBottom: 16,
  },
  fullName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  username: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  location: {
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  joinedDate: {
    fontSize: 13,
    color: colors.textTertiary,
    marginLeft: 6,
  },
  bio: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginTop: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 6,
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  chatButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  chatButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  followButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  followButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },

  // Section Header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  sectionCount: {
    fontSize: 14,
    color: colors.textSecondary,
    backgroundColor: colors.white,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },

  // Listings Grid
  listingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 6,
  },
  gridItem: {
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.white,
  },
  gridImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gridItemOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  gridPrice: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.white,
  },
  soldBadge: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: colors.danger,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  soldBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: colors.white,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 12,
  },
});
