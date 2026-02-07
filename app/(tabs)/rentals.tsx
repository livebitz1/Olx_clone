import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
    StatusBar,
    Modal,
    TextInput as RNTextInput,
    FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/OTPAuthContext';
import { supabase } from '@/lib/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
    primary: '#FF4D00',
    background: '#FFFFFF',
    text: '#000000',
    textSecondary: '#707070',
    border: '#F0F0F0',
    cardBg: '#F8F8F8',
};

const CATEGORIES = [
    { id: '1', name: 'Vehicles', icon: 'car-outline', color: '#3B82F6', image: 'https://img.freepik.com/free-photo/blue-sport-sedan-parked-yard_114579-5079.jpg' },
    { id: '2', name: 'Electronics', icon: 'laptop-outline', color: '#8B5CF6', image: 'https://images.unsplash.com/photo-1518481612222-68bbe828ecd1?q=80&w=1000' },
    { id: '3', name: 'Jobs', icon: 'briefcase-outline', color: '#10B981', image: 'https://images.unsplash.com/photo-1544717297-fa154da09f5b?q=80&w=1000' },
    { id: '4', name: 'Mobiles', icon: 'phone-portrait-outline', color: '#EC4899', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=1000' },
    { id: '5', name: 'Furniture', icon: 'bed-outline', color: '#F59E0B', image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=1000' },
];

const PRICE_RANGES = [
    { id: 'any', label: 'Any Price', min: 0, max: Infinity },
    { id: 'under2k', label: 'Under ₹2,000 / mo', min: 0, max: 2000 },
    { id: '2k_5k', label: '₹2,000 - ₹5,000 / mo', min: 2000, max: 5000 },
    { id: '5k_10k', label: '₹5,000 - ₹10,000 / mo', min: 5000, max: 10000 },
    { id: '10k_25k', label: '₹10,000 - ₹25,000 / mo', min: 10000, max: 25000 },
    { id: 'over25k', label: 'Over ₹25,000 / mo', min: 25000, max: Infinity },
];

const CONDITIONS = [
    { id: 'any', label: 'Any Condition' },
    { id: 'new', label: 'New' },
    { id: 'like_new', label: 'Like New' },
    { id: 'used', label: 'Used' },
];

const LOCATIONS = [
    { id: 'any', label: 'All Locations' },
    { id: 'delhi', label: 'Delhi, NCR' },
    { id: 'mumbai', label: 'Mumbai, Maharashtra' },
    { id: 'bangalore', label: 'Bangalore, Karnataka' },
    { id: 'jaipur', label: 'Jaipur, Rajasthan' },
    { id: 'hyderabad', label: 'Hyderabad, Telangana' },
];

// Reusing FilterModal from index.tsx logic
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

    useEffect(() => {
        setTempFilters(filters);
    }, [filters, visible]);

    const handleApply = () => {
        onApplyFilters(tempFilters);
        onClose();
    };

    const handleReset = () => {
        setTempFilters({
            category: null,
            priceRange: 'any',
            condition: 'any',
            location: 'any',
        });
    };

    const activeFiltersCount = [
        tempFilters.category !== null,
        tempFilters.priceRange !== 'any',
        tempFilters.condition !== 'any',
        tempFilters.location !== 'any',
    ].filter(Boolean).length;

    return (
        <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
            <SafeAreaView style={filterStyles.container}>
                <View style={filterStyles.header}>
                    <TouchableOpacity onPress={onClose} style={filterStyles.closeButton}>
                        <Ionicons name="close" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                    <Text style={filterStyles.headerTitle}>Filters</Text>
                    <TouchableOpacity onPress={handleReset}>
                        <Text style={filterStyles.resetText}>Reset</Text>
                    </TouchableOpacity>
                </View>

                <ScrollView style={filterStyles.content} showsVerticalScrollIndicator={false}>
                    <View style={filterStyles.section}>
                        <Text style={filterStyles.sectionTitle}>Category</Text>
                        <View style={filterStyles.optionsGrid}>
                            <TouchableOpacity
                                style={[filterStyles.optionChip, tempFilters.category === null && filterStyles.optionChipSelected]}
                                onPress={() => setTempFilters({ ...tempFilters, category: null })}
                            >
                                <Text style={[filterStyles.optionText, tempFilters.category === null && filterStyles.optionTextSelected]}>All</Text>
                            </TouchableOpacity>
                            {CATEGORIES.map((cat) => (
                                <TouchableOpacity
                                    key={cat.id}
                                    style={[filterStyles.optionChip, tempFilters.category === cat.name && filterStyles.optionChipSelected]}
                                    onPress={() => setTempFilters({ ...tempFilters, category: cat.name })}
                                >
                                    <Ionicons name={cat.icon as any} size={16} color={tempFilters.category === cat.name ? '#FFF' : cat.color} style={{ marginRight: 6 }} />
                                    <Text style={[filterStyles.optionText, tempFilters.category === cat.name && filterStyles.optionTextSelected]}>{cat.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={filterStyles.section}>
                        <Text style={filterStyles.sectionTitle}>Monthly Budget</Text>
                        <View style={filterStyles.optionsList}>
                            {PRICE_RANGES.map((range) => (
                                <TouchableOpacity
                                    key={range.id}
                                    style={[filterStyles.listOption, tempFilters.priceRange === range.id && filterStyles.listOptionSelected]}
                                    onPress={() => setTempFilters({ ...tempFilters, priceRange: range.id })}
                                >
                                    <Text style={[filterStyles.listOptionText, tempFilters.priceRange === range.id && filterStyles.listOptionTextSelected]}>{range.label}</Text>
                                    {tempFilters.priceRange === range.id && <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    <View style={filterStyles.section}>
                        <Text style={filterStyles.sectionTitle}>Location</Text>
                        <View style={filterStyles.optionsList}>
                            {LOCATIONS.map((loc) => (
                                <TouchableOpacity
                                    key={loc.id}
                                    style={[filterStyles.listOption, tempFilters.location === loc.id && filterStyles.listOptionSelected]}
                                    onPress={() => setTempFilters({ ...tempFilters, location: loc.id })}
                                >
                                    <View style={filterStyles.locationOption}>
                                        <Ionicons name="location-outline" size={18} color={tempFilters.location === loc.id ? COLORS.primary : '#707070'} />
                                        <Text style={[filterStyles.listOptionText, tempFilters.location === loc.id && filterStyles.listOptionTextSelected]}>{loc.label}</Text>
                                    </View>
                                    {tempFilters.location === loc.id && <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />}
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                    <View style={{ height: 100 }} />
                </ScrollView>

                <View style={filterStyles.footer}>
                    <TouchableOpacity style={filterStyles.applyButton} onPress={handleApply}>
                        <Text style={filterStyles.applyButtonText}>Apply Filters {activeFiltersCount > 0 ? `(${activeFiltersCount})` : ''}</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        </Modal>
    );
};

const RECOMMENDATIONS = [
    {
        id: '1',
        title: 'Sony ZV-E10',
        price: '1100',
        location: 'Saket, Delhi',
        date: '10 Nov',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000',
    },
    {
        id: '2',
        title: 'Power Bank 20k mAh',
        price: '1100',
        location: 'Saket, Delhi',
        date: '10 Nov',
        image: 'https://images.unsplash.com/photo-1625842268584-8f3bf9ff16a0?q=80&w=1000',
    },
    {
        id: '3',
        title: 'Sony ZV-E10 Camera',
        price: '1100',
        location: 'Saket, Delhi',
        date: '10 Nov',
        image: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=1000',
    },
    {
        id: '4',
        title: 'Smart Watch Pro',
        price: '1100',
        location: 'Saket, Delhi',
        date: '10 Nov',
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1000',
    },
];

export default function RentalsScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [userProfile, setUserProfile] = useState<any>(null);
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [filterModalVisible, setFilterModalVisible] = useState(false);
    const [filters, setFilters] = useState({
        category: null as string | null,
        priceRange: 'any',
        condition: 'any',
        location: 'any',
    });
    const [listings, setListings] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user) {
            if (user.avatar) {
                setUserProfile(user);
            } else {
                fetchUserProfile();
            }
        }
    }, [user]);

    const fetchUserProfile = async () => {
        if (!user) return;
        const { data } = await supabase
            .from('users')
            .select('avatar, name')
            .eq('id', user.id)
            .single();

        if (data) {
            setUserProfile(data);
        }
    };

    useEffect(() => {
        fetchListings();
    }, []);

    const fetchListings = async () => {
        setIsLoading(true);
        // In a real app, we'd fetch from a 'rentals' table or filter a 'posts' table by a 'type' column.
        // For this high-fidelity UI demo, we'll use the mock RECOMMENDATIONS and add some dynamic filtering.
        setListings(RECOMMENDATIONS);
        setIsLoading(false);
    };

    const handleApplyFilters = (newFilters: typeof filters) => {
        setFilters(newFilters);
    };

    const hasActiveFilters =
        filters.category !== null ||
        filters.priceRange !== 'any' ||
        filters.condition !== 'any' ||
        filters.location !== 'any';

    const parsePrice = (priceVal: any): number => {
        if (typeof priceVal === 'number') return priceVal;
        if (typeof priceVal === 'string') return parseFloat(priceVal.replace(/[^0-9.]/g, '')) || 0;
        return 0;
    };

    const getPriceRange = (rangeId: string) => {
        const range = PRICE_RANGES.find((r) => r.id === rangeId);
        return range ? { min: range.min, max: range.max } : { min: 0, max: Infinity };
    };

    const getLocationFilter = (locId: string) => {
        const loc = LOCATIONS.find((l) => l.id === locId);
        return loc && loc.id !== 'any' ? loc.label.toLowerCase() : null;
    };

    const filtered = listings.filter((p) => {
        const matchesSearch =
            searchQuery.trim() === '' ||
            p.title.toLowerCase().includes(searchQuery.trim().toLowerCase()) ||
            p.location.toLowerCase().includes(searchQuery.trim().toLowerCase());

        const activeCategory = filters.category;
        const matchesCategory = !activeCategory || p.title.toLowerCase().includes(activeCategory.toLowerCase()) || (p.category && p.category.toLowerCase() === activeCategory.toLowerCase());

        const priceRange = getPriceRange(filters.priceRange);
        const productPrice = parsePrice(p.price);
        const matchesPrice = productPrice >= priceRange.min && productPrice <= priceRange.max;

        const locationFilter = getLocationFilter(filters.location);
        const matchesLocation = !locationFilter || p.location.toLowerCase().includes(locationFilter);

        return matchesSearch && matchesCategory && matchesPrice && matchesLocation;
    });

    const renderRecommendation = ({ item }: { item: any }) => (
        <TouchableOpacity style={styles.recommendationCard}>
            <View style={styles.cardImageContainer}>
                <Image source={{ uri: item.image }} style={styles.cardImage} />
                <TouchableOpacity style={styles.heartButton}>
                    <Ionicons name="heart-outline" size={20} color={COLORS.text} />
                </TouchableOpacity>
            </View>
            <View style={styles.cardContent}>
                <Text style={styles.cardPrice}>Rs {item.price} / month</Text>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <View style={styles.cardFooter}>
                    <View style={styles.locationContainer}>
                        <Ionicons name="location-outline" size={12} color={COLORS.textSecondary} />
                        <Text style={styles.locationText}>{item.location}</Text>
                    </View>
                    <Text style={styles.dateText}>{item.date}</Text>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />
            <StatusBar barStyle="dark-content" />

            {/* Top Navigation Bar (Same as Home) */}
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
                                <Ionicons name="person" size={20} color={COLORS.textSecondary} />
                            </View>
                        )}
                    </TouchableOpacity>
                    <View>
                        <Text style={styles.navGreeting}>Hello, {userProfile?.name?.split(' ')[0] || 'User'} 👋</Text>
                        <View style={styles.locationRow}>
                            <Ionicons name="location" size={14} color={COLORS.primary} />
                            <Text style={styles.navLocation}>{user?.location || 'Jaipur, India'}</Text>
                        </View>
                    </View>
                </View>
                <View style={styles.navRight}>
                    <TouchableOpacity
                        style={styles.navIconButton}
                        onPress={() => router.push('/notifications')}
                    >
                        <Ionicons name="notifications-outline" size={24} color={COLORS.text} />
                        <View style={styles.notificationDot} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.navIconButton}>
                        <Ionicons name="heart-outline" size={24} color={COLORS.text} />
                    </TouchableOpacity>
                </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Search Bar */}
                <View style={styles.searchContainer}>
                    <View style={styles.searchWrapper}>
                        <Ionicons name="search-outline" size={20} color={COLORS.textSecondary} style={styles.searchIcon} />
                        <RNTextInput
                            placeholder="Search rentals near you"
                            placeholderTextColor={COLORS.textSecondary}
                            style={styles.searchInput}
                            onChangeText={setSearchQuery}
                        />
                        <TouchableOpacity
                            style={styles.filterButton}
                            onPress={() => setFilterModalVisible(true)}
                        >
                            <Ionicons name="options-outline" size={20} color={COLORS.primary} />
                            {hasActiveFilters && <View style={styles.filterBadge} />}
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Filter Modal */}
                <FilterModal
                    visible={filterModalVisible}
                    onClose={() => setFilterModalVisible(false)}
                    filters={filters}
                    onApplyFilters={handleApplyFilters}
                />

                {/* Categories Section */}
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={styles.categoriesContainer}
                    contentContainerStyle={styles.categoriesContent}
                >
                    {CATEGORIES.map((cat) => (
                        <TouchableOpacity
                            key={cat.id}
                            style={styles.categoryCard}
                            onPress={() => setFilters({ ...filters, category: filters.category === cat.name ? null : cat.name })}
                        >
                            <View style={styles.categoryImageContainer}>
                                <Image source={{ uri: cat.image }} style={styles.categoryImage} />
                            </View>
                            <Text style={[styles.categoryName, filters.category === cat.name && styles.activeCategoryName]}>
                                {cat.name}
                            </Text>
                            {filters.category === cat.name && <View style={styles.activeIndicator} />}
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Recommendations Section */}
                <View style={styles.recommendationHeader}>
                    <Text style={styles.recommendationTitle}>
                        {hasActiveFilters || searchQuery ? 'Filtered Results' : 'Fresh Recommendation'}
                    </Text>
                </View>

                <FlatList
                    data={filtered}
                    renderItem={renderRecommendation}
                    keyExtractor={(item) => item.id}
                    numColumns={2}
                    scrollEnabled={false}
                    contentContainerStyle={styles.recommendationGrid}
                    columnWrapperStyle={styles.recommendationRow}
                    ListEmptyComponent={
                        <View style={styles.emptyState}>
                            <Ionicons name="search-outline" size={48} color={COLORS.textSecondary} />
                            <Text style={styles.emptyStateText}>No rentals found</Text>
                            <Text style={styles.emptyStateSubtext}>Try adjusting your filters</Text>
                        </View>
                    }
                />

                <View style={{ height: 100 }} />
            </ScrollView>

            {/* FAB - Same as Home */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => router.push('/post')}
            >
                <Ionicons name="add" size={32} color="#FFF" />
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.background,
    },
    topNav: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
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
        borderColor: COLORS.primary,
        padding: 2,
    },
    profileImage: {
        width: '100%',
        height: '100%',
        borderRadius: 20,
    },
    profilePlaceholder: {
        backgroundColor: COLORS.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    navGreeting: {
        fontSize: 16,
        fontWeight: '700',
        color: COLORS.text,
        marginBottom: 2,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    navLocation: {
        fontSize: 12,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },
    navRight: {
        flexDirection: 'row',
        gap: 8,
    },
    navIconButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#F8F8F8',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
    },
    notificationDot: {
        position: 'absolute',
        top: 10,
        right: 12,
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#FF3B30',
        borderWidth: 1.5,
        borderColor: '#F8F8F8',
    },
    searchContainer: {
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    searchWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F3F4F6',
        borderRadius: 25,
        paddingHorizontal: 16,
        height: 50,
    },
    searchIcon: {
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: COLORS.text,
    },
    categoriesContainer: {
        marginVertical: 16,
    },
    categoriesContent: {
        paddingHorizontal: 16,
        gap: 20,
    },
    categoryCard: {
        alignItems: 'center',
        width: 80,
    },
    categoryImageContainer: {
        width: 65,
        height: 65,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#F3F4F6',
        marginBottom: 8,
    },
    categoryImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    categoryName: {
        fontSize: 13,
        fontWeight: '600',
        color: COLORS.textSecondary,
    },
    activeCategoryName: {
        color: COLORS.text,
        fontWeight: '700',
    },
    activeIndicator: {
        marginTop: 4,
        width: 40,
        height: 3,
        backgroundColor: '#FF4D00',
        borderRadius: 1.5,
    },
    recommendationHeader: {
        paddingHorizontal: 16,
        marginBottom: 16,
        marginTop: 8,
    },
    recommendationTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: COLORS.text,
    },
    recommendationGrid: {
        paddingHorizontal: 12,
    },
    recommendationRow: {
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    recommendationCard: {
        width: (SCREEN_WIDTH - 40) / 2,
        backgroundColor: '#FFF',
        borderRadius: 16,
        overflow: 'hidden',
    },
    cardImageContainer: {
        width: '100%',
        aspectRatio: 1,
        backgroundColor: '#F3F4F6',
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
    },
    cardImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    heartButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255,255,255,0.8)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    cardContent: {
        padding: 8,
    },
    cardPrice: {
        fontSize: 15,
        fontWeight: '800',
        color: COLORS.text,
        marginBottom: 2,
    },
    cardTitle: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginBottom: 6,
        fontWeight: '500',
    },
    cardFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 2,
    },
    locationText: {
        fontSize: 12,
        color: COLORS.textSecondary,
        fontWeight: '500',
    },
    dateText: {
        fontSize: 12,
        color: COLORS.textSecondary,
        fontWeight: '500',
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
    filterButton: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: '#FFE5D9',
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
        backgroundColor: '#FF3B30',
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyStateText: {
        fontSize: 18,
        fontWeight: '700',
        color: COLORS.text,
        marginTop: 12,
    },
    emptyStateSubtext: {
        fontSize: 14,
        color: COLORS.textSecondary,
        marginTop: 4,
    },
});

const filterStyles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8FAFC',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 16,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000',
    },
    resetText: {
        fontSize: 14,
        fontWeight: '600',
        color: COLORS.primary,
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
        color: '#000',
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
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    optionChipSelected: {
        backgroundColor: COLORS.primary,
        borderColor: COLORS.primary,
    },
    optionText: {
        fontSize: 13,
        fontWeight: '600',
        color: '#000',
    },
    optionTextSelected: {
        color: '#FFF',
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
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    listOptionSelected: {
        borderColor: COLORS.primary,
        backgroundColor: '#FFF5F0',
    },
    listOptionText: {
        fontSize: 14,
        fontWeight: '500',
        color: '#000',
    },
    listOptionTextSelected: {
        color: COLORS.primary,
        fontWeight: '600',
    },
    locationOption: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        padding: 16,
        paddingBottom: 32,
        backgroundColor: '#FFF',
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    applyButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: COLORS.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
    },
    applyButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFF',
    },
});
