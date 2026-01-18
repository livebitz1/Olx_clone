import React, { useRef, useState } from 'react';
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
import { useLocalSearchParams } from 'expo-router';

const { width } = Dimensions.get('window');
const IMAGE_HEIGHT = 320;

type Product = {
  id: string;
  title: string;
  price: string;
  location: string;
  description: string;
  images: any[];
  seller: {
    name: string;
    avatar: any;
    rating: number;
  };
};

// Local mock products
const MOCK_PRODUCTS: Product[] = [
  {
    id: 'l1',
    title: 'Compact Car — Low mileage',
    price: '$7,500',
    location: 'San Francisco, CA',
    description:
      'Well-maintained compact car with low mileage. Recent service and new tires. Ideal for city driving and economical commutes. Clean interior and a reliable engine.',
    images: [
      require('../../../assets/images/react-logo.png'),
      require('../../../assets/images/partial-react-logo.png'),
      require('../../../assets/images/icon.png'),
    ],
    seller: {
      name: 'Alex Johnson',
      avatar: require('../../../assets/images/partial-react-logo.png'),
      rating: 4.6,
    },
  },
  {
    id: 'l2',
    title: 'Modern Sofa — 3-seater',
    price: '$250',
    location: 'Austin, TX',
    description:
      'Comfortable 3-seater sofa in very good condition. Neutral color that fits most interiors. Smoke-free home. Measurements available on request.',
    images: [require('../../../assets/images/icon.png'), require('../../../assets/images/react-logo.png')],
    seller: {
      name: 'Maya Lee',
      avatar: require('../../../assets/images/icon.png'),
      rating: 4.8,
    },
  },
];

export default function ProductDetails() {
  const params = useLocalSearchParams();
  const id = (params as any).id ?? 'l1';

  const product = MOCK_PRODUCTS.find((p) => p.id === id) ?? MOCK_PRODUCTS[0];

  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView | null>(null);

  const onScroll = (e: any) => {
    const x = e.nativeEvent.contentOffset.x;
    const index = Math.round(x / width);
    setActiveIndex(index);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
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
                  i === activeIndex ? styles.dotActive : { opacity: 0.4 },
                ]}
              />
            ))}
          </View>

          <View style={styles.content}>
            <Text style={styles.title}>{product.title}</Text>
            <View style={styles.rowBetween}>
              <Text style={styles.price}>{product.price}</Text>
              <Text style={styles.location}>{product.location}</Text>
            </View>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{product.description}</Text>

            <View style={styles.divider} />

            <Text style={styles.sectionTitle}>Seller Information</Text>
            <View style={styles.sellerRow}>
              <Image source={product.seller.avatar} style={styles.avatar} />
              <View style={{ flex: 1 }}>
                <Text style={styles.sellerName}>{product.seller.name}</Text>
                <Text style={styles.sellerRating}>Rating: {product.seller.rating} ★</Text>
              </View>
              <Pressable
                style={styles.viewProfile}
                onPress={() => Alert.alert('Seller profile', 'Profile UI not implemented (placeholder)')}
              >
                <Text style={styles.viewProfileText}>View</Text>
              </Pressable>
            </View>
          </View>
        </View>

        <View style={{ height: 120 }} />
        {/* spacer for action bar */}
      </ScrollView>

      <View style={styles.actionBar}>
        <Pressable
          style={[styles.actionButton, styles.chatButton]}
          onPress={() => Alert.alert('Chat', 'Chat UI not implemented (placeholder)')}
        >
          <Text style={styles.chatText}>Chat with Seller</Text>
        </Pressable>
        <Pressable
          style={[styles.actionButton, styles.callButton]}
          onPress={() => Alert.alert('Call', 'Call action simulated (placeholder)')}
        >
          <Text style={styles.callText}>Call Seller</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const ACCENT = '#2F80ED';
const BG = '#F7F9FB';
const CARD = '#FFFFFF';
const TEXT = '#0F1720';
const MUTED = '#6B7280';

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },
  container: {},
  card: {
    backgroundColor: CARD,
    margin: 16,
    borderRadius: 12,
    overflow: 'hidden',
    // shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.06,
    shadowRadius: 24,
    elevation: 6,
  },
  image: {
    width: width - 32,
    height: IMAGE_HEIGHT,
  },
  pagination: {
    position: 'absolute',
    top: IMAGE_HEIGHT - 28,
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
    backgroundColor: CARD,
    marginHorizontal: 6,
  },
  dotActive: {
    backgroundColor: ACCENT,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: TEXT,
    marginBottom: 8,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  price: {
    color: ACCENT,
    fontSize: 18,
    fontWeight: '700',
  },
  location: {
    color: MUTED,
    fontSize: 13,
  },
  divider: {
    height: 1,
    backgroundColor: '#EEF2F6',
    marginVertical: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: TEXT,
    marginBottom: 8,
  },
  description: {
    color: MUTED,
    lineHeight: 20,
    marginBottom: 8,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  sellerName: {
    fontWeight: '700',
    color: TEXT,
    marginBottom: 4,
  },
  sellerRating: {
    color: MUTED,
  },
  viewProfile: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F2F6FB',
    borderRadius: 8,
  },
  viewProfileText: {
    color: ACCENT,
    fontWeight: '600',
  },
  actionBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 24,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    // subtle shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  chatButton: {
    backgroundColor: '#FFFFFF',
  },
  chatText: {
    color: ACCENT,
    fontWeight: '700',
  },
  callButton: {
    backgroundColor: ACCENT,
  },
  callText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
