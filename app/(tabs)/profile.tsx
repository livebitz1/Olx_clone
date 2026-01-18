import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/OTPAuthContext';

const { width } = Dimensions.get('window');
const GRID_ITEM_SIZE = (width - 48) / 3;

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
  primaryDark: '#1D4ED8',
  success: '#10B981',
  successLight: '#D1FAE5',
  warning: '#F59E0B',
  warningLight: '#FEF3C7',
  danger: '#EF4444',
  dangerLight: '#FEE2E2',
};

// Available avatars for selection
const AVATAR_OPTIONS = [
  require('../../assets/images/react-logo.png'),
  require('../../assets/images/partial-react-logo.png'),
  require('../../assets/images/icon.png'),
];

// Mock user data type
type UserProfile = {
  id: string;
  username: string;
  fullName: string;
  email: string;
  phone: string;
  avatarIndex: number;
  bio: string;
  location: string;
  joinedDate: string;
  isVerified: boolean;
  notificationsEnabled: boolean;
  darkModeEnabled: boolean;
  stats: {
    activeListings: number;
    itemsSold: number;
    rating: number;
    reviews: number;
  };
  listings: Listing[];
};

type Listing = {
  id: string;
  title: string;
  price: string;
  image: any;
  isSold: boolean;
  views: number;
  likes: number;
};

// Initial user data
const INITIAL_USER: UserProfile = {
  id: 'current',
  username: 'johndoe',
  fullName: 'John Doe',
  email: 'john.doe@example.com',
  phone: '+1 (555) 123-4567',
  avatarIndex: 0,
  bio: 'Passionate about quality items. Fast response & reliable seller. 📦',
  location: 'San Francisco, CA',
  joinedDate: 'March 2023',
  isVerified: true,
  notificationsEnabled: true,
  darkModeEnabled: false,
  stats: {
    activeListings: 8,
    itemsSold: 24,
    rating: 4.9,
    reviews: 42,
  },
  listings: [
    { id: 'p1', title: 'Vintage Camera', price: '$150', image: require('../../assets/images/icon.png'), isSold: false, views: 234, likes: 18 },
    { id: 'p2', title: 'Leather Jacket', price: '$85', image: require('../../assets/images/partial-react-logo.png'), isSold: false, views: 156, likes: 12 },
    { id: 'p3', title: 'Headphones', price: '$45', image: require('../../assets/images/react-logo.png'), isSold: true, views: 89, likes: 8 },
    { id: 'p4', title: 'Coffee Table', price: '$120', image: require('../../assets/images/icon.png'), isSold: false, views: 312, likes: 24 },
    { id: 'p5', title: 'Desk Lamp', price: '$35', image: require('../../assets/images/partial-react-logo.png'), isSold: false, views: 78, likes: 5 },
    { id: 'p6', title: 'Bookshelf', price: '$95', image: require('../../assets/images/react-logo.png'), isSold: true, views: 145, likes: 11 },
    { id: 'p7', title: 'Plant Pot', price: '$25', image: require('../../assets/images/icon.png'), isSold: false, views: 67, likes: 4 },
    { id: 'p8', title: 'Wall Art', price: '$60', image: require('../../assets/images/partial-react-logo.png'), isSold: false, views: 198, likes: 15 },
  ],
};

// Stat Item Component
const StatItem: React.FC<{ value: string | number; label: string }> = ({ value, label }) => (
  <TouchableOpacity style={styles.statItem} activeOpacity={0.7}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </TouchableOpacity>
);

// Rating Stars Component
const RatingStars: React.FC<{ rating: number }> = ({ rating }) => (
  <View style={styles.ratingContainer}>
    {[1, 2, 3, 4, 5].map((star) => (
      <Ionicons
        key={star}
        name={star <= Math.floor(rating) ? 'star' : star - 0.5 <= rating ? 'star-half' : 'star-outline'}
        size={14}
        color={colors.warning}
      />
    ))}
    <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
    <Text style={styles.ratingSubtext}>(42 reviews)</Text>
  </View>
);

// Listing Grid Item Component with enhanced UI
const ListingGridItem: React.FC<{
  listing: Listing;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ listing, onPress, onEdit, onDelete }) => {
  const [showActions, setShowActions] = useState(false);

  return (
    <TouchableOpacity
      style={styles.gridItem}
      onPress={onPress}
      onLongPress={() => setShowActions(true)}
      activeOpacity={0.8}
    >
      <Image source={listing.image} style={styles.gridImage} />
      {listing.isSold && (
        <View style={styles.soldBadge}>
          <Text style={styles.soldBadgeText}>SOLD</Text>
        </View>
      )}
      <View style={styles.gridItemOverlay}>
        <Text style={styles.gridPrice}>{listing.price}</Text>
        <View style={styles.gridStats}>
          <Ionicons name="eye-outline" size={10} color={colors.white} />
          <Text style={styles.gridStatText}>{listing.views}</Text>
          <Ionicons name="heart-outline" size={10} color={colors.white} style={{ marginLeft: 6 }} />
          <Text style={styles.gridStatText}>{listing.likes}</Text>
        </View>
      </View>

      {/* Quick Actions Modal */}
      <Modal visible={showActions} transparent animationType="fade">
        <TouchableOpacity
          style={styles.actionsOverlay}
          activeOpacity={1}
          onPress={() => setShowActions(false)}
        >
          <View style={styles.actionsMenu}>
            <Text style={styles.actionsTitle}>{listing.title}</Text>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => {
                setShowActions(false);
                onEdit();
              }}
            >
              <Ionicons name="pencil-outline" size={20} color={colors.primary} />
              <Text style={styles.actionText}>Edit Listing</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionItem}
              onPress={() => {
                setShowActions(false);
                onPress();
              }}
            >
              <Ionicons name="eye-outline" size={20} color={colors.text} />
              <Text style={styles.actionText}>View Details</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionItem, styles.actionItemDanger]}
              onPress={() => {
                setShowActions(false);
                onDelete();
              }}
            >
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
              <Text style={[styles.actionText, { color: colors.danger }]}>Delete Listing</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </TouchableOpacity>
  );
};

// Edit Profile Modal Component
const EditProfileModal: React.FC<{
  visible: boolean;
  user: UserProfile;
  onClose: () => void;
  onSave: (updatedUser: Partial<UserProfile>) => void;
}> = ({ visible, user, onClose, onSave }) => {
  const [fullName, setFullName] = useState(user.fullName);
  const [username, setUsername] = useState(user.username);
  const [bio, setBio] = useState(user.bio);
  const [location, setLocation] = useState(user.location);
  const [email, setEmail] = useState(user.email);
  const [phone, setPhone] = useState(user.phone);
  const [selectedAvatarIndex, setSelectedAvatarIndex] = useState(user.avatarIndex);

  const handleSave = () => {
    if (!fullName.trim() || !username.trim()) {
      Alert.alert('Error', 'Name and username are required');
      return;
    }
    onSave({
      fullName: fullName.trim(),
      username: username.trim(),
      bio: bio.trim(),
      location: location.trim(),
      email: email.trim(),
      phone: phone.trim(),
      avatarIndex: selectedAvatarIndex,
    });
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={handleSave} style={styles.modalSaveButton}>
              <Text style={styles.modalSaveText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Avatar Selection */}
            <View style={styles.avatarSection}>
              <Text style={styles.inputLabel}>Profile Photo</Text>
              <View style={styles.avatarOptions}>
                {AVATAR_OPTIONS.map((avatar, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.avatarOption,
                      selectedAvatarIndex === index && styles.avatarOptionSelected,
                    ]}
                    onPress={() => setSelectedAvatarIndex(index)}
                  >
                    <Image source={avatar} style={styles.avatarOptionImage} />
                    {selectedAvatarIndex === index && (
                      <View style={styles.avatarCheckmark}>
                        <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                      </View>
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Form Fields */}
            <View style={styles.formSection}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Enter your full name"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Username</Text>
                <View style={styles.usernameInput}>
                  <Text style={styles.usernamePrefix}>@</Text>
                  <TextInput
                    style={[styles.textInput, styles.usernameTextInput]}
                    value={username}
                    onChangeText={setUsername}
                    placeholder="username"
                    placeholderTextColor={colors.textTertiary}
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Bio</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={bio}
                  onChangeText={setBio}
                  placeholder="Tell others about yourself..."
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  numberOfLines={3}
                  maxLength={150}
                />
                <Text style={styles.charCount}>{bio.length}/150</Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Location</Text>
                <View style={styles.iconInput}>
                  <Ionicons name="location-outline" size={20} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.textInput, styles.iconTextInput]}
                    value={location}
                    onChangeText={setLocation}
                    placeholder="City, State"
                    placeholderTextColor={colors.textTertiary}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Email</Text>
                <View style={styles.iconInput}>
                  <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.textInput, styles.iconTextInput]}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="email@example.com"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone</Text>
                <View style={styles.iconInput}>
                  <Ionicons name="call-outline" size={20} color={colors.textSecondary} />
                  <TextInput
                    style={[styles.textInput, styles.iconTextInput]}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="+1 (555) 000-0000"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>
            </View>

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

// Settings Modal Component
const SettingsModal: React.FC<{
  visible: boolean;
  user: UserProfile;
  onClose: () => void;
  onUpdate: (settings: Partial<UserProfile>) => void;
  onLogout: () => void;
}> = ({ visible, user, onClose, onUpdate, onLogout }) => {
  const [darkMode, setDarkMode] = useState(user.darkModeEnabled);

  const handleDarkModeToggle = (value: boolean) => {
    setDarkMode(value);
    onUpdate({ darkModeEnabled: value });
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <SafeAreaView style={styles.modalContainer}>
        {/* Modal Header */}
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Settings</Text>
          <View style={{ width: 60 }} />
        </View>

        <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
          {/* Account Section */}
          <Text style={styles.settingsSectionTitle}>Account</Text>
          <View style={styles.settingsCard}>
            <TouchableOpacity style={styles.settingsItem}>
              <View style={styles.settingsItemLeft}>
                <View style={[styles.settingsIcon, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="person-outline" size={20} color={colors.primary} />
                </View>
                <Text style={styles.settingsItemText}>Account Information</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingsItem}>
              <View style={styles.settingsItemLeft}>
                <View style={[styles.settingsIcon, { backgroundColor: colors.successLight }]}>
                  <Ionicons name="shield-checkmark-outline" size={20} color={colors.success} />
                </View>
                <Text style={styles.settingsItemText}>Privacy & Security</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>

          {/* Preferences Section */}
          <Text style={styles.settingsSectionTitle}>Preferences</Text>
          <View style={styles.settingsCard}>
            <View style={styles.settingsItem}>
              <View style={styles.settingsItemLeft}>
                <View style={[styles.settingsIcon, { backgroundColor: '#F1F5F9' }]}>
                  <Ionicons name="moon-outline" size={20} color={colors.text} />
                </View>
                <Text style={styles.settingsItemText}>Dark Mode</Text>
              </View>
              <Switch
                value={darkMode}
                onValueChange={handleDarkModeToggle}
                trackColor={{ false: colors.border, true: colors.primaryLight }}
                thumbColor={darkMode ? colors.primary : colors.textTertiary}
              />
            </View>

            <TouchableOpacity style={styles.settingsItem}>
              <View style={styles.settingsItemLeft}>
                <View style={[styles.settingsIcon, { backgroundColor: colors.successLight }]}>
                  <Ionicons name="language-outline" size={20} color={colors.success} />
                </View>
                <Text style={styles.settingsItemText}>Language</Text>
              </View>
              <View style={styles.settingsItemRight}>
                <Text style={styles.settingsItemValue}>English</Text>
                <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
              </View>
            </TouchableOpacity>
          </View>

          {/* Support Section */}
          <Text style={styles.settingsSectionTitle}>Support</Text>
          <View style={styles.settingsCard}>
            <TouchableOpacity style={styles.settingsItem}>
              <View style={styles.settingsItemLeft}>
                <View style={[styles.settingsIcon, { backgroundColor: colors.primaryLight }]}>
                  <Ionicons name="help-circle-outline" size={20} color={colors.primary} />
                </View>
                <Text style={styles.settingsItemText}>Help Center</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingsItem}>
              <View style={styles.settingsItemLeft}>
                <View style={[styles.settingsIcon, { backgroundColor: colors.warningLight }]}>
                  <Ionicons name="chatbox-outline" size={20} color={colors.warning} />
                </View>
                <Text style={styles.settingsItemText}>Contact Us</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingsItem}>
              <View style={styles.settingsItemLeft}>
                <View style={[styles.settingsIcon, { backgroundColor: '#F1F5F9' }]}>
                  <Ionicons name="document-text-outline" size={20} color={colors.text} />
                </View>
                <Text style={styles.settingsItemText}>Terms of Service</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>

          {/* Logout Button */}
          <TouchableOpacity style={styles.logoutFullButton} onPress={onLogout}>
            <Ionicons name="log-out-outline" size={20} color={colors.danger} />
            <Text style={styles.logoutFullButtonText}>Log Out</Text>
          </TouchableOpacity>

          <Text style={styles.versionText}>Version 1.0.0</Text>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

// Quick Stats Card Component - Enhanced
const QuickStatsCard: React.FC<{ user: UserProfile }> = ({ user }) => {
  const totalViews = user.listings.reduce((acc, l) => acc + l.views, 0);
  const totalLikes = user.listings.reduce((acc, l) => acc + l.likes, 0);
  const activeListings = user.listings.filter((l) => !l.isSold).length;
  const conversionRate = totalViews > 0 ? ((user.stats.itemsSold / (user.stats.itemsSold + activeListings)) * 100).toFixed(1) : '0';
  const engagementRate = totalViews > 0 ? ((totalLikes / totalViews) * 100).toFixed(1) : '0';

  // Mock trends (positive or negative percentage)
  const viewsTrend = 12.5;
  const likesTrend = 8.3;
  const salesTrend = -2.1;

  return (
    <View style={styles.quickStatsCard}>
      {/* Header */}
      <View style={styles.quickStatsHeader}>
        <View>
          <Text style={styles.quickStatsTitle}>Your Performance</Text>
          <Text style={styles.quickStatsSubtitle}>Last 30 days</Text>
        </View>
        <TouchableOpacity style={styles.quickStatsMoreBtn} activeOpacity={0.7}>
          <Ionicons name="analytics-outline" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Main Stats Row */}
      <View style={styles.quickStatsMainRow}>
        {/* Views */}
        <TouchableOpacity style={styles.quickStatCard} activeOpacity={0.8}>
          <View style={styles.quickStatCardHeader}>
            <View style={[styles.quickStatIconSmall, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="eye" size={16} color={colors.primary} />
            </View>
            <View style={[styles.trendBadge, viewsTrend >= 0 ? styles.trendPositive : styles.trendNegative]}>
              <Ionicons 
                name={viewsTrend >= 0 ? "trending-up" : "trending-down"} 
                size={10} 
                color={viewsTrend >= 0 ? colors.success : colors.danger} 
              />
              <Text style={[styles.trendText, viewsTrend >= 0 ? styles.trendTextPositive : styles.trendTextNegative]}>
                {Math.abs(viewsTrend)}%
              </Text>
            </View>
          </View>
          <Text style={styles.quickStatCardValue}>{totalViews.toLocaleString()}</Text>
          <Text style={styles.quickStatCardLabel}>Total Views</Text>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: '75%', backgroundColor: colors.primary }]} />
          </View>
        </TouchableOpacity>

        {/* Likes */}
        <TouchableOpacity style={styles.quickStatCard} activeOpacity={0.8}>
          <View style={styles.quickStatCardHeader}>
            <View style={[styles.quickStatIconSmall, { backgroundColor: colors.dangerLight }]}>
              <Ionicons name="heart" size={16} color={colors.danger} />
            </View>
            <View style={[styles.trendBadge, likesTrend >= 0 ? styles.trendPositive : styles.trendNegative]}>
              <Ionicons 
                name={likesTrend >= 0 ? "trending-up" : "trending-down"} 
                size={10} 
                color={likesTrend >= 0 ? colors.success : colors.danger} 
              />
              <Text style={[styles.trendText, likesTrend >= 0 ? styles.trendTextPositive : styles.trendTextNegative]}>
                {Math.abs(likesTrend)}%
              </Text>
            </View>
          </View>
          <Text style={styles.quickStatCardValue}>{totalLikes.toLocaleString()}</Text>
          <Text style={styles.quickStatCardLabel}>Total Likes</Text>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: '60%', backgroundColor: colors.danger }]} />
          </View>
        </TouchableOpacity>
      </View>

      {/* Secondary Stats Row */}
      <View style={styles.quickStatsSecondaryRow}>
        {/* Items Sold */}
        <View style={styles.secondaryStatItem}>
          <View style={styles.secondaryStatLeft}>
            <View style={[styles.secondaryStatDot, { backgroundColor: colors.success }]} />
            <Text style={styles.secondaryStatLabel}>Items Sold</Text>
          </View>
          <View style={styles.secondaryStatRight}>
            <Text style={styles.secondaryStatValue}>{user.stats.itemsSold}</Text>
            <View style={[styles.trendBadgeSmall, salesTrend >= 0 ? styles.trendPositive : styles.trendNegative]}>
              <Ionicons 
                name={salesTrend >= 0 ? "arrow-up" : "arrow-down"} 
                size={8} 
                color={salesTrend >= 0 ? colors.success : colors.danger} 
              />
            </View>
          </View>
        </View>

        {/* Conversion Rate */}
        <View style={styles.secondaryStatItem}>
          <View style={styles.secondaryStatLeft}>
            <View style={[styles.secondaryStatDot, { backgroundColor: colors.warning }]} />
            <Text style={styles.secondaryStatLabel}>Conversion</Text>
          </View>
          <View style={styles.secondaryStatRight}>
            <Text style={styles.secondaryStatValue}>{conversionRate}%</Text>
          </View>
        </View>

        {/* Engagement Rate */}
        <View style={styles.secondaryStatItem}>
          <View style={styles.secondaryStatLeft}>
            <View style={[styles.secondaryStatDot, { backgroundColor: colors.primary }]} />
            <Text style={styles.secondaryStatLabel}>Engagement</Text>
          </View>
          <View style={styles.secondaryStatRight}>
            <Text style={styles.secondaryStatValue}>{engagementRate}%</Text>
          </View>
        </View>
      </View>

      {/* Quick Insights */}
      <View style={styles.insightsContainer}>
        <View style={styles.insightItem}>
          <Ionicons name="bulb-outline" size={16} color={colors.warning} />
          <Text style={styles.insightText}>
            Your listings get {engagementRate}% more likes than average!
          </Text>
        </View>
      </View>
    </View>
  );
};

// Main Profile Screen
export default function ProfileScreen() {
  const router = useRouter();
  const { signOut, user: authUser } = useAuth();
  const [user, setUser] = useState<UserProfile>(INITIAL_USER);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'sold'>('active');

  // Update user profile
  const handleUpdateProfile = useCallback((updates: Partial<UserProfile>) => {
    setUser((prev) => ({ ...prev, ...updates }));
    Alert.alert('Success', 'Profile updated successfully!');
  }, []);

  // Update settings
  const handleUpdateSettings = useCallback((updates: Partial<UserProfile>) => {
    setUser((prev) => ({ ...prev, ...updates }));
  }, []);

  // Handle logout
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            // Navigation will be handled automatically by the auth guard
          },
        },
      ]
    );
  };

  // Handle listing actions
  const handleListingPress = (listingId: string) => {
    router.push(`/listing/${listingId}`);
  };

  const handleEditListing = (listingId: string) => {
    Alert.alert('Edit Listing', `Editing listing ${listingId}`);
  };

  const handleDeleteListing = (listingId: string) => {
    Alert.alert(
      'Delete Listing',
      'Are you sure you want to delete this listing?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setUser((prev) => ({
              ...prev,
              listings: prev.listings.filter((l) => l.id !== listingId),
              stats: {
                ...prev.stats,
                activeListings: prev.stats.activeListings - 1,
              },
            }));
            Alert.alert('Success', 'Listing deleted successfully!');
          },
        },
      ]
    );
  };

  const activeListings = user.listings.filter((l) => !l.isSold);
  const soldListings = user.listings.filter((l) => l.isSold);
  const displayedListings = activeTab === 'active' ? activeListings : soldListings;

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Profile</Text>
        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => setShowSettingsModal(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="settings-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Header */}
        <View style={styles.header}>
          {/* Avatar & Stats Row */}
          <View style={styles.avatarStatsRow}>
            <TouchableOpacity
              style={styles.avatarWrapper}
              onPress={() => setShowEditModal(true)}
              activeOpacity={0.8}
            >
              <Image source={AVATAR_OPTIONS[user.avatarIndex]} style={styles.avatar} />
              {user.isVerified && (
                <View style={styles.verifiedBadge}>
                  <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                </View>
              )}
              <View style={styles.editAvatarBadge}>
                <Ionicons name="camera" size={14} color={colors.white} />
              </View>
            </TouchableOpacity>

            <View style={styles.statsRow}>
              <StatItem value={user.stats.activeListings} label="Listings" />
              <StatItem value={user.stats.itemsSold} label="Sold" />
              <StatItem value={user.stats.reviews} label="Reviews" />
            </View>
          </View>

          {/* User Info */}
          <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.fullName}>{user.fullName}</Text>
              {user.isVerified && (
                <View style={styles.verifiedTag}>
                  <Ionicons name="shield-checkmark" size={12} color={colors.primary} />
                  <Text style={styles.verifiedTagText}>Verified</Text>
                </View>
              )}
            </View>
            <Text style={styles.username}>@{user.username}</Text>

            <View style={styles.locationRow}>
              <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
              <Text style={styles.location}>{user.location}</Text>
              <Text style={styles.joinedDate}>• Joined {user.joinedDate}</Text>
            </View>

            <Text style={styles.bio}>{user.bio}</Text>

            <RatingStars rating={user.stats.rating} />
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setShowEditModal(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="pencil-outline" size={18} color={colors.primary} />
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.shareButton}
              onPress={() => Alert.alert('Share', 'Share profile functionality')}
              activeOpacity={0.8}
            >
              <Ionicons name="share-outline" size={18} color={colors.text} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Stats */}
        <QuickStatsCard user={user} />

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'active' && styles.tabActive]}
            onPress={() => setActiveTab('active')}
          >
            <Ionicons
              name="grid-outline"
              size={20}
              color={activeTab === 'active' ? colors.primary : colors.textSecondary}
            />
            <Text style={[styles.tabText, activeTab === 'active' && styles.tabTextActive]}>
              Active ({activeListings.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'sold' && styles.tabActive]}
            onPress={() => setActiveTab('sold')}
          >
            <Ionicons
              name="checkmark-done-outline"
              size={20}
              color={activeTab === 'sold' ? colors.primary : colors.textSecondary}
            />
            <Text style={[styles.tabText, activeTab === 'sold' && styles.tabTextActive]}>
              Sold ({soldListings.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Listings Grid */}
        {displayedListings.length > 0 ? (
          <View style={styles.listingsGrid}>
            {displayedListings.map((listing) => (
              <ListingGridItem
                key={listing.id}
                listing={listing}
                onPress={() => handleListingPress(listing.id)}
                onEdit={() => handleEditListing(listing.id)}
                onDelete={() => handleDeleteListing(listing.id)}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyStateIcon}>
              <Ionicons
                name={activeTab === 'active' ? 'cube-outline' : 'bag-check-outline'}
                size={48}
                color={colors.textTertiary}
              />
            </View>
            <Text style={styles.emptyStateTitle}>
              {activeTab === 'active' ? 'No active listings' : 'No sold items yet'}
            </Text>
            <Text style={styles.emptyStateSubtitle}>
              {activeTab === 'active'
                ? 'Start selling by creating your first listing'
                : 'Your sold items will appear here'}
            </Text>
            {activeTab === 'active' && (
              <TouchableOpacity style={styles.emptyStateButton}>
                <Ionicons name="add" size={20} color={colors.white} />
                <Text style={styles.emptyStateButtonText}>Create Listing</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Edit Profile Modal */}
      <EditProfileModal
        visible={showEditModal}
        user={user}
        onClose={() => setShowEditModal(false)}
        onSave={handleUpdateProfile}
      />

      {/* Settings Modal */}
      <SettingsModal
        visible={showSettingsModal}
        user={user}
        onClose={() => setShowSettingsModal(false)}
        onUpdate={handleUpdateSettings}
        onLogout={handleLogout}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topBarTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // Header
  header: {
    backgroundColor: colors.white,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },
  avatarStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: colors.primaryLight,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 2,
  },
  editAvatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: colors.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.white,
  },
  statsRow: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginLeft: 20,
  },
  statItem: {
    alignItems: 'center',
    padding: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  statLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // User Info
  userInfo: {
    marginBottom: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fullName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
  },
  verifiedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  verifiedTagText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary,
  },
  username: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  location: {
    fontSize: 13,
    color: colors.textSecondary,
    marginLeft: 4,
  },
  joinedDate: {
    fontSize: 13,
    color: colors.textTertiary,
    marginLeft: 6,
  },
  bio: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    marginTop: 12,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 6,
  },
  ratingSubtext: {
    fontSize: 12,
    color: colors.textSecondary,
    marginLeft: 4,
  },

  // Action Buttons
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primaryLight,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
  },
  shareButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },

  // Quick Stats Card
  quickStatsCard: {
    backgroundColor: colors.white,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  quickStatsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  quickStatsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  quickStatsSubtitle: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 2,
  },
  quickStatsMoreBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickStatsMainRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  quickStatCard: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: 16,
    padding: 16,
  },
  quickStatCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  quickStatIconSmall: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickStatCardValue: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
  },
  quickStatCardLabel: {
    fontSize: 12,
    color: colors.textSecondary,
    marginTop: 4,
    marginBottom: 12,
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 2,
  },
  trendBadgeSmall: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trendPositive: {
    backgroundColor: colors.successLight,
  },
  trendNegative: {
    backgroundColor: colors.dangerLight,
  },
  trendText: {
    fontSize: 10,
    fontWeight: '600',
  },
  trendTextPositive: {
    color: colors.success,
  },
  trendTextNegative: {
    color: colors.danger,
  },
  quickStatsSecondaryRow: {
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  secondaryStatItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  secondaryStatLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  secondaryStatDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  secondaryStatLabel: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  secondaryStatRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  secondaryStatValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  insightsContainer: {
    marginTop: 16,
    backgroundColor: colors.warningLight,
    borderRadius: 12,
    padding: 12,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  insightText: {
    flex: 1,
    fontSize: 12,
    color: colors.text,
    lineHeight: 16,
  },
  quickStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  quickStatItem: {
    alignItems: 'center',
  },
  quickStatIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  quickStatLabel: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Tabs
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 6,
  },
  tabActive: {
    backgroundColor: colors.primaryLight,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.primary,
    fontWeight: '600',
  },

  // Listings Grid
  listingsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingTop: 16,
    gap: 6,
  },
  gridItem: {
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: colors.white,
  },
  gridImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  gridItemOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  gridPrice: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.white,
  },
  gridStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  gridStatText: {
    fontSize: 10,
    color: colors.white,
    marginLeft: 3,
  },
  soldBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: colors.danger,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  soldBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.white,
  },

  // Actions Menu
  actionsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsMenu: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 8,
    width: width - 64,
    maxWidth: 320,
  },
  actionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  actionItemDanger: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionText: {
    fontSize: 15,
    color: colors.text,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: 32,
  },
  emptyStateIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  emptyStateButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  modalSaveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  modalSaveText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.white,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },

  // Avatar Section
  avatarSection: {
    marginBottom: 24,
  },
  avatarOptions: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    marginTop: 12,
  },
  avatarOption: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: colors.border,
  },
  avatarOptionSelected: {
    borderColor: colors.primary,
  },
  avatarOptionImage: {
    width: '100%',
    height: '100%',
  },
  avatarCheckmark: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: colors.white,
    borderRadius: 12,
  },

  // Form Section
  formSection: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  charCount: {
    fontSize: 11,
    color: colors.textTertiary,
    textAlign: 'right',
    marginTop: 4,
  },
  usernameInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  usernamePrefix: {
    fontSize: 15,
    color: colors.textSecondary,
    marginRight: 2,
  },
  usernameTextInput: {
    flex: 1,
    borderWidth: 0,
    paddingLeft: 0,
  },
  iconInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 10,
  },
  iconTextInput: {
    flex: 1,
    borderWidth: 0,
  },

  // Settings Styles
  settingsSectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: 24,
    marginBottom: 12,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingsCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsItemText: {
    fontSize: 15,
    color: colors.text,
  },
  settingsItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  settingsItemValue: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  logoutFullButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.dangerLight,
    marginTop: 24,
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  logoutFullButtonText: {
    fontSize: 15,
    fontWeight: '600',
 color: colors.danger,
  },
  versionText: {
    fontSize: 12,
    color: colors.textTertiary,
    textAlign: 'center',
    marginTop: 24,
  },
});
