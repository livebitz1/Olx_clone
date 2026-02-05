'use client';

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
  Animated,
  Modal,
  Pressable,
  RefreshControl,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';

// Get screen dimensions with responsive breakpoints
const { width, height } = Dimensions.get('window');

// Responsive breakpoints
const BREAKPOINTS = {
  SMALL: 480,
  MEDIUM: 768,
  LARGE: 1024,
  XLARGE: 1280,
};

// Determine device type
const isSmallScreen = width < BREAKPOINTS.SMALL;
const isMediumScreen = width >= BREAKPOINTS.SMALL && width < BREAKPOINTS.MEDIUM;
const isLargeScreen = width >= BREAKPOINTS.MEDIUM && width < BREAKPOINTS.LARGE;

// Responsive spacing function
const getResponsiveValue = (small: number, medium: number, large: number, xlarge?: number) => {
  if (isSmallScreen) return small;
  if (isMediumScreen) return medium;
  if (isLargeScreen) return large;
  return xlarge || large;
};

// Calculate number of columns based on screen width
const getNumColumns = () => {
  if (width < BREAKPOINTS.SMALL) return 1;
  if (width < BREAKPOINTS.MEDIUM) return 2;
  if (width < BREAKPOINTS.LARGE) return 3;
  return 4;
};

// Color scheme - Professional & Modern
const colors = {
  background: '#F8FAFC',
  white: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#64748B',
  textTertiary: '#94A3B8',
  border: '#E2E8F0',
  primary: '#2F80ED',
  primaryLight: '#EFF6FF',
  primaryDark: '#1E40AF',
  accent: '#8B5CF6',
  accentLight: '#F5F3FF',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  shadow: '#0F172A',
  gradient1: '#3B82F6',
  gradient2: '#8B5CF6',
};

// Mock Categories Data with proper icons
const categoriesData = [
  { id: '1', name: 'Electronics', icon: 'laptop-outline', color: '#3B82F6' },
  { id: '2', name: 'Fashion', icon: 'shirt-outline', color: '#EC4899' },
  { id: '3', name: 'Home', icon: 'home-outline', color: '#F59E0B' },
  { id: '4', name: 'Sports', icon: 'fitness-outline', color: '#10B981' },
  { id: '5', name: 'Books', icon: 'book-outline', color: '#8B5CF6' },
  { id: '6', name: 'Vehicles', icon: 'car-outline', color: '#EF4444' },
  { id: '7', name: 'Toys', icon: 'game-controller-outline', color: '#F97316' },
];

// Price range options for filter
const PRICE_RANGES = [
  { id: 'any', label: 'Any Price', min: 0, max: Infinity },
  { id: 'under100', label: 'Under $100', min: 0, max: 100 },
  { id: '100to500', label: '$100 - $500', min: 100, max: 500 },
  { id: '500to1000', label: '$500 - $1,000', min: 500, max: 1000 },
  { id: 'over1000', label: 'Over $1,000', min: 1000, max: Infinity },
];

// Condition options for filter
const CONDITIONS = [
  { id: 'any', label: 'Any Condition' },
  { id: 'new', label: 'New' },
  { id: 'like_new', label: 'Like New' },
  { id: 'used', label: 'Used' },
];

// Location options for filter
const LOCATIONS = [
  { id: 'any', label: 'All Locations' },
  { id: 'san_francisco', label: 'San Francisco, CA' },
  { id: 'austin', label: 'Austin, TX' },
  { id: 'new_york', label: 'New York, NY' },
  { id: 'los_angeles', label: 'Los Angeles, CA' },
];

// Filter Modal Component
const FilterModal: React.FC<{
  visible: boolean;
  onClose: () => void;
  filters: {
    category: string | null;
    priceRange: string;
    condition: string;
    location: string;
  };
  onApplyFilters: (filters: {
    category: string | null;
    priceRange: string;
    condition: string;
    location: string;
  }) => void;
}> = ({ visible, onClose, filters, onApplyFilters }) => {
  const [tempFilters, setTempFilters] = useState(filters);

  React.useEffect(() => {
    setTempFilters(filters);
  }, [filters, visible]);

  const handleApply = () => {
    onApplyFilters(tempFilters);
    onClose();
  };

  const handleReset = () => {
    const defaultFilters = {
      category: null,
      priceRange: 'any',
      condition: 'any',
      location: 'any',
    };
    setTempFilters(defaultFilters);
  };

  const activeFiltersCount = [
    tempFilters.category !== null,
    tempFilters.priceRange !== 'any',
    tempFilters.condition !== 'any',
    tempFilters.location !== 'any',
  ].filter(Boolean).length;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={filterStyles.container}>
        {/* Header */}
        <View style={filterStyles.header}>
          <TouchableOpacity onPress={onClose} style={filterStyles.closeButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={filterStyles.headerTitle}>Filters</Text>
          <TouchableOpacity onPress={handleReset}>
            <Text style={filterStyles.resetText}>Reset</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={filterStyles.content} showsVerticalScrollIndicator={false}>
          {/* Category Filter */}
          <View style={filterStyles.section}>
            <Text style={filterStyles.sectionTitle}>Category</Text>
            <View style={filterStyles.optionsGrid}>
              <TouchableOpacity
                style={[
                  filterStyles.optionChip,
                  tempFilters.category === null && filterStyles.optionChipSelected,
                ]}
                onPress={() => setTempFilters({ ...tempFilters, category: null })}
              >
                <Text
                  style={[
                    filterStyles.optionText,
                    tempFilters.category === null && filterStyles.optionTextSelected,
                  ]}
                >
                  All
                </Text>
              </TouchableOpacity>
              {categoriesData.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    filterStyles.optionChip,
                    tempFilters.category === cat.id && filterStyles.optionChipSelected,
                  ]}
                  onPress={() => setTempFilters({ ...tempFilters, category: cat.id })}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={16}
                    color={tempFilters.category === cat.id ? colors.white : cat.color}
                    style={{ marginRight: 6 }}
                  />
                  <Text
                    style={[
                      filterStyles.optionText,
                      tempFilters.category === cat.id && filterStyles.optionTextSelected,
                    ]}
                  >
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Price Range Filter */}
          <View style={filterStyles.section}>
            <Text style={filterStyles.sectionTitle}>Price Range</Text>
            <View style={filterStyles.optionsList}>
              {PRICE_RANGES.map((range) => (
                <TouchableOpacity
                  key={range.id}
                  style={[
                    filterStyles.listOption,
                    tempFilters.priceRange === range.id && filterStyles.listOptionSelected,
                  ]}
                  onPress={() => setTempFilters({ ...tempFilters, priceRange: range.id })}
                >
                  <Text
                    style={[
                      filterStyles.listOptionText,
                      tempFilters.priceRange === range.id && filterStyles.listOptionTextSelected,
                    ]}
                  >
                    {range.label}
                  </Text>
                  {tempFilters.priceRange === range.id && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Condition Filter */}
          <View style={filterStyles.section}>
            <Text style={filterStyles.sectionTitle}>Condition</Text>
            <View style={filterStyles.optionsRow}>
              {CONDITIONS.map((cond) => (
                <TouchableOpacity
                  key={cond.id}
                  style={[
                    filterStyles.conditionChip,
                    tempFilters.condition === cond.id && filterStyles.conditionChipSelected,
                  ]}
                  onPress={() => setTempFilters({ ...tempFilters, condition: cond.id })}
                >
                  <Text
                    style={[
                      filterStyles.conditionText,
                      tempFilters.condition === cond.id && filterStyles.conditionTextSelected,
                    ]}
                  >
                    {cond.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Location Filter */}
          <View style={filterStyles.section}>
            <Text style={filterStyles.sectionTitle}>Location</Text>
            <View style={filterStyles.optionsList}>
              {LOCATIONS.map((loc) => (
                <TouchableOpacity
                  key={loc.id}
                  style={[
                    filterStyles.listOption,
                    tempFilters.location === loc.id && filterStyles.listOptionSelected,
                  ]}
                  onPress={() => setTempFilters({ ...tempFilters, location: loc.id })}
                >
                  <View style={filterStyles.locationOption}>
                    <Ionicons
                      name="location-outline"
                      size={18}
                      color={tempFilters.location === loc.id ? colors.primary : colors.textSecondary}
                    />
                    <Text
                      style={[
                        filterStyles.listOptionText,
                        tempFilters.location === loc.id && filterStyles.listOptionTextSelected,
                      ]}
                    >
                      {loc.label}
                    </Text>
                  </View>
                  {tempFilters.location === loc.id && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        {/* Apply Button */}
        <View style={filterStyles.footer}>
          <TouchableOpacity style={filterStyles.applyButton} onPress={handleApply}>
            <Text style={filterStyles.applyButtonText}>
              Apply Filters {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ''}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

// Filter Modal Styles
const filterStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  resetText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 12,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  optionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  optionTextSelected: {
    color: colors.white,
  },
  optionsList: {
    gap: 8,
  },
  listOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  listOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  listOptionText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.text,
  },
  listOptionTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
  locationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  conditionChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  conditionChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  conditionText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  conditionTextSelected: {
    color: colors.white,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
    paddingBottom: 32,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  applyButton: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
});

// Search Bar Component
const SearchBar: React.FC<{
  onSearchChange: (t: string) => void;
  onFilterPress: () => void;
  hasActiveFilters: boolean;
}> = ({ onSearchChange, onFilterPress, hasActiveFilters }) => (
  <View style={styles.searchContainer}>
    <View style={styles.searchInputWrapper}>
      <Ionicons name="search" size={20} color={colors.textTertiary} />
      <TextInput
        style={styles.searchInput}
        placeholder="Search for anything..."
        placeholderTextColor={colors.textTertiary}
        onChangeText={onSearchChange}
      />
      <TouchableOpacity style={styles.filterButton} onPress={onFilterPress}>
        <Ionicons name="options-outline" size={20} color={colors.primary} />
        {hasActiveFilters && <View style={styles.filterBadge} />}
      </TouchableOpacity>
    </View>
  </View>
);

// Category Card Component
const CategoryCard: React.FC<{
  category: typeof categoriesData[number];
  onPress: () => void;
  isSelected: boolean;
}> = ({ category, onPress, isSelected }) => {
  return (
    <TouchableOpacity
      style={[
        styles.categoryCard,
        isSelected && styles.categoryCardSelected
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View
        style={[
          styles.categoryIconContainer,
          {
            backgroundColor: isSelected ? category.color : `${category.color}15`, // 15 = ~8% opacity
            borderColor: isSelected ? category.color : `${category.color}30`,
            borderWidth: isSelected ? 0 : 1,
          }
        ]}
      >
        <Ionicons
          name={category.icon as any}
          size={getResponsiveValue(24, 26, 28)}
          color={isSelected ? colors.white : category.color}
        />
      </View>
      <Text style={[
        styles.categoryName,
        isSelected && { color: category.color, fontWeight: '700' }
      ]}>
        {category.name}
      </Text>
    </TouchableOpacity>
  );
};

// Featured Listing Card Component
const ListingCard: React.FC<{ listing: any; onPress: () => void }> = ({ listing, onPress }) => {
  const [isFavorited, setIsFavorited] = useState(false);
  const [aspectRatio, setAspectRatio] = useState(1); // Default square

  // Determine image source: if images[0] is a string, treat as remote URL
  const firstImage = listing.images && listing.images[0];
  const imageSource = firstImage
    ? (typeof firstImage === 'string'
      ? { uri: firstImage }
      : firstImage)
    : null;

  // New: Fetch image aspect ratio to show whole image and adjust card size
  useEffect(() => {
    if (typeof firstImage === 'string') {
      Image.getSize(firstImage, (width, height) => {
        if (width && height) {
          setAspectRatio(width / height);
        }
      });
    }
  }, [firstImage]);

  // Check if listing is new (less than 12 hours old)
  const isNew = React.useMemo(() => {
    if (!listing.created_at) return false;
    const created = new Date(listing.created_at);
    const now = new Date();
    const diffInHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
    return diffInHours < 12;
  }, [listing.created_at]);

  return (
    <TouchableOpacity style={styles.listingCard} onPress={onPress} activeOpacity={0.9}>
      {/* Product Image Container */}
      <View style={[styles.imageContainer, { aspectRatio }]}>
        {imageSource ? (
          <Image source={imageSource} style={styles.productImage} resizeMode="contain" />
        ) : (
          <View style={[styles.productImage, styles.imagePlaceholder]}>
            <Ionicons name="image-outline" size={48} color={colors.textTertiary} />
          </View>
        )}
        {/* Favorite Button */}
        <TouchableOpacity
          style={styles.favoriteButton}
          activeOpacity={0.7}
          onPress={() => setIsFavorited(!isFavorited)}
        >
          <Ionicons
            name={isFavorited ? "heart" : "heart-outline"}
            size={20}
            color={isFavorited ? colors.danger : colors.white}
          />
        </TouchableOpacity>
      </View>
      {/* Product Details */}
      <View style={styles.listingDetails}>
        <View style={styles.priceRow}>
          <Text style={styles.priceText}>₹{Number(listing.price).toLocaleString()}</Text>
          {isNew && (
            <View style={styles.conditionBadge}>
              <Text style={styles.conditionText}>New</Text>
            </View>
          )}
        </View>

        <Text style={styles.listingTitle} numberOfLines={2}>
          {listing.title}
        </Text>

        <View style={styles.locationContainer}>
          <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
          <Text style={styles.locationText} numberOfLines={1}>
            {listing.location}
          </Text>
        </View>

        {/* Footer with Seller Info */}
        <View style={styles.listingFooter}>
          <View style={styles.sellerInfo}>
            {listing.user && listing.user.avatar ? (
              <Image
                source={{ uri: listing.user.avatar }}
                style={styles.sellerAvatar}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.sellerAvatar, styles.imagePlaceholder]}>
                <Ionicons name="person-circle-outline" size={32} color={colors.textTertiary} />
              </View>
            )}
            {/* Show seller name instead of rating */}
            <Text style={styles.sellerName} numberOfLines={1}>
              {listing.user && listing.user.name ? listing.user.name : 'Seller'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

// Quick Stats Component
const QuickStats: React.FC = () => (
  <View style={styles.statsContainer}>
    <View style={styles.statCard}>
      <View style={styles.statIconContainer}>
        <Ionicons name="pricetags" size={20} color={colors.primary} />
      </View>
      <Text style={styles.statValue}>2.4k+</Text>
      <Text style={styles.statLabel}>Active Listings</Text>
    </View>

    <View style={styles.statCard}>
      <View style={styles.statIconContainer}>
        <Ionicons name="people" size={20} color={colors.success} />
      </View>
      <Text style={styles.statValue}>15k+</Text>
      <Text style={styles.statLabel}>Happy Users</Text>
    </View>

    <View style={styles.statCard}>
      <View style={styles.statIconContainer}>
        <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
      </View>
      <Text style={styles.statValue}>98%</Text>
      <Text style={styles.statLabel}>Success Rate</Text>
    </View>
  </View>
);

// Banner Data
const BANNER_DATA = [
  {
    id: '1',
    title: 'Discover Premium Deals',
    subtitle: 'Find the best items in your neighborhood',
    image: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?q=80&w=2574&auto=format&fit=crop',
    buttonText: 'Explore Now',
  },
  {
    id: '2',
    title: 'Sell & Earn Money',
    subtitle: 'Turn your unused items into cash today',
    image: 'https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?q=80&w=2574&auto=format&fit=crop',
    buttonText: 'Start Selling',
  },
  {
    id: '3',
    title: 'Upgrade Your Tech',
    subtitle: 'Latest gadgets at unbeatable prices',
    image: 'https://images.unsplash.com/photo-1498049381929-2818839580bf?q=80&w=2574&auto=format&fit=crop',
    buttonText: 'View Gadgets',
  },
  {
    id: '4',
    title: 'Fashion Trends',
    subtitle: 'Refresh your wardrobe for the season',
    image: 'https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=2574&auto=format&fit=crop',
    buttonText: 'Shop Fashion',
  },
];

// Promotional Banner Carousel Component
const PromoBanner: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState(0);

  const onViewableItemsChanged = React.useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index || 0);
    }
  }).current;

  const viewabilityConfig = React.useRef({
    viewAreaCoveragePercentThreshold: 50,
  }).current;

  const renderItem = ({ item }: { item: { id: string; title: string; subtitle: string; image: string; buttonText: string } }) => (
    <View style={{ width: width, paddingHorizontal: 16 }}>
      <View style={styles.promoBanner}>
        <Image
          source={{ uri: item.image }}
          style={styles.bannerImage}
          resizeMode="cover"
        />
        <View style={styles.bannerOverlay}>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>{item.title}</Text>
            <Text style={styles.bannerSubtitle}>{item.subtitle}</Text>
          </View>
          <TouchableOpacity style={styles.bannerButton} activeOpacity={0.8}>
            <Text style={styles.bannerButtonText}>{item.buttonText}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.bannerContainer}>
      <FlatList
        data={BANNER_DATA}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        scrollEventThrottle={32}
      />

      {/* Pagination Dots */}
      <View style={styles.paginationContainer}>
        {BANNER_DATA.map((_, index) => (
          <View
            key={index}
            style={[
              styles.paginationDot,
              activeIndex === index ? styles.activeDot : styles.inactiveDot,
            ]}
          />
        ))}
      </View>
    </View>
  );
};

import { useAuth } from '@/contexts/OTPAuthContext';

// Main Home Screen Component
export default function HomeScreen() {
  const router = useRouter();
  const { user: authUser } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState({
    category: null as string | null,
    priceRange: 'any',
    condition: 'any',
    location: 'any',
  });
  const [listings, setListings] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (authUser) {
      // The authUser from OTPAuthContext might already have the avatar!
      if (authUser.avatar) {
        setUserProfile(authUser);
      } else {
        fetchUserProfile();
      }
    }
  }, [authUser]);

  const fetchUserProfile = async () => {
    if (!authUser) return;
    console.log('[Home] Fetching profile for:', authUser.id);
    const { data, error } = await supabase
      .from('users')
      .select('avatar, name')
      .eq('id', authUser.id)
      .single();

    if (error) {
      console.error('[Home] Error fetching profile:', error);
    }

    if (data) {
      console.log('[Home] Profile data fetched:', data);
      setUserProfile(data);
    }
  };

  useEffect(() => {
    // Subscribe to realtime changes in the posts table
    const channel = supabase
      .channel('realtime-posts')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'posts' },
        (payload) => {
          // Refetch posts on any insert, update, or delete
          fetchListings();
        }
      )
      .subscribe();

    // Initial fetch
    fetchListings();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Move fetchListings outside useEffect so it can be called from realtime handler
  const fetchListings = async () => {
    // Only set full loading state if not refreshing
    if (!refreshing) setIsLoading(true);

    const { data, error } = await supabase
      .from('posts')
      .select('*, user:users(id, name, avatar)')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('[Home] Error fetching posts:', error.message);
      setListings([]);
    } else {
      setListings((data || []).map((item) => ({
        ...item,
        createdAt: item.created_at,
        user: item.user,
      })));
    }
    setIsLoading(false);
    setRefreshing(false);
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchListings();
    if (authUser) fetchUserProfile();
  }, [authUser]);

  const handleCategoryPress = (categoryId: string) => {
    setSelectedCategory(selectedCategory === categoryId ? null : categoryId);
  };

  const handleListingPress = (listing: any) => {
    router.push(`/listing/${listing.id}`);
  };

  const handleApplyFilters = (newFilters: typeof filters) => {
    setFilters(newFilters);
    // Also sync category selection with filter modal category
    setSelectedCategory(newFilters.category);
  };

  const hasActiveFilters =
    filters.category !== null ||
    filters.priceRange !== 'any' ||
    filters.condition !== 'any' ||
    filters.location !== 'any';

  // Parse price from string like "$7,500" to number, or handle number/undefined
  const parsePrice = (priceVal: any): number => {
    if (typeof priceVal === 'number') return priceVal;
    if (typeof priceVal === 'string') return parseFloat(priceVal.replace(/[^0-9.]/g, '')) || 0;
    return 0;
  };

  // Get price range bounds
  const getPriceRange = (rangeId: string) => {
    const range = PRICE_RANGES.find((r) => r.id === rangeId);
    return range ? { min: range.min, max: range.max } : { min: 0, max: Infinity };
  };

  // Get location filter value
  const getLocationFilter = (locId: string) => {
    const loc = LOCATIONS.find((l) => l.id === locId);
    return loc && loc.id !== 'any' ? loc.label.toLowerCase() : null;
  };

  // Enhanced filtering with all filter options
  const filtered = listings.filter((p) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      p.title.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
      p.location.toLowerCase().includes(searchQuery.trim().toLowerCase());

    // Category filter (use filters.category if set, otherwise selectedCategory for horizontal scroll selection)
    const activeCategory = filters.category || selectedCategory;
    let matchesCategory = !activeCategory;

    if (activeCategory) {
      const categoryObj = categoriesData.find((c) => c.id === activeCategory);
      if (categoryObj) {
        // 1. Primary check: Database Category Column (Exact or Case-insensitive)
        if (p.category && (p.category === categoryObj.name || p.category.toLowerCase() === categoryObj.name.toLowerCase())) {
          matchesCategory = true;
        }
        // 2. Secondary check: Title keywords (Fallback for legacy data or if category is missing)
        else if (!p.category) {
          const title = p.title.toLowerCase();
          if (activeCategory === '1' && (title.includes('electronic') || title.includes('phone') || title.includes('laptop'))) matchesCategory = true;
          else if (activeCategory === '2' && (title.includes('shirt') || title.includes('fashion') || title.includes('cloth'))) matchesCategory = true;
          else if (activeCategory === '3' && (title.includes('home') || title.includes('sofa') || title.includes('furniture'))) matchesCategory = true;
          else if (activeCategory === '6' && (title.includes('car') || title.includes('vehicle'))) matchesCategory = true;
        }
      }
    }

    // Price range filter
    const priceRange = getPriceRange(filters.priceRange);
    const productPrice = parsePrice(p.price);
    const matchesPrice = productPrice >= priceRange.min && productPrice <= priceRange.max;

    // Location filter
    const locationFilter = getLocationFilter(filters.location);
    const matchesLocation = !locationFilter || p.location.toLowerCase().includes(locationFilter);

    return matchesSearch && matchesCategory && matchesPrice && matchesLocation;
  });

  const numColumns = getNumColumns();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      {/* Top Navigation Bar */}
      <View style={styles.topNav}>
        <View style={styles.navLeft}>
          <TouchableOpacity style={styles.profileButton} onPress={() => router.push('/profile')}>
            {userProfile?.avatar ? (
              <Image
                source={{ uri: userProfile.avatar }}
                style={styles.profileImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.profileImage, styles.profilePlaceholder]}>
                <Ionicons name="person" size={20} color={colors.textSecondary} />
              </View>
            )}
          </TouchableOpacity>
          <View>
            <Text style={styles.navGreeting}>Hello, {userProfile?.name?.split(' ')[0] || 'User'} 👋</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={14} color={colors.primary} />
              <Text style={styles.navLocation}>Jaipur, India</Text>
            </View>
          </View>
        </View>
        <View style={styles.navRight}>
          <TouchableOpacity
            style={styles.navIconButton}
            onPress={() => router.push('/notifications')}
          >
            <Ionicons name="notifications-outline" size={24} color={colors.text} />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navIconButton}>
            <Ionicons name="heart-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]} // Android
            tintColor={colors.primary} // iOS
            title="Pull to refresh" // iOS
            titleColor={colors.textSecondary}
          />
        }
      >
        {/* Search Bar */}
        <SearchBar
          onSearchChange={setSearchQuery}
          onFilterPress={() => setFilterModalVisible(true)}
          hasActiveFilters={hasActiveFilters}
        />

        {/* Filter Modal */}
        <FilterModal
          visible={filterModalVisible}
          onClose={() => setFilterModalVisible(false)}
          filters={filters}
          onApplyFilters={handleApplyFilters}
        />

        {/* Promotional Banner */}
        <PromoBanner />

        {/* Categories Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Categories</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesScroll}
            contentContainerStyle={styles.categoriesContent}
            scrollEventThrottle={16}
          >
            {categoriesData.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                onPress={() => handleCategoryPress(category.id)}
                isSelected={selectedCategory === category.id}
              />
            ))}
          </ScrollView>
        </View>



        {/* Featured Listings Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="flame" size={22} color={colors.danger} />
              <Text style={styles.sectionTitle}>
                {selectedCategory ? 'Filtered Items' : 'Trending Now'}
              </Text>
            </View>
          </View>

          <View style={[
            styles.listingsGrid,
            {
              flexDirection: numColumns === 1 ? 'column' : 'row',
              flexWrap: numColumns > 1 ? 'wrap' : 'nowrap'
            }
          ]}>
            {filtered.map((listing) => (
              <View
                key={listing.id}
                style={[
                  styles.listingCardWrapper,
                  { width: numColumns === 1 ? '100%' : `${100 / numColumns}%` }
                ]}
              >
                <ListingCard
                  listing={listing}
                  onPress={() => handleListingPress(listing)}
                />
              </View>
            ))}

          </View>

          {filtered.length === 0 && !refreshing && (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={64} color={colors.textTertiary} />
              <Text style={styles.emptyStateText}>No listings found</Text>
              <Text style={styles.emptyStateSubtext}>Try adjusting your search or filters</Text>
            </View>
          )}
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Floating Action Button (FAB) */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(tabs)/post')}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={32} color="#FFF" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },

  // Top Navigation
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  navLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  profileButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: colors.primary,
    padding: 2, // Space for border
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 20,
  },
  profilePlaceholder: {
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navGreeting: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  navLocation: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  navRight: {
    flexDirection: 'row',
    gap: 8,
  },
  navIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notificationDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
    borderWidth: 1.5,
    borderColor: colors.white,
  },

  // Search Bar
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  searchInputWrapper: {
    height: 52,
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 15,
    color: colors.text,
    fontWeight: '500',
  },
  filterButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.danger,
  },

  // Promo Banner
  bannerContainer: {
    marginBottom: 24,
  },
  promoBanner: {
    // marginHorizontal: 16, // Moved to renderItem padding
    height: 280,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    backgroundColor: colors.primary, // Fallback
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0,0,0,0.3)', // Overlay for better text readability
  },
  bannerContent: {
    flex: 1,
    marginRight: 16,
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.white,
    marginBottom: 6,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  bannerButton: {
    backgroundColor: colors.white,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 25,
    shadowColor: 'black',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  bannerButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text, // Dark text on white button
  },

  // Pagination
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12, // Space between banner and dots
    gap: 8,
  },
  paginationDot: {
    height: 8,
    borderRadius: 4,
  },
  activeDot: {
    width: 24,
    backgroundColor: colors.primary,
  },
  inactiveDot: {
    width: 8,
    backgroundColor: colors.border,
  },

  // Stats Container
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.white,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Section Container
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  seeAllLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '700',
  },

  // Categories
  categoriesScroll: {
    flexGrow: 0,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  categoryCard: {
    alignItems: 'center',
    width: 80,
  },
  categoryCardSelected: {
    transform: [{ scale: 1.05 }],
  },
  categoryIconContainer: {
    width: 68,
    height: 68,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    // Removed default border & shadow for modern look, handled dynamically
  },
  categoryName: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Listings Grid
  listingsGrid: {
    paddingHorizontal: 16,
    gap: 16,
  },
  listingCardWrapper: {
    paddingHorizontal: 4,
    marginBottom: 16,
  },
  listingCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },

  // Listing Image
  imageContainer: {
    position: 'relative',
    width: '100%',
    backgroundColor: colors.background,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Listing Details
  listingDetails: {
    padding: 16,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  priceText: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.primary,
  },
  conditionBadge: {
    backgroundColor: colors.accentLight,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  conditionText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.accent,
  },
  listingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    lineHeight: 22,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
  },
  locationText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
    flex: 1,
  },
  listingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sellerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sellerAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  sellerName: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
  },

  // Empty State
  emptyState: {
    paddingVertical: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  // Bottom Spacing
  bottomSpacing: {
    height: 100,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FF4D00',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    zIndex: 1000,
  },
});