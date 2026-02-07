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
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/OTPAuthContext';
import { getAuth } from 'firebase/auth';
import { getOrCreateChat } from '@/lib/chat';
import { toggleFavorite, isFavorited as checkIsFavorited } from '@/lib/favorites';

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
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
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

  useEffect(() => {
    const checkFavoriteStatus = async () => {
      if (currentUserDbId && id) {
        const favorited = await checkIsFavorited(currentUserDbId, id);
        setIsFavorited(favorited);
      }
    };
    checkFavoriteStatus();
  }, [currentUserDbId, id]);

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
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase.from('posts').delete().eq('id', id);
      if (error) {
        Alert.alert('Error', error.message || 'Failed to delete listing.');
        setIsDeleting(false);
        setDeleteModalVisible(false);
      } else {
        setDeleteModalVisible(false);
        router.replace('/');
      }
    } catch (err) {
      Alert.alert('Error', 'An unexpected error occurred while deleting the listing.');
      setIsDeleting(false);
      setDeleteModalVisible(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.deleteCard}>
            <View style={styles.trashCircle}>
              <Ionicons name="trash-outline" size={32} color="#EF4444" />
            </View>
            <Text style={styles.deleteTitle}>Delete listing?</Text>
            <Text style={styles.deleteSubtitle}>
              Are you sure you want to permanently delete this listing? This action cannot be undone.
            </Text>
            <View style={styles.deleteActions}>
              <Pressable
                style={styles.cancelButton}
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Dismiss</Text>
              </Pressable>
              <Pressable
                style={[styles.confirmDeleteButton, isDeleting && styles.disabledButton]}
                onPress={confirmDelete}
                disabled={isDeleting}
              >
                <Text style={styles.confirmDeleteText}>
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false} bounces={false}>
        {/* Image carousel with Overlayed Buttons */}
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
              <Image key={i} source={{ uri: img }} style={styles.image} resizeMode="contain" />
            ))}
          </ScrollView>

          {/* Floating Header Buttons */}
          <View style={styles.floatingHeader}>
            <Pressable
              onPress={() => navigation?.goBack?.()}
              style={styles.floatingButton}
            >
              <Ionicons name="arrow-back" size={24} color={TEXT} />
            </Pressable>

            <Pressable
              onPress={async () => {
                if (!currentUserDbId) {
                  Alert.alert('Login Required', 'Please login to save items.');
                  return;
                }
                const { favorited, error } = await toggleFavorite(currentUserDbId, id);
                if (error) {
                  Alert.alert('Error', 'Failed to update favorite status.');
                } else if (favorited !== null) {
                  setIsFavorited(favorited);
                }
              }}
              style={styles.floatingButton}
            >
              <Ionicons
                name={isFavorited ? "heart" : "heart-outline"}
                size={24}
                color={isFavorited ? "#EF4444" : TEXT}
              />
            </Pressable>
          </View>

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
        </View>

        {/* Main content */}
        <View style={styles.contentSection}>
          <Text style={styles.price}>Rs {Number(product.price).toLocaleString()} / month</Text>
          <Text style={styles.title}>{product.title}</Text>

          <View style={styles.tagRow}>
            {product.condition && (
              <View style={[styles.tag, styles.conditionTag]}>
                <Text style={styles.conditionTagText}>{product.condition}</Text>
              </View>
            )}
            {product.category && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>{product.category}</Text>
              </View>
            )}
          </View>

          <View style={styles.metaInfoRow}>
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={20} color={TEXT} />
              <Text style={styles.metaItemText}>{product.location}</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={20} color={TEXT} />
              <Text style={styles.metaItemText}>Posted 10 days ago</Text>
            </View>
          </View>

          {/* Description */}
          <View style={styles.detailsGroup}>
            <Text style={styles.groupTitle}>Description</Text>
            <Text style={styles.descriptionText}>{product.description}</Text>
          </View>

          {/* Product Details */}
          <View style={styles.detailsGroup}>
            <Text style={styles.groupTitle}>Product Details</Text>
            <View style={styles.specsList}>
              <View style={styles.specItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.specText}>{product.title}</Text>
              </View>
              <View style={styles.specItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.specText}>High Quality</Text>
              </View>
              <View style={styles.specItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.specText}>Condition: {product.condition}</Text>
              </View>
              <View style={styles.specItem}>
                <Text style={styles.bullet}>•</Text>
                <Text style={styles.specText}>Category: {product.category}</Text>
              </View>
            </View>
          </View>

          {/* Seller Information */}
          <View style={styles.detailsGroup}>
            <Text style={styles.groupTitle}>Seller Information</Text>
            <Pressable
              style={styles.sellerMinimalCard}
              onPress={() => router.push(`/profile/${product.user?.id}`)}
            >
              <Image source={sellerAvatar} style={styles.sellerAvatarSmall} />
              <View style={styles.sellerInfoBrief}>
                <Text style={styles.sellerNameBold}>{sellerName}</Text>
                <Text style={styles.sellerMetaBrief}>Superhost • joined in 2024</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
            </Pressable>
          </View>

          {/* Owner specific messages */}
          {isOwner && (
            <View style={styles.ownerNotice}>
              <Text style={styles.ownerNoticeText}>This is your listing. You can delete it below.</Text>
              <Pressable style={styles.ownerDeleteButton} onPress={handleDelete}>
                <Text style={styles.ownerDeleteButtonText}>Delete Listing</Text>
              </Pressable>
            </View>
          )}

          <View style={{ height: 120 }} />
        </View>
      </ScrollView>

      {/* Fixed Primary Action Button */}
      {!isOwner && (
        <View style={styles.footerAction}>
          <Pressable
            style={styles.chatWithSellerButton}
            onPress={async () => {
              if (!user) {
                Alert.alert('Please log in', 'You need to be logged in to message the seller.');
                return;
              }
              if (user.id === product.user?.id) {
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
            <Text style={styles.chatWithSellerText}>Chat with Seller</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFF" />
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const ACCENT = '#FF4D00';
const BG = '#FFFFFF';
const CARD = '#FFFFFF';
const TEXT = '#000000';
const MUTED = '#6B7280';

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },
  container: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
    backgroundColor: '#F3F4F6',
    height: IMAGE_HEIGHT,
  },
  image: {
    width: width,
    height: IMAGE_HEIGHT,
  },
  floatingHeader: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  floatingButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pagination: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#000',
    opacity: 0.2,
  },
  dotActive: {
    width: 24,
    opacity: 0.8,
  },
  contentSection: {
    padding: 24,
  },
  price: {
    fontSize: 32,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  title: {
    fontSize: 18,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 16,
  },
  tagRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
  },
  tag: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  conditionTag: {
    backgroundColor: '#DCFCE7',
  },
  conditionTagText: {
    fontSize: 14,
    color: '#166534',
    fontWeight: '500',
  },
  metaInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    marginBottom: 24,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaItemText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  detailsGroup: {
    marginBottom: 24,
  },
  groupTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#9CA3AF',
  },
  specsList: {
    gap: 8,
  },
  specItem: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  bullet: {
    fontSize: 20,
    color: '#374151',
  },
  specText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  sellerMinimalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 16,
  },
  sellerAvatarSmall: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  sellerInfoBrief: {
    flex: 1,
  },
  sellerNameBold: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 2,
  },
  sellerMetaBrief: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  footerAction: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  chatWithSellerButton: {
    backgroundColor: '#FF4D00',
    height: 60,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  chatWithSellerText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  ownerNotice: {
    backgroundColor: '#FFF5F0',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FFD7C2',
  },
  ownerNoticeText: {
    fontSize: 14,
    color: '#FF4D00',
    marginBottom: 12,
    fontWeight: '600',
  },
  ownerDeleteButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  ownerDeleteButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 24,
  },
  deleteCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
  },
  trashCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  deleteTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  deleteSubtitle: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  deleteActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#4B5563',
  },
  confirmDeleteButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#EF4444',
    alignItems: 'center',
  },
  confirmDeleteText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  disabledButton: {
    opacity: 0.5,
  },
});