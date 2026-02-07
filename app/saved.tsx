import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    Pressable,
    Dimensions,
    Alert,
    ActivityIndicator,
    TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/OTPAuthContext';
import { fetchSavedItems, toggleFavorite } from '@/lib/favorites';

const { width } = Dimensions.get('window');

export default function SavedItemsScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const [savedItems, setSavedItems] = React.useState<any[]>([]);
    const [loading, setLoading] = React.useState(true);

    const loadSavedItems = async () => {
        if (!user) return;
        setLoading(true);
        const { data, error } = await fetchSavedItems(user.id);
        if (!error) {
            setSavedItems(data);
        }
        setLoading(false);
    };

    React.useEffect(() => {
        loadSavedItems();
    }, [user]);

    const handleToggleFavorite = async (postId: string) => {
        if (!user) return;
        const { error } = await toggleFavorite(user.id, postId);
        if (error) {
            Alert.alert('Error', 'Failed to update favorite status.');
        } else {
            // Optimistically remove from list
            setSavedItems(prev => prev.filter(item => item.post.id !== postId));
        }
    };

    const renderSavedItem = ({ item }: { item: any }) => {
        const post = item.post;
        if (!post) return null;

        const firstImage = post.images && post.images[0];
        const formattedDate = post.created_at ? new Date(post.created_at).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
        }) : '';

        return (
            <TouchableOpacity
                style={styles.card}
                onPress={() => router.push(`/listing/${post.id}`)}
                activeOpacity={0.7}
            >
                <Image
                    source={typeof firstImage === 'string' ? { uri: firstImage } : firstImage}
                    style={styles.itemImage}
                />

                <View style={styles.detailsContainer}>
                    <View style={styles.topRow}>
                        <View style={styles.titleColumn}>
                            <Text style={styles.itemTitle} numberOfLines={1}>{post.title}</Text>
                            <Text style={styles.itemPrice}>Rs {Number(post.price).toLocaleString()}</Text>
                        </View>
                        <TouchableOpacity
                            style={styles.heartCircle}
                            onPress={() => handleToggleFavorite(post.id)}
                        >
                            <Ionicons name="heart" size={20} color="#EF4444" />
                        </TouchableOpacity>
                    </View>

                    <View style={styles.tagRow}>
                        {post.condition && (
                            <View style={styles.tag}>
                                <Text style={styles.tagText}>{post.condition}</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.bottomRow}>
                        <Text style={styles.locationText} numberOfLines={1}>{post.location || 'Unknown'}</Text>
                        <Text style={styles.dateText}>{formattedDate}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        );
    };

    if (!user) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.emptyContainer}>
                    <Ionicons name="lock-closed-outline" size={64} color="#cbd5e1" />
                    <Text style={styles.emptyText}>Please login to view saved items</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="close" size={28} color="#1e293b" />
                </Pressable>
                <Text style={styles.headerTitle}>Saved Items</Text>
            </View>

            {/* List */}
            <FlatList
                data={savedItems}
                renderItem={renderSavedItem}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                showsVerticalScrollIndicator={false}
                refreshing={loading && savedItems.length > 0}
                onRefresh={loadSavedItems}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="heart-outline" size={64} color="#cbd5e1" />
                        <Text style={styles.emptyText}>No saved items yet</Text>
                    </View>
                }
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: '#000',
        letterSpacing: -0.5,
    },
    listContent: {
        padding: 16,
        paddingTop: 8,
    },
    card: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e2e8f0',
        padding: 12,
        marginBottom: 16,
        // Add subtle shadow for premium feel
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    itemImage: {
        width: 100,
        height: 100,
        borderRadius: 12,
        backgroundColor: '#f1f5f9',
    },
    detailsContainer: {
        flex: 1,
        marginLeft: 16,
        justifyContent: 'space-between',
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    titleColumn: {
        flex: 1,
    },
    itemTitle: {
        fontSize: 14,
        color: '#64748b',
        fontWeight: '500',
        marginBottom: 2,
    },
    itemPrice: {
        fontSize: 18,
        fontWeight: '700',
        color: '#000',
    },
    heartCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#fff',
        justifyContent: 'center',
        alignItems: 'center',
        // Subtle shadow for the heart button as seen in mockup
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    tagRow: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 6,
    },
    tag: {
        backgroundColor: '#f3f4f6',
        paddingHorizontal: 12,
        paddingVertical: 5,
        borderRadius: 8,
    },
    tagText: {
        fontSize: 12,
        color: '#111827',
        fontWeight: '600',
    },
    bottomRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 12,
    },
    locationText: {
        fontSize: 13,
        color: '#64748b',
    },
    dateText: {
        fontSize: 13,
        color: '#111827',
        fontWeight: '400',
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 100,
    },
    emptyText: {
        fontSize: 16,
        color: '#94a3b8',
        marginTop: 16,
        fontWeight: '500',
    },
});
