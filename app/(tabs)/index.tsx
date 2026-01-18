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
} from 'react-native';
import { useRouter } from 'expo-router';
import { PRODUCTS, Product } from '../data/products';
import {
  Smartphone,
  Shirt,
  Home,
  Zap,
  Book,
  Car,
  Search,
  MapPin,
  Star,
  Heart,
  ChevronRight,
} from 'lucide-react-native';

// Get screen dimensions with responsive breakpoints
const { width, height } = Dimensions.get('window');

// Responsive breakpoints
const BREAKPOINTS = {
  SMALL: 480,
  MEDIUM: 768,
  LARGE: 1024,
  XLARGE: 1280,
};

// Determine device type and orientation
const isSmallScreen = width < BREAKPOINTS.SMALL;
const isMediumScreen = width >= BREAKPOINTS.SMALL && width < BREAKPOINTS.MEDIUM;
const isLargeScreen = width >= BREAKPOINTS.MEDIUM && width < BREAKPOINTS.LARGE;
const isXLargeScreen = width >= BREAKPOINTS.LARGE;
const isTablet = width > 600;

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
  background: '#fafbfc',
  white: '#ffffff',
  text: '#0f172a',
  textSecondary: '#64748b',
  textTertiary: '#94a3b8',
  border: '#e2e8f0',
  primary: '#0f766e',
  primaryLight: '#f0fdfa',
  accent: '#06b6d4',
  accentLight: '#ecf9fb',
  success: '#16a34a',
  warning: '#ea580c',
  shadow: '#00000008',
};

// Mock Categories Data
const categoriesData = [
  { id: '1', name: 'Electronics', icon: Smartphone, color: '#dc2626' },
  { id: '2', name: 'Fashion', icon: Shirt, color: '#7c3aed' },
  { id: '3', name: 'Home', icon: Home, color: '#f59e0b' },
  { id: '4', name: 'Sports', icon: Zap, color: '#10b981' },
  { id: '5', name: 'Books', icon: Book, color: '#6366f1' },
  { id: '6', name: 'Vehicles', icon: Car, color: '#f97316' },
];

// Search Bar Component
const SearchBar: React.FC<{ onSearchChange: (t: string) => void }> = ({ onSearchChange }) => (
  <View style={styles.searchContainer}>
    <View style={styles.searchInputWrapper}>
      <Search width={20} height={20} color={colors.textTertiary} />
      <TextInput
        style={styles.searchInput}
        placeholder="Search listings..."
        placeholderTextColor={colors.textTertiary}
        onChangeText={onSearchChange}
      />
    </View>
  </View>
);

// Category Card Component
const CategoryCard: React.FC<{
  category: typeof categoriesData[number];
  onPress: () => void;
  isSelected: boolean;
}> = ({ category, onPress, isSelected }) => {
  const IconComponent = category.icon;
  return (
    <TouchableOpacity 
      style={[
        styles.categoryCard,
        isSelected && styles.categoryCardSelected
      ]} 
      onPress={onPress} 
      activeOpacity={0.75}
    >
      <View 
        style={[
          styles.categoryIconContainer, 
          { backgroundColor: isSelected ? category.color : `${category.color}15` }
        ]}
      >
        <IconComponent 
          width={getResponsiveValue(28, 32, 36)} 
          height={getResponsiveValue(28, 32, 36)} 
          color={isSelected ? colors.white : category.color} 
          strokeWidth={1.5} 
        />
      </View>
      <Text style={[
        styles.categoryName,
        isSelected && styles.categoryNameSelected
      ]}>
        {category.name}
      </Text>
    </TouchableOpacity>
  );
};

// Featured Listing Card Component
const ListingCard: React.FC<{ listing: Product; onPress: () => void }> = ({ listing, onPress }) => (
  <TouchableOpacity style={styles.listingCard} onPress={onPress} activeOpacity={0.9}>
    {/* Product Image Container */}
    <View style={styles.imageContainer}>
      {listing.images && listing.images[0] ? (
        <Image source={listing.images[0]} style={styles.productImage} resizeMode="cover" />
      ) : (
        <View style={[styles.productImage, { backgroundColor: colors.border }]} />
      )}
      
      {/* Price Tag */}
      <View style={styles.priceTag}>
        <Text style={styles.priceText}>{listing.price}</Text>
      </View>

      {/* Favorite Button */}
      <TouchableOpacity style={styles.favoriteButton} activeOpacity={0.7}>
        <Heart width={18} height={18} color={colors.white} fill={colors.white} />
      </TouchableOpacity>
    </View>

    {/* Product Details */}
    <View style={styles.listingDetails}>
      <Text style={styles.listingTitle} numberOfLines={2}>
        {listing.title}
      </Text>

      <View style={styles.locationContainer}>
        <MapPin width={14} height={14} color={colors.textSecondary} />
        <Text style={styles.locationText} numberOfLines={1}>
          {listing.location}
        </Text>
      </View>

      {/* Footer with Rating and Arrow */}
      <View style={styles.listingFooter}>
        <View style={styles.ratingContainer}>
          <Star width={14} height={14} color={colors.warning} fill={colors.warning} />
          <Text style={styles.ratingText}>4.8</Text>
        </View>
        <ChevronRight width={16} height={16} color={colors.accent} />
      </View>
    </View>
  </TouchableOpacity>
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
      <StatusBar barStyle="dark-content" backgroundColor={colors.background} />

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Marketplace</Text>
            <Text style={styles.headerSubtitle}>Discover amazing items near you</Text>
          </View>
        </View>

        {/* Search Bar */}
        <SearchBar onSearchChange={setSearchQuery} />

        {/* Categories Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Shop by Category</Text>
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
            <Text style={styles.sectionTitle}>
              {selectedCategory ? 'Filtered Listings' : 'Featured Listings'}
            </Text>
            <TouchableOpacity activeOpacity={0.7}>
              <Text style={styles.seeAllLink}>See All →</Text>
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

  // Header Styles
  header: {
    paddingHorizontal: getResponsiveValue(16, 24, 32, 48),
    paddingTop: getResponsiveValue(16, 20, 24, 28),
    paddingBottom: getResponsiveValue(16, 20, 24, 28),
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerContent: {
    maxWidth: 1400,
    width: '100%',
    alignSelf: 'center',
  },
  headerTitle: {
    fontSize: getResponsiveValue(28, 32, 40, 48),
    fontWeight: '800',
    color: colors.text,
    marginBottom: getResponsiveValue(4, 6, 8, 10),
    letterSpacing: -0.8,
  },
  headerSubtitle: {
    fontSize: getResponsiveValue(14, 15, 16, 18),
    color: colors.textSecondary,
    fontWeight: '500',
    letterSpacing: -0.1,
  },

  // Search Bar Styles
  searchContainer: {
    paddingHorizontal: getResponsiveValue(16, 24, 32, 48),
    paddingVertical: getResponsiveValue(16, 18, 20, 24),
    maxWidth: 1400,
    width: '100%',
    alignSelf: 'center',
  },
  searchInputWrapper: {
    height: getResponsiveValue(48, 52, 56, 60),
    backgroundColor: colors.white,
    borderRadius: getResponsiveValue(12, 14, 16, 18),
    paddingHorizontal: getResponsiveValue(14, 16, 18, 20),
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
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
    paddingHorizontal: getResponsiveValue(12, 14, 16, 18),
    fontSize: getResponsiveValue(14, 15, 16, 17),
    color: colors.text,
    fontWeight: '500',
  },

  // Section Container Styles
  sectionContainer: {
    marginBottom: getResponsiveValue(24, 28, 32, 40),
    paddingTop: getResponsiveValue(8, 12, 16, 20),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: getResponsiveValue(16, 24, 32, 48),
    marginBottom: getResponsiveValue(16, 20, 24, 28),
    maxWidth: 1400,
    width: '100%',
    alignSelf: 'center',
  },
  sectionTitle: {
    fontSize: getResponsiveValue(18, 20, 24, 28),
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.5,
  },
  seeAllLink: {
    fontSize: getResponsiveValue(13, 14, 15, 16),
    color: colors.primary,
    fontWeight: '700',
  },

  // Categories Section Styles
  categoriesScroll: {
    flexGrow: 0,
  },
  categoriesContent: {
    paddingHorizontal: getResponsiveValue(16, 24, 32, 48),
    gap: getResponsiveValue(12, 14, 16, 18),
  },
  categoryCard: {
    alignItems: 'center',
    width: getResponsiveValue(80, 90, 100, 110),
    paddingVertical: getResponsiveValue(8, 10, 12, 14),
    borderRadius: getResponsiveValue(12, 14, 16, 18),
    backgroundColor: 'transparent',
    transition: 'all 0.2s ease',
  },
  categoryCardSelected: {
    backgroundColor: colors.primaryLight,
  },
  categoryIconContainer: {
    width: getResponsiveValue(64, 72, 80, 88),
    height: getResponsiveValue(64, 72, 80, 88),
    borderRadius: getResponsiveValue(16, 18, 20, 22),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: getResponsiveValue(8, 10, 12, 14),
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  categoryName: {
    fontSize: getResponsiveValue(12, 13, 14, 15),
    color: colors.text,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: -0.1,
  },
  categoryNameSelected: {
    color: colors.primary,
    fontWeight: '700',
  },

  // Listings Grid Styles
  listingsGrid: {
    paddingHorizontal: getResponsiveValue(16, 24, 32, 48),
    maxWidth: 1400,
    width: '100%',
    alignSelf: 'center',
    gap: getResponsiveValue(12, 14, 16, 20),
  },
  listingCardWrapper: {
    paddingHorizontal: getResponsiveValue(0, 6, 8, 10),
    marginBottom: getResponsiveValue(12, 14, 16, 20),
  },
  listingCard: {
    backgroundColor: colors.white,
    borderRadius: getResponsiveValue(14, 16, 18, 20),
    overflow: 'hidden',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 5,
    borderWidth: 1,
    borderColor: colors.border,
  },

  // Listing Image Styles
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: getResponsiveValue(180, 200, 220, 240),
    backgroundColor: colors.border,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  priceTag: {
    position: 'absolute',
    bottom: getResponsiveValue(10, 12, 14, 16),
    right: getResponsiveValue(10, 12, 14, 16),
    backgroundColor: colors.primary,
    paddingHorizontal: getResponsiveValue(12, 14, 16, 18),
    paddingVertical: getResponsiveValue(7, 8, 9, 10),
    borderRadius: getResponsiveValue(10, 11, 12, 13),
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 4,
  },
  priceText: {
    color: colors.white,
    fontSize: getResponsiveValue(14, 15, 16, 17),
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  favoriteButton: {
    position: 'absolute',
    top: getResponsiveValue(10, 12, 14, 16),
    right: getResponsiveValue(10, 12, 14, 16),
    width: getResponsiveValue(38, 40, 42, 44),
    height: getResponsiveValue(38, 40, 42, 44),
    borderRadius: getResponsiveValue(19, 20, 21, 22),
    backgroundColor: colors.accent,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },

  // Listing Details Styles
  listingDetails: {
    padding: getResponsiveValue(14, 16, 18, 20),
  },
  listingTitle: {
    fontSize: getResponsiveValue(15, 16, 17, 18),
    fontWeight: '700',
    color: colors.text,
    marginBottom: getResponsiveValue(8, 10, 12, 14),
    lineHeight: getResponsiveValue(20, 22, 24, 26),
    letterSpacing: -0.2,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveValue(10, 12, 14, 16),
    gap: 5,
  },
  locationText: {
    fontSize: getResponsiveValue(12, 13, 14, 15),
    color: colors.textSecondary,
    fontWeight: '500',
    flex: 1,
    letterSpacing: -0.1,
  },
  listingFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: getResponsiveValue(8, 10, 12, 14),
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: getResponsiveValue(12, 13, 14, 15),
    color: colors.text,
    fontWeight: '700',
    letterSpacing: -0.1,
  },

  // Empty State
  emptyState: {
    paddingVertical: getResponsiveValue(40, 50, 60, 80),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: getResponsiveValue(16, 18, 20, 22),
    fontWeight: '700',
    color: colors.text,
    marginBottom: getResponsiveValue(6, 8, 10, 12),
  },
  emptyStateSubtext: {
    fontSize: getResponsiveValue(13, 14, 15, 16),
    color: colors.textSecondary,
    fontWeight: '500',
  },

  // Bottom Spacing
  bottomSpacing: {
    height: getResponsiveValue(24, 28, 32, 40),
  },
});