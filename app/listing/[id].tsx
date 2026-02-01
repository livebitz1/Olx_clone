import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  Pressable,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/OTPAuthContext';
import { getAuth } from 'firebase/auth';
import { getOrCreateChat } from '@/lib/chat';

const { width } = Dimensions.get('window');
const IMAGE_HEIGHT = 360;

export default function ProductDetails() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const id = (params as any).id;

  const navigation: any = useNavigation();
  const { user } = useAuth();

  useEffect(() => {
    if (navigation && typeof navigation.setOptions === 'function') {
      navigation.setOptions({ headerShown: false });
    }
  }, [navigation]);

  const [product, setProduct] = useState<any>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<ScrollView | null>(null);

  useEffect(() => {
    const fetchProduct = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('posts')
        .select('*, user:users(id, name, avatar)')
        .eq('id', id)
        .single();
      if (error) {
        setProduct(null);
      } else {
        setProduct(data);
      }
      setLoading(false);
    };
    if (id) fetchProduct();
  }, [id]);

  const onScroll = (e: any) => {
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.round(x / width);
    setActiveIndex(index);
  };

  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session && session.user) {
        setSessionUserId(session.user.id);
      }
    });
  }, []);

  // Fetch the current user's record from the users table (by Firebase UID)
  const [currentUserDbId, setCurrentUserDbId] = useState<string | null>(null);
  useEffect(() => {
    const fetchCurrentUserDbId = async () => {
      const firebaseUserId = getAuth().currentUser?.uid;
      if (!firebaseUserId) return;
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('id', firebaseUserId)
        .single();
      if (data && data.id) {
        setCurrentUserDbId(data.id);
      }
    };
    fetchCurrentUserDbId();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={{ textAlign: 'center', marginTop: 40 }}>Loading...</Text>
      </SafeAreaView>
    );
  }
  if (!product) {
    return (
      <SafeAreaView style={styles.safe}>
        <Text style={{ textAlign: 'center', marginTop: 40 }}>Product not found.</Text>
      </SafeAreaView>
    );
  }

  // Owner check: use users.id from users table
  const isOwner = currentUserDbId && product.user_id && currentUserDbId === product.user_id;

  // Seller info
  const sellerName = product.user?.name || 'Unknown';
  const sellerAvatar = product.user?.avatar ? { uri: product.user.avatar } : undefined;

  // Edit functionality
  const handleEdit = () => {
    Alert.alert('Edit Listing', 'Edit functionality coming soon!');
  };

  // Delete functionality
  const handleDelete = async () => {
    Alert.alert(
      'Delete Listing',
      'Are you sure you want to permanently delete this listing? This action cannot be undone. All associated data will be removed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase.from('posts').delete().eq('id', id);
              if (error) {
                Alert.alert('Error', error.message || 'Failed to delete listing.');
              } else {
                Alert.alert('Deleted', 'Your listing has been deleted successfully.', [
                  {
                    text: 'OK',
                    onPress: () => router.replace('/'),
                  },
                ]);
              }
            } catch (err) {
              Alert.alert('Error', 'An unexpected error occurred while deleting the listing.');
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Enhanced header */}
      <View style={styles.topBar}>
        <Pressable
          onPress={() => navigation?.goBack?.()}
          style={styles.headerButton}
          android_ripple={{ color: '#00000010', borderless: true }}
        >
          <Ionicons name="arrow-back" size={24} color={TEXT} />
        </Pressable>

        <View style={styles.headerActions}>
          <Pressable
            onPress={() => Alert.alert('Share', 'Share functionality')}
            style={styles.headerButton}
          >
            <Ionicons name="share-outline" size={22} color={TEXT} />
          </Pressable>
          <Pressable
            onPress={() => setIsFavorited(!isFavorited)}
            style={styles.headerButton}
          >
            <Ionicons
              name={isFavorited ? "heart" : "heart-outline"}
              size={22}
              color={isFavorited ? "#EF4444" : TEXT}
            />
          </Pressable>
        </View>
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Image carousel */}
        <View style={styles.imageContainer}>
          <ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={onScroll}
            scrollEventThrottle={16}
          >
            {Array.isArray(product.images) && product.images.map((img: string, i: number) => (
              <Image key={i} source={{ uri: img }} style={styles.image} resizeMode="cover" />
            ))}
          </ScrollView>

          <View style={styles.pagination}>
            {Array.isArray(product.images) && product.images.map((_: string, i: number) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  i === activeIndex && styles.dotActive,
                ]}
              />
            ))}
          </View>

          <View style={styles.imageCounter}>
            <Ionicons name="images-outline" size={14} color="#FFF" />
            <Text style={styles.imageCounterText}>
              {activeIndex + 1}/{product.images.length}
            </Text>
          </View>
        </View>

        {/* Main content card */}
        <View style={styles.contentCard}>
          {/* Price and title section */}
          <View style={styles.priceSection}>
            <View>
              <Text style={styles.price}>₹{Number(product.price).toLocaleString()}</Text>
              <Text style={styles.title}>{product.title}</Text>
            </View>
          </View>

          {/* Meta info pills */}
          <View style={styles.metaRow}>
            <View style={styles.metaPill}>
              <Ionicons name="time-outline" size={14} color={MUTED} />
              <Text style={styles.metaText}>{product.postedDate}</Text>
            </View>
            <View style={styles.metaPill}>
              <Ionicons name="eye-outline" size={14} color={MUTED} />
              <Text style={styles.metaText}>{product.views} views</Text>
            </View>
            <View style={styles.metaPill}>
              <Ionicons name="pricetag-outline" size={14} color={MUTED} />
              <Text style={styles.metaText}>{product.category}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Location and condition */}
          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <View style={styles.infoIconCircle}>
                <Ionicons name="location" size={18} color={ACCENT} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Location</Text>
                <Text style={styles.infoValue}>{product.location}</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoIconCircle}>
                <MaterialIcons name="verified" size={18} color="#10B981" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Condition</Text>
                <Text style={styles.infoValue}>{product.condition}</Text>
              </View>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Description */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Feather name="file-text" size={18} color={TEXT} />
              <Text style={styles.sectionTitle}>Description</Text>
            </View>
            <Text style={styles.description}>{product.description}</Text>
          </View>

          <View style={styles.divider} />

          {/* Seller card - only for non-owners */}
          {!isOwner && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="person-circle-outline" size={18} color={TEXT} />
                <Text style={styles.sectionTitle}>Seller Information</Text>
              </View>
              <View style={styles.sellerCard}>
                <View style={styles.sellerLeft}>
                  <Image source={sellerAvatar} style={styles.avatar} />
                  <View style={styles.sellerInfo}>
                    <View style={styles.sellerNameRow}>
                      <Text style={styles.sellerName}>{sellerName}</Text>
                      {product.user?.verified && (
                        <MaterialIcons name="verified" size={16} color={ACCENT} />
                      )}
                    </View>
                    <View style={styles.ratingRow}>
                      <Ionicons name="star" size={14} color="#FFA500" />
                      <Text style={styles.sellerRating}>{product.user?.rating}</Text>
                      <Text style={styles.memberSince}>• {product.user?.memberSince}</Text>
                    </View>
                  </View>
                </View>

                <Pressable
                  style={styles.viewProfileButton}
                  onPress={() => {
                    router.push(`/profile/${product.user.id}`);
                  }}
                >
                  <Text style={styles.viewProfileText}>View</Text>
                  <Ionicons name="chevron-forward" size={16} color={ACCENT} />
                </Pressable>
              </View>
            </View>
          )}

          {/* Safety tips - only for non-owners */}
          {!isOwner && (
            <View style={styles.tipsCard}>
              <View style={styles.tipsHeader}>
                <Ionicons name="shield-checkmark" size={20} color="#10B981" />
                <Text style={styles.tipsTitle}>Safety Tips</Text>
              </View>
              <Text style={styles.tipsText}>
                {'• Meet in a public place\n• Check the item before purchasing\n• Pay only after collecting the item'}
              </Text>
            </View>
          )}

          {/* Owner-specific or public view */}
          {isOwner ? (
            <View style={{ marginVertical: 16, padding: 16, backgroundColor: '#E0F2FE', borderRadius: 12 }}>
              <Text style={{ color: '#0369A1', fontWeight: '700', fontSize: 16, marginBottom: 6 }}>This is your listing</Text>
              <Text style={{ color: '#0369A1', marginBottom: 10 }}>You can delete this post.</Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Pressable style={{ backgroundColor: '#EF4444', padding: 10, borderRadius: 8 }} onPress={handleDelete}>
                  <Text style={{ color: '#FFF', fontWeight: '700' }}>Delete</Text>
                </Pressable>
              </View>
            </View>
          ) : null}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Action bar for non-owners only */}
      {!isOwner && (
        <View style={styles.actionBar}>
          <Pressable
            style={[styles.actionButton, styles.chatButton]}
            onPress={async () => {
              if (!user) {
                Alert.alert('Please log in', 'You need to be logged in to message the seller.');
                return;
              }
              if (user.id === product.user.id) {
                Alert.alert('Error', 'You cannot message yourself.');
                return;
              }

              const { chatId, error } = await getOrCreateChat(user.id, product.user.id, id);
              if (error) {
                Alert.alert('Error', 'Failed to start conversation.');
                return;
              }
              if (chatId) {
                router.push(`/chat/${chatId}`);
              }
            }}
          >
            <Ionicons name="chatbubble-outline" size={20} color={ACCENT} />
            <Text style={styles.chatText}>Message</Text>
          </Pressable>

          <Pressable
            style={[styles.actionButton, styles.callButton]}
            onPress={() => {
              router.push(`/profile/${product.user.id}`);
            }}
          >
            <Ionicons name="person" size={20} color="#FFF" />
            <Text style={styles.callText}>View Profile</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const ACCENT = '#2F80ED';
const BG = '#F8FAFC';
const CARD = '#FFFFFF';
const TEXT = '#111827';
const MUTED = '#6B7280';

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },
  topBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    backgroundColor: CARD,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 4,
  },
  container: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
    backgroundColor: '#000',
  },
  image: {
    width: width,
    height: IMAGE_HEIGHT,
    backgroundColor: '#F3F4F6',
  },
  pagination: {
    position: 'absolute',
    bottom: 16,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFF',
    opacity: 0.5,
  },
  dotActive: {
    width: 20,
    opacity: 1,
  },
  imageCounter: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  imageCounterText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  contentCard: {
    backgroundColor: CARD,
    marginTop: -20,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  priceSection: {
    marginBottom: 16,
  },
  price: {
    fontSize: 28,
    fontWeight: '800',
    color: ACCENT,
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: TEXT,
    lineHeight: 28,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
    flexWrap: 'wrap',
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: BG,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  metaText: {
    fontSize: 12,
    color: MUTED,
    fontWeight: '500',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 20,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 16,
  },
  infoItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: BG,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: MUTED,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: TEXT,
  },
  section: {
    marginBottom: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT,
  },
  description: {
    fontSize: 14,
    lineHeight: 22,
    color: MUTED,
  },
  sellerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: BG,
    padding: 12,
    borderRadius: 12,
  },
  sellerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 12,
    borderWidth: 2,
    borderColor: CARD,
  },
  sellerInfo: {
    flex: 1,
  },
  sellerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  sellerName: {
    fontSize: 15,
    fontWeight: '700',
    color: TEXT,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sellerRating: {
    fontSize: 13,
    fontWeight: '600',
    color: TEXT,
  },
  memberSince: {
    fontSize: 12,
    color: MUTED,
  },
  viewProfileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 2,
  },
  viewProfileText: {
    color: ACCENT,
    fontWeight: '600',
    fontSize: 13,
  },
  tipsCard: {
    backgroundColor: '#F0FDF4',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#166534',
  },
  tipsText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#15803D',
  },
  actionBar: {
    position: 'absolute',
    left: 20,
    right: 20,
    bottom: 20,
    flexDirection: 'row',
    gap: 12,
    backgroundColor: 'transparent',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 12,
    paddingVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  chatButton: {
    backgroundColor: CARD,
    borderWidth: 1.5,
    borderColor: ACCENT,
  },
  chatText: {
    color: ACCENT,
    fontWeight: '700',
    fontSize: 15,
  },
  callButton: {
    backgroundColor: ACCENT,
  },
  callText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 15,
  },
});