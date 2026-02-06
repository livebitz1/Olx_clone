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
    Platform,
    FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/OTPAuthContext';
import { supabase } from '@/lib/supabase';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const COLORS = {
    primary: '#FF4D00',
    background: '#FFFFFF',
    text: '#000000',
    textSecondary: '#666666',
    border: '#F0F0F0',
    rating: '#00A651',
};

// Mock Business Data (Real app would fetch from Supabase)
const MOCK_BUSINESSES = [
    {
        id: '1',
        name: 'Artisan Brew Co.',
        description: 'Crafted with passion and precision.',
        rating: 4.7,
        image: 'https://images.unsplash.com/photo-1541167760496-1628856ab772?q=80&w=1000&auto=format&fit=crop',
        category: 'Coffee & Cafe',
        time: '20-25 min',
        isFavorite: true,
    },
    {
        id: '2',
        name: 'The Green Bistro',
        description: 'Fresh organic meals delivered fast.',
        rating: 4.5,
        image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=1000&auto=format&fit=crop',
        category: 'Healthy Food',
        time: '30-40 min',
        isFavorite: false,
    }
];

const BusinessCard = ({ item }: { item: typeof MOCK_BUSINESSES[0] }) => {
    return (
        <View style={styles.cardContainer}>
            <View style={styles.imageWrapper}>
                <Image source={{ uri: item.image }} style={styles.businessImage} />
                <TouchableOpacity style={styles.cardHeartButton}>
                    <Ionicons name="heart" size={24} color={item.isFavorite ? "#FF0000" : "#FFF"} />
                </TouchableOpacity>

                <View style={styles.paginationContainer}>
                    <View style={styles.dot} />
                    <View style={[styles.dot, styles.activeDot]} />
                    <View style={styles.dot} />
                    <View style={styles.dot} />
                    <View style={styles.dot} />
                </View>
            </View>

            <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                    <Text style={styles.businessName}>{item.name}</Text>
                    <View style={styles.ratingBadge}>
                        <Text style={styles.ratingText}>{item.rating}</Text>
                        <Ionicons name="star" size={14} color="#FFF" />
                    </View>
                </View>
                <Text style={styles.businessDesc}>{item.description}</Text>

                <View style={styles.cardSeparator} />

                <View style={styles.cardFooter}>
                    <View style={styles.footerItem}>
                        <Ionicons name="time-outline" size={16} color={COLORS.textSecondary} />
                        <Text style={styles.footerText}>{item.time}</Text>
                    </View>
                    <View style={styles.footerItem}>
                        <Ionicons name="bicycle-outline" size={16} color={COLORS.textSecondary} />
                        <Text style={styles.footerText}>Free delivery</Text>
                    </View>
                </View>
            </View>
        </View>
    );
};

export default function BusinessesScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [userProfile, setUserProfile] = useState<any>(null);

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
        const { data, error } = await supabase
            .from('users')
            .select('avatar, name')
            .eq('id', user.id)
            .single();

        if (data) {
            setUserProfile(data);
        }
    };

    const [search, setSearch] = useState('');

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

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

            {/* Search Bar */}
            <View style={styles.searchSection}>
                <View style={styles.searchBar}>
                    <Ionicons name="search" size={20} color="#999" />
                    <TextInput
                        style={styles.searchInput}
                        placeholder="Search rentals near you"
                        placeholderTextColor="#999"
                        value={search}
                        onChangeText={setSearch}
                    />
                </View>
            </View>

            <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>New Businesses</Text>

                    {MOCK_BUSINESSES.map(item => (
                        <BusinessCard key={item.id} item={item} />
                    ))}
                </View>

                <View style={{ height: 80 }} />
            </ScrollView>
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
    searchSection: {
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F0F2F5',
        borderRadius: 16,
        paddingHorizontal: 16,
        height: 52,
        gap: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        fontWeight: '500',
        color: COLORS.text,
    },
    content: {
        flex: 1,
    },
    section: {
        paddingHorizontal: 16,
        marginTop: 8,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: '800',
        color: COLORS.text,
        marginBottom: 20,
    },
    cardContainer: {
        backgroundColor: '#FFF',
        borderRadius: 28,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.05,
        shadowRadius: 15,
        elevation: 5,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    imageWrapper: {
        width: '100%',
        height: 240,
        position: 'relative',
    },
    businessImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    cardHeartButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#FFF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    paginationContainer: {
        position: 'absolute',
        bottom: 16,
        flexDirection: 'row',
        alignSelf: 'center',
        gap: 6,
        backgroundColor: 'rgba(0,0,0,0.3)',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 12,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: 'rgba(255,255,255,0.5)',
    },
    activeDot: {
        width: 20,
        backgroundColor: '#FFF',
    },
    cardContent: {
        padding: 20,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    businessName: {
        fontSize: 24,
        fontWeight: '800',
        color: COLORS.text,
        letterSpacing: -0.5,
    },
    ratingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: COLORS.rating,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
        gap: 4,
    },
    ratingText: {
        color: '#FFF',
        fontSize: 14,
        fontWeight: '700',
    },
    businessDesc: {
        fontSize: 16,
        color: COLORS.textSecondary,
        fontWeight: '500',
        marginBottom: 16,
    },
    cardSeparator: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginBottom: 16,
    },
    cardFooter: {
        flexDirection: 'row',
        gap: 20,
    },
    footerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    footerText: {
        fontSize: 14,
        color: COLORS.textSecondary,
        fontWeight: '600',
    },
});
