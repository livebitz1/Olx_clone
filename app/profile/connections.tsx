import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    FlatList,
    Image,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/OTPAuthContext';
import { getFollowers, getFollowing, checkIsFollowing, followUser, unfollowUser } from '@/lib/follow';

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
    danger: '#EF4444',
};

type User = {
    id: string;
    name: string;
    avatar: string | null;
    location: string | null;
    is_verified: boolean;
};

// User List Item Component
const UserListItem = ({
    user,
    currentUserId,
    onPress,
    onFollowToggle,
    isFollowing,
    isLoading
}: {
    user: User;
    currentUserId: string | undefined;
    onPress: () => void;
    onFollowToggle: () => void;
    isFollowing: boolean;
    isLoading: boolean;
}) => {
    const isMe = currentUserId === user.id;

    return (
        <TouchableOpacity style={styles.userItem} onPress={onPress} activeOpacity={0.7}>
            <View style={styles.avatarContainer}>
                {user.avatar ? (
                    <Image source={{ uri: user.avatar }} style={styles.avatar} />
                ) : (
                    <View style={[styles.avatar, styles.avatarPlaceholder]}>
                        <Ionicons name="person" size={20} color={colors.textTertiary} />
                    </View>
                )}
            </View>

            <View style={styles.userInfo}>
                <View style={styles.nameRow}>
                    <Text style={styles.userName}>{user.name || 'User'}</Text>
                    {user.is_verified && (
                        <Ionicons name="checkmark-circle" size={14} color={colors.primary} style={{ marginLeft: 4 }} />
                    )}
                </View>
                <Text style={styles.userHandle}>
                    {user.location || 'No location'}
                </Text>
            </View>

            {!isMe && (
                <TouchableOpacity
                    style={[
                        styles.followButton,
                        isFollowing && styles.followingButton
                    ]}
                    onPress={onFollowToggle}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <ActivityIndicator size="small" color={isFollowing ? colors.text : colors.white} />
                    ) : (
                        <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
                            {isFollowing ? 'Following' : 'Follow'}
                        </Text>
                    )}
                </TouchableOpacity>
            )}
        </TouchableOpacity>
    );
};

export default function ConnectionsScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const userId = params.userId as string;
    const initialTab = params.tab as 'followers' | 'following' || 'followers';
    const userName = params.name as string || 'User';

    const { user: currentUser } = useAuth();

    const [activeTab, setActiveTab] = useState<'followers' | 'following'>(initialTab);
    const [users, setUsers] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [followStatus, setFollowStatus] = useState<Record<string, boolean>>({});
    const [loadingIds, setLoadingIds] = useState<Record<string, boolean>>({});

    useEffect(() => {
        fetchUsers();
    }, [userId, activeTab]);

    const fetchUsers = async () => {
        setIsLoading(true);
        try {
            let data: User[] = [];
            let error = null;

            if (activeTab === 'followers') {
                const result = await getFollowers(userId);
                data = result.data;
                error = result.error;
            } else {
                const result = await getFollowing(userId);
                data = result.data;
                error = result.error;
            }

            if (error) throw error;
            setUsers(data);

            // Check follow status for each user if logged in
            if (currentUser) {
                const statusMap: Record<string, boolean> = {};
                await Promise.all(
                    data.map(async (u) => {
                        if (u.id !== currentUser.id) {
                            const { isFollowing } = await checkIsFollowing(currentUser.id, u.id);
                            statusMap[u.id] = isFollowing;
                        }
                    })
                );
                setFollowStatus(statusMap);
            }

        } catch (error) {
            console.error('Error fetching users:', error);
            Alert.alert('Error', 'Failed to load users');
        } finally {
            setIsLoading(false);
        }
    };

    const handleFollowToggle = async (targetUserId: string) => {
        if (!currentUser) {
            Alert.alert('Login Required', 'Please login to follow users');
            return;
        }

        setLoadingIds(prev => ({ ...prev, [targetUserId]: true }));
        const isFollowing = followStatus[targetUserId];
        const newStatus = !isFollowing;

        // Optimistic update
        setFollowStatus(prev => ({ ...prev, [targetUserId]: newStatus }));

        try {
            if (newStatus) {
                await followUser(currentUser.id, targetUserId);
            } else {
                await unfollowUser(currentUser.id, targetUserId);
            }
        } catch (error) {
            // Revert
            setFollowStatus(prev => ({ ...prev, [targetUserId]: isFollowing }));
            Alert.alert('Error', 'Failed to update follow status');
        } finally {
            setLoadingIds(prev => ({ ...prev, [targetUserId]: false }));
        }
    };

    const handleUserPress = (targetUserId: string) => {
        if (targetUserId === currentUser?.id) {
            router.push('/(tabs)/profile');
        } else {
            router.push(`/profile/${targetUserId}`);
        }
    };

    const handleBack = () => {
        if (router.canGoBack()) {
            router.back();
        } else {
            router.push('/');
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <Stack.Screen options={{ headerShown: false }} />

            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.backButton} onPress={handleBack}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{userName}</Text>
                <View style={{ width: 40 }} />
            </View>

            {/* Tabs */}
            <View style={styles.tabs}>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'followers' && styles.activeTab]}
                    onPress={() => setActiveTab('followers')}
                >
                    <Text style={[styles.tabText, activeTab === 'followers' && styles.activeTabText]}>
                        Followers
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[styles.tab, activeTab === 'following' && styles.activeTab]}
                    onPress={() => setActiveTab('following')}
                >
                    <Text style={[styles.tabText, activeTab === 'following' && styles.activeTabText]}>
                        Following
                    </Text>
                </TouchableOpacity>
            </View>

            {/* List */}
            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : (
                <FlatList
                    data={users}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                        <UserListItem
                            user={item}
                            currentUserId={currentUser?.id}
                            onPress={() => handleUserPress(item.id)}
                            onFollowToggle={() => handleFollowToggle(item.id)}
                            isFollowing={followStatus[item.id] || false}
                            isLoading={loadingIds[item.id] || false}
                        />
                    )}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons
                                name={activeTab === 'followers' ? 'people-outline' : 'person-add-outline'}
                                size={48}
                                color={colors.textTertiary}
                            />
                            <Text style={styles.emptyText}>
                                {activeTab === 'followers'
                                    ? 'No followers yet'
                                    : 'Not following anyone yet'}
                            </Text>
                        </View>
                    }
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    backButton: {
        padding: 8,
        marginLeft: -8,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
    },
    tabs: {
        flexDirection: 'row',
        backgroundColor: colors.white,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    tab: {
        flex: 1,
        paddingVertical: 14,
        alignItems: 'center',
        borderBottomWidth: 2,
        borderBottomColor: 'transparent',
    },
    activeTab: {
        borderBottomColor: colors.text,
    },
    tabText: {
        fontSize: 14,
        fontWeight: '500',
        color: colors.textSecondary,
    },
    activeTabText: {
        color: colors.text,
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingVertical: 8,
    },
    userItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: colors.background,
    },
    avatarContainer: {
        marginRight: 12,
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
    },
    avatarPlaceholder: {
        backgroundColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
    },
    userInfo: {
        flex: 1,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    userName: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
    },
    userHandle: {
        fontSize: 13,
        color: colors.textSecondary,
        marginTop: 2,
    },
    followButton: {
        backgroundColor: colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderRadius: 8,
        minWidth: 80,
        alignItems: 'center',
    },
    followingButton: {
        backgroundColor: colors.border,
    },
    followButtonText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.white,
    },
    followingButtonText: {
        color: colors.text,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
    },
    emptyText: {
        marginTop: 12,
        fontSize: 15,
        color: colors.textSecondary,
    },
});
