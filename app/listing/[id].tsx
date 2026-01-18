import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  Dimensions,
  Pressable,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const IMAGE_HEIGHT = 360;

type Product = {
  id: string;
  title: string;
  price: string;
  location: string;
  description: string;
  images: any[];
  category: string;
  condition: string;
  postedDate: string;
  views: number;
  seller: {
    name: string;
    avatar: any;
    rating: number;
    memberSince: string;
    verified: boolean;
  };
};

// Local mock products
const MOCK_PRODUCTS: Product[] = [
  {
    id: 'l1',
    title: 'Compact Car — Low mileage',
    price: '$7,500',
    location: 'San Francisco, CA',
    category: 'Vehicles',
    condition: 'Used - Excellent',
    postedDate: '2 days ago',
    views: 234,
    description:
      'Well-maintained compact car with low mileage. Recent service and new tires. Ideal for city driving and economical commutes. Clean interior and a reliable engine.',
    images: [
      require('../../assets/images/react-logo.png'),
      require('../../assets/images/partial-react-logo.png'),
      require('../../assets/images/icon.png'),
    ],
    seller: {
      name: 'Alex Johnson',
      avatar: require('../../assets/images/partial-react-logo.png'),
      rating: 4.6,
      memberSince: 'Jan 2022',
      verified: true,
    },
  },
  {
    id: 'l2',
    title: 'Modern Sofa — 3-seater',
    price: '$250',
    location: 'Austin, TX',
    category: 'Furniture',
    condition: 'Used - Good',
    postedDate: '5 days ago',
    views: 89,
    description:
      'Comfortable 3-seater sofa in very good condition. Neutral color that fits most interiors. Smoke-free home. Measurements available on request.',
    images: [require('../../assets/images/icon.png'), require('../../assets/images/react-logo.png')],
    seller: {
      name: 'Maya Lee',
      avatar: require('../../assets/images/icon.png'),
      rating: 4.8,
      memberSince: 'Mar 2021',
      verified: true,
    },
  },
];

// Seller ID mapping for chat navigation
const SELLER_CHAT_IDS: Record<string, string> = {
  'Alex Johnson': 's1',
  'Maya Lee': 's2',
};

// Seller ID mapping for profile navigation
const SELLER_PROFILE_IDS: Record<string, string> = {
  'Alex Johnson': 'alexjohnson',
  'Maya Lee': 'mayalee',
};

export default function ProductDetails() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const id = (params as any).id ?? 'l1';

  const product = MOCK_PRODUCTS.find((p) => p.id === id) ?? MOCK_PRODUCTS[0];

  const navigation: any = useNavigation();

  useEffect(() => {
    if (navigation && typeof navigation.setOptions === 'function') {
      navigation.setOptions({ headerShown: false });
    }
  }, [navigation]);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isFavorited, setIsFavorited] = useState(false);
  const scrollRef = useRef<ScrollView | null>(null);

  const onScroll = (e: any) => {
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.round(x / width);
    setActiveIndex(index);
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
            {product.images.map((img, i) => (
              <Image key={i} source={img} style={styles.image} resizeMode="cover" />
            ))}
          </ScrollView>

          <View style={styles.pagination}>
            {product.images.map((_, i) => (
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
              <Text style={styles.price}>{product.price}</Text>
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

          {/* Seller card */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person-circle-outline" size={18} color={TEXT} />
              <Text style={styles.sectionTitle}>Seller Information</Text>
            </View>
            
            <View style={styles.sellerCard}>
              <View style={styles.sellerLeft}>
                <Image source={product.seller.avatar} style={styles.avatar} />
                <View style={styles.sellerInfo}>
                  <View style={styles.sellerNameRow}>
                    <Text style={styles.sellerName}>{product.seller.name}</Text>
                    {product.seller.verified && (
                      <MaterialIcons name="verified" size={16} color={ACCENT} />
                    )}
                  </View>
                  <View style={styles.ratingRow}>
                    <Ionicons name="star" size={14} color="#FFA500" />
                    <Text style={styles.sellerRating}>{product.seller.rating}</Text>
                    <Text style={styles.memberSince}>• {product.seller.memberSince}</Text>
                  </View>
                </View>
              </View>
              
              <Pressable
                style={styles.viewProfileButton}
                onPress={() => {
                  const profileId = SELLER_PROFILE_IDS[product.seller.name] || 'default';
                  router.push(`/profile/${profileId}`);
                }}
              >
                <Text style={styles.viewProfileText}>View</Text>
                <Ionicons name="chevron-forward" size={16} color={ACCENT} />
              </Pressable>
            </View>
          </View>

          {/* Safety tips */}
          <View style={styles.tipsCard}>
            <View style={styles.tipsHeader}>
              <Ionicons name="shield-checkmark" size={20} color="#10B981" />
              <Text style={styles.tipsTitle}>Safety Tips</Text>
            </View>
            <Text style={styles.tipsText}>
              • Meet in a public place{'\n'}
              • Check the item before purchasing{'\n'}
              • Pay only after collecting the item
            </Text>
          </View>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Action bar */}
      <View style={styles.actionBar}>
        <Pressable
          style={[styles.actionButton, styles.chatButton]}
          onPress={() => {
            const sellerId = SELLER_CHAT_IDS[product.seller.name] || 'default';
            router.push(`/chat/${sellerId}`);
          }}
        >
          <Ionicons name="chatbubble-outline" size={20} color={ACCENT} />
          <Text style={styles.chatText}>Message</Text>
        </Pressable>
        
        <Pressable
          style={[styles.actionButton, styles.callButton]}
          onPress={() => {
            const profileId = SELLER_PROFILE_IDS[product.seller.name] || 'default';
            router.push(`/profile/${profileId}`);
          }}
        >
          <Ionicons name="person" size={20} color="#FFF" />
          <Text style={styles.callText}>View Profile</Text>
        </Pressable>
      </View>
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