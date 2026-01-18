'use client';

import React, { useState } from 'react';
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
  SafeAreaView,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { PRODUCTS, Product } from '../data/products';
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
  { id: '8', name: 'More', icon: 'apps-outline', color: '#6366F1' },
];

// Search Bar Component
const SearchBar: React.FC<{ onSearchChange: (t: string) => void }> = ({ onSearchChange }) => (
  <View style={styles.searchContainer}>
    <View style={styles.searchInputWrapper}>
      <Ionicons name="search" size={20} color={colors.textTertiary} />
      <TextInput
        style={styles.searchInput}
        placeholder="Search for anything..."
        placeholderTextColor={colors.textTertiary}
        onChangeText={onSearchChange}
      />
      <TouchableOpacity style={styles.filterButton}>
        <Ionicons name="options-outline" size={20} color={colors.primary} />
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
            backgroundColor: isSelected ? category.color : colors.white,
            borderColor: isSelected ? category.color : colors.border,
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
        isSelected && { color: category.color }
      ]}>
        {category.name}
      </Text>
    </TouchableOpacity>
  );
};

// Featured Listing Card Component
const ListingCard: React.FC<{ listing: Product; onPress: () => void }> = ({ listing, onPress }) => {
  const [isFavorited, setIsFavorited] = useState(false);

  return (
    <TouchableOpacity style={styles.listingCard} onPress={onPress} activeOpacity={0.9}>
      {/* Product Image Container */}
      <View style={styles.imageContainer}>
        {listing.images && listing.images[0] ? (
          <Image source={listing.images[0]} style={styles.productImage} resizeMode="cover" />
        ) : (
          <View style={[styles.productImage, styles.imagePlaceholder]}>
            <Ionicons name="image-outline" size={48} color={colors.textTertiary} />
          </View>
        )}
        
        {/* Featured Badge */}
        <View style={styles.featuredBadge}>
          <Ionicons name="star" size={12} color="#FFF" />
          <Text style={styles.featuredText}>Featured</Text>
        </View>

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
          <Text style={styles.priceText}>{listing.price}</Text>
          <View style={styles.conditionBadge}>
            <Text style={styles.conditionText}>New</Text>
          </View>
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
            <Image 
              source={require('../../assets/images/partial-react-logo.png')} 
              style={styles.sellerAvatar}
            />
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={12} color={colors.warning} />
              <Text style={styles.ratingText}>4.8</Text>
            </View>
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

// Promotional Banner Component
const PromoBanner: React.FC = () => (
  <View style={styles.promoBanner}>
    <View style={styles.promoContent}>
      <View style={styles.promoIcon}>
        <Ionicons name="gift" size={24} color={colors.white} />
      </View>
      <View style={styles.promoText}>
        <Text style={styles.promoTitle}>Special Offer!</Text>
        <Text style={styles.promoSubtitle}>Get 20% off on your first purchase</Text>
      </View>
    </View>
    <TouchableOpacity style={styles.promoButton}>
      <Text style={styles.promoButtonText}>Claim Now</Text>
      <Ionicons name="arrow-forward" size={14} color={colors.primary} />
    </TouchableOpacity>
  </View>
);

// Main Home Screen Component
export default function HomeScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleCategoryPress = (categoryId: string) => {
    setSelectedCategory(selectedCategory === categoryId ? null : categoryId);
  };

  const handleListingPress = (listing: Product) => {
    router.push(`/listing/${listing.id}`);
  };

  // Simple local filtering (search + category)
  const filtered = PRODUCTS.filter((p) => {
    const matchesSearch =
      searchQuery.trim() === '' ||
      p.title.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
      p.location.toLowerCase().includes(searchQuery.trim().toLowerCase());

    const matchesCategory =
      !selectedCategory ||
      (selectedCategory === '6' && p.title.toLowerCase().includes('car')) ||
      (selectedCategory === '3' && p.title.toLowerCase().includes('sofa')) ||
      (selectedCategory === '2' && !p.title.toLowerCase().includes('car') && !p.title.toLowerCase().includes('sofa'));

    return matchesSearch && matchesCategory;
  });

  const numColumns = getNumColumns();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.white} />

      {/* Top Navigation Bar */}
      <View style={styles.topNav}>
        <View style={styles.navLeft}>
          <TouchableOpacity style={styles.menuButton}>
            <Ionicons name="menu" size={24} color={colors.text} />
          </TouchableOpacity>
          <View>
            <Text style={styles.navGreeting}>Hello, User 👋</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={14} color={colors.primary} />
              <Text style={styles.navLocation}>Jaipur, India</Text>
            </View>
          </View>
        </View>
        <View style={styles.navRight}>
          <TouchableOpacity style={styles.navIconButton}>
            <Ionicons name="notifications-outline" size={24} color={colors.text} />
            <View style={styles.notificationDot} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navIconButton}>
            <Ionicons name="chatbubble-outline" size={22} color={colors.text} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
      >
        {/* Search Bar */}
        <SearchBar onSearchChange={setSearchQuery} />

        {/* Promotional Banner */}
        <PromoBanner />

        {/* Categories Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Categories</Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.seeAllLink}>See All</Text>
            </TouchableOpacity>
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

        {/* Quick Stats */}
        <QuickStats />

        {/* Featured Listings Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="flame" size={22} color={colors.danger} />
              <Text style={styles.sectionTitle}>
                {selectedCategory ? 'Filtered Items' : 'Trending Now'}
              </Text>
            </View>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.seeAllLink}>View All →</Text>
            </TouchableOpacity>
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

          {filtered.length === 0 && (
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
  menuButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  },

  // Promo Banner
  promoBanner: {
    marginHorizontal: 16,
    marginBottom: 20,
    padding: 16,
    borderRadius: 16,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  promoContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  promoIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  promoText: {
    flex: 1,
  },
  promoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
    marginBottom: 2,
  },
  promoSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '500',
  },
  promoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.white,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  promoButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
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
    width: 64,
    height: 64,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
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
    height: 200,
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
  featuredBadge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.warning,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  featuredText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.white,
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
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    color: colors.text,
    fontWeight: '700',
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
    height: 40,
  },
});