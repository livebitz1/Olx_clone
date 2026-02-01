import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

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

// User type
type User = {
  id: string;
  username: string;
  fullName: string;
  avatar: any;
  bio: string;
  location: string;
  joinedDate: string;
  isVerified: boolean;
  stats: {
    activeListings: number;
    itemsSold: number;
    rating: number;
    reviews: number;
  };
  listings: Listing[];
};

type Listing = {
  id: string;
  title: string;
  price: string;
  image: any;
  isSold: boolean;
};

// Mock users database
const USERS: Record<string, User> = {
  alexjohnson: {
    id: 'seller1',
    username: 'alexjohnson',
    fullName: 'Alex Johnson',
    avatar: require('../../assets/images/partial-react-logo.png'),
    bio: 'Car enthusiast & gadget lover. Quality guaranteed! 🚗',
    location: 'Austin, TX',
    joinedDate: 'January 2022',
    isVerified: true,
    stats: {
      activeListings: 12,
      itemsSold: 56,
      rating: 4.8,
      reviews: 78,
    },
    listings: [
      { id: 'l1', title: 'Compact Car', price: '$7,500', image: require('../../assets/images/react-logo.png'), isSold: false },
      { id: 's2', title: 'Bike Helmet', price: '$45', image: require('../../assets/images/icon.png'), isSold: false },
      { id: 's3', title: 'Tool Set', price: '$80', image: require('../../assets/images/partial-react-logo.png'), isSold: false },
    ],
  },
  mayalee: {
    id: 'seller2',
    username: 'mayalee',
    fullName: 'Maya Lee',
    avatar: require('../../assets/images/icon.png'),
    bio: 'Home decor specialist. Unique finds at great prices! ✨',
    location: 'New York, NY',
    joinedDate: 'June 2021',
    isVerified: true,
    stats: {
      activeListings: 8,
      itemsSold: 89,
      rating: 4.9,
      reviews: 124,
    },
    listings: [
      { id: 'l2', title: 'Modern Sofa', price: '$250', image: require('../../assets/images/icon.png'), isSold: false },
      { id: 'm2', title: 'Table Lamp', price: '$35', image: require('../../assets/images/react-logo.png'), isSold: false },
    ],
  },
  samcarter: {
    id: 'seller3',
    username: 'samcarter',
    fullName: 'Sam Carter',
    avatar: require('../../assets/images/react-logo.png'),
    bio: 'Tech gadgets & electronics. All items tested! 📱',
    location: 'Seattle, WA',
    joinedDate: 'March 2023',
    isVerified: false,
    stats: {
      activeListings: 5,
      itemsSold: 23,
      rating: 4.5,
      reviews: 31,
    },
    listings: [
      { id: 'l3', title: 'Smartphone', price: '$420', image: require('../../assets/images/partial-react-logo.png'), isSold: false },
    ],
  },
};

// Default user if not found
const DEFAULT_USER: User = {
  id: 'default',
  username: 'seller',
  fullName: 'Seller',
  avatar: require('../../assets/images/react-logo.png'),
  bio: 'Marketplace seller',
  location: 'Unknown',
  joinedDate: 'Recently',
  isVerified: false,
  stats: {
    activeListings: 0,
    itemsSold: 0,
    rating: 0,
    reviews: 0,
  },
  listings: [],
};

// Stat Item Component
const StatItem: React.FC<{ value: string | number; label: string }> = ({ value, label }) => (
  <View style={styles.statItem}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

// Rating Stars Component
const RatingStars: React.FC<{ rating: number }> = ({ rating }) => (
  <View style={styles.ratingContainer}>
    {[1, 2, 3, 4, 5].map((star) => (
      <Ionicons
        key={star}
        name={star <= Math.floor(rating) ? 'star' : star - 0.5 <= rating ? 'star-half' : 'star-outline'}
        size={14}
        color={colors.warning}
      />
    ))}
    <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
  </View>
);

// Listing Grid Item Component
const ListingGridItem: React.FC<{ listing: Listing; onPress: () => void }> = ({ listing, onPress }) => (
  <TouchableOpacity style={styles.gridItem} onPress={onPress} activeOpacity={0.8}>
    <Image source={listing.image} style={styles.gridImage} />
    {listing.isSold && (
      <View style={styles.soldBadge}>
        <Text style={styles.soldBadgeText}>SOLD</Text>
      </View>
    )}
    <View style={styles.gridItemOverlay}>
      <Text style={styles.gridPrice}>{listing.price}</Text>
    </View>
  </TouchableOpacity>
);

// Main User Profile Screen
export default function UserProfileScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const userId = (params as any).id ?? 'default';

  // Find user by id or username
  const user = USERS[userId] ?? Object.values(USERS).find((u) => u.id === userId) ?? DEFAULT_USER;

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/');
    }
  };

  const handleChat = () => {
    router.push(`/chat/${user.id}`);
  };

  const handleListingPress = (listingId: string) => {
    router.push(`/listing/${listingId}`);
  };

  const activeListings = user.listings.filter((l) => !l.isSold);

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
        <Text style={styles.topBarTitle}>{user.username}</Text>
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
              <Image source={user.avatar} style={styles.avatar} />
              {user.isVerified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                </View>
              )}
            </View>

            <View style={styles.statsRow}>
              <StatItem value={user.stats.activeListings} label="Listings" />
              <StatItem value={user.stats.itemsSold} label="Sold" />
              <StatItem value={user.stats.reviews} label="Reviews" />
            </View>
          </View>

          {/* User Info */}
          <View style={styles.userInfo}>
            <Text style={styles.fullName}>{user.fullName}</Text>
            <Text style={styles.username}>@{user.username}</Text>

            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.location}>{user.location}</Text>
              <Text style={styles.joinedDate}>• Joined {user.joinedDate}</Text>
            </View>

            <Text style={styles.bio}>{user.bio}</Text>

            <RatingStars rating={user.stats.rating} />
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.chatButton} onPress={handleChat} activeOpacity={0.8}>
              <Ionicons name="chatbubble-outline" size={18} color={colors.white} />
              <Text style={styles.chatButtonText}>Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.followButton} activeOpacity={0.8}>
              <Ionicons name="person-add-outline" size={18} color={colors.primary} />
              <Text style={styles.followButtonText}>Follow</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Listings Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Listings</Text>
          <Text style={styles.sectionCount}>{activeListings.length}</Text>
        </View>

        {activeListings.length > 0 ? (
          <View style={styles.listingsGrid}>
            {activeListings.map((listing) => (
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
