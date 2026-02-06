import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    Dimensions,
    TextInput,
    FlatList,
    Platform,
    StatusBar,
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
    { id: '1', name: 'Vehicles', image: 'https://img.freepik.com/free-photo/blue-sport-sedan-parked-yard_114579-5079.jpg' },
    { id: '2', name: 'Electronics', image: 'https://images.unsplash.com/photo-1518481612222-68bbe828ecd1?q=80&w=1000' },
    { id: '3', name: 'Jobs', image: 'https://images.unsplash.com/photo-1544717297-fa154da09f5b?q=80&w=1000' },
    { id: '4', name: 'Mobiles', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=1000' },
    { id: '5', name: 'Furniture', image: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?q=80&w=1000' },
];

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
    const [activeCategory, setActiveCategory] = useState('Electronics');

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

    const renderRecommendation = ({ item }: { item: typeof RECOMMENDATIONS[0] }) => (
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
                        <TextInput
                            placeholder="Search rentals near you"
                            placeholderTextColor={COLORS.textSecondary}
                            style={styles.searchInput}
                        />
                    </View>
                </View>

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
                            onPress={() => setActiveCategory(cat.name)}
                        >
                            <View style={styles.categoryImageContainer}>
                                <Image source={{ uri: cat.image }} style={styles.categoryImage} />
                            </View>
                            <Text style={[styles.categoryName, activeCategory === cat.name && styles.activeCategoryName]}>
                                {cat.name}
                            </Text>
                            {activeCategory === cat.name && <View style={styles.activeIndicator} />}
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {/* Recommendations Section */}
                <View style={styles.recommendationHeader}>
                    <Text style={styles.recommendationTitle}>Fresh Recommendation</Text>
                </View>

                <FlatList
                    data={RECOMMENDATIONS}
                    renderItem={renderRecommendation}
                    keyExtractor={(item) => item.id}
                    numColumns={2}
                    scrollEnabled={false}
                    contentContainerStyle={styles.recommendationGrid}
                    columnWrapperStyle={styles.recommendationRow}
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
});
