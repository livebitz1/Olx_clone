import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
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
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/OTPAuthContext';
import { supabase } from '@/lib/supabase';
import type { Listing, User } from '@/lib/types';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';

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

// Default avatar for users without profile picture
const DEFAULT_AVATAR = require('../../assets/images/icon.png');

// Format date to "Month Year"
const formatJoinDate = (date: Date): string => {
  return new Date(date).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

// Format phone number for display
const formatPhoneDisplay = (phone: string, countryCode: string): string => {
  return `+${countryCode} ${phone}`;
};

// Stat Item Component
const StatItem: React.FC<{ value: string | number; label: string }> = ({ value, label }) => (
  <TouchableOpacity style={styles.statItem} activeOpacity={0.7}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </TouchableOpacity>
);

// Listing Grid Item Component
const ListingGridItem: React.FC<{
  listing: Listing;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ listing, onPress, onEdit, onDelete }) => {
  const [showActions, setShowActions] = useState(false);

  // Use first image or default
  const imageSource = listing.images && listing.images.length > 0
    ? { uri: listing.images[0] }
    : DEFAULT_AVATAR;

  return (
    <TouchableOpacity
      style={styles.gridItem}
      onPress={onPress}
      onLongPress={() => setShowActions(true)}
      activeOpacity={0.8}
    >
      <Image source={imageSource} style={styles.gridImage} resizeMode="cover" />
      {listing.isSold && (
        <View style={styles.soldBadge}>
          <Text style={styles.soldBadgeText}>SOLD</Text>
        </View>
      )}
      <View style={styles.gridItemOverlay}>
        <Text style={styles.gridPrice}>₹{Number(listing.price).toLocaleString()}</Text>
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
  user: User;
  onClose: () => void;
  onSave: (updates: Partial<User>) => Promise<void>;
  isSaving: boolean;
}> = ({ visible, user, onClose, onSave, isSaving }) => {
  const [name, setName] = useState(user.name || '');
  const [bio, setBio] = useState(user.bio || '');
  const [location, setLocation] = useState(user.location || '');
  const [email, setEmail] = useState(user.email || '');
  const [avatar, setAvatar] = useState(user.avatar || null);
  const [uploading, setUploading] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      setName(user.name || '');
      setBio(user.bio || '');
      setLocation(user.location || '');
      setEmail(user.email || '');
      setAvatar(user.avatar || null);
    }
  }, [visible, user]);

  // Pick image and upload to Supabase
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // fallback for current Expo version
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets && result.assets[0].uri) {
      setUploading(true);
      try {
        const uri = result.assets[0].uri;
        // Get extension from mime type or uri
        let ext = 'jpg';
        if (result.assets[0].type && result.assets[0].type.startsWith('image/')) {
          ext = result.assets[0].type.split('/')[1];
        } else if (uri.lastIndexOf('.') !== -1) {
          ext = uri.substring(uri.lastIndexOf('.') + 1).split('?')[0];
        }
        // Only allow safe extensions
        if (!['jpg', 'jpeg', 'png', 'webp'].includes(ext.toLowerCase())) ext = 'jpg';
        const fileName = `${user.id}.${ext}`;
        // Delete old avatar if exists and is not default
        if (user.avatar && !user.avatar.includes('icon.png')) {
          const oldFileName = user.avatar.split('/').pop();
          if (oldFileName) {
            await supabase.storage.from('avatars').remove([oldFileName]);
          }
        }
        // Read file as base64
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: 'base64',
        });
        // Convert base64 → Uint8Array
        const binary = Uint8Array.from(
          atob(base64),
          (char) => char.charCodeAt(0)
        );
        // Upload to Supabase Storage (avatars bucket)
        const { error } = await supabase.storage
          .from('avatars')
          .upload(fileName, binary, { upsert: true, contentType: `image/${ext}` });
        if (error) {
          console.error('[Avatar Upload] Supabase error:', error.message, error);
          Alert.alert('Upload failed', error.message || 'Could not upload image.');
          setUploading(false);
          return;
        }
        // Get public URL
        const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
        if (publicUrlData?.publicUrl) {
          // Update user's avatar field in Supabase
          const { error: updateError } = await supabase
            .from('users')
            .update({ avatar: publicUrlData.publicUrl })
            .eq('id', user.id);
          if (updateError) {
            console.error('[Avatar Update] Supabase error:', updateError.message, updateError);
          }
          // Refetch user profile from Supabase after update
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('avatar')
            .eq('id', user.id)
            .single();
          let avatarUrl = publicUrlData.publicUrl;
          if (userError) {
            console.error('[Avatar Fetch] Supabase error:', userError.message, userError);
          } else if (userData?.avatar) {
            avatarUrl = userData.avatar;
          }
          // Add cache-busting query string
          setAvatar(`${avatarUrl}?t=${Date.now()}`);
        } else {
          throw new Error('Could not get public URL');
        }
      } catch (e) {
        console.error('[Avatar Upload] Exception:', e);
        Alert.alert('Upload failed', 'Could not upload image.');
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }
    await onSave({
      name: name.trim(),
      bio: bio.trim() || null,
      location: location.trim() || null,
      email: email.trim() || null,
      avatar: avatar || null,
    });
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
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton} disabled={isSaving || uploading}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TouchableOpacity onPress={handleSave} style={styles.modalSaveButton} disabled={isSaving || uploading}>
              {isSaving ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <Text style={styles.modalSaveText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Avatar Picker */}
            <View style={{ alignItems: 'center', marginBottom: 24 }}>
              <TouchableOpacity onPress={pickImage} disabled={uploading} style={{ alignItems: 'center' }}>
                <Image
                  source={avatar ? { uri: avatar } : DEFAULT_AVATAR}
                  style={{ width: 90, height: 90, borderRadius: 45, borderWidth: 2, borderColor: colors.primaryLight }}
                />
                <View style={{ position: 'absolute', bottom: 0, right: 0, backgroundColor: colors.primary, borderRadius: 12, padding: 2 }}>
                  {uploading ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Ionicons name="camera" size={18} color={colors.white} />
                  )}
                </View>
              </TouchableOpacity>
              <Text style={{ color: colors.textTertiary, fontSize: 13, marginTop: 6 }}>Tap to change photo</Text>
            </View>

            {/* Form Fields */}
            <View style={styles.formSection}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name *</Text>
                <TextInput
                  style={styles.textInput}
                  value={name}
                  onChangeText={setName}
                  placeholder="Enter your full name"
                  placeholderTextColor={colors.textTertiary}
                />
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

              {/* Phone (Read-only) */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone (cannot be changed)</Text>
                <View style={[styles.iconInput, styles.disabledInput]}>
                  <Ionicons name="call-outline" size={20} color={colors.textTertiary} />
                  <Text style={styles.disabledText}>
                    {formatPhoneDisplay(user.phone, user.countryCode)}
                  </Text>
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
  onClose: () => void;
  onLogout: () => void;
}> = ({ visible, onClose, onLogout }) => {
  const [darkMode, setDarkMode] = useState(false);

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
                onValueChange={setDarkMode}
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

// Quick Stats Card Component
const QuickStatsCard: React.FC<{ listings: Listing[] }> = ({ listings }) => {
  const totalViews = listings.reduce((acc, l) => acc + l.views, 0);
  const totalLikes = listings.reduce((acc, l) => acc + l.likes, 0);
  const activeListings = listings.filter((l) => !l.isSold).length;
  const soldItems = listings.filter((l) => l.isSold).length;
  const conversionRate = listings.length > 0 ? ((soldItems / listings.length) * 100).toFixed(1) : '0';
  const engagementRate = totalViews > 0 ? ((totalLikes / totalViews) * 100).toFixed(1) : '0';

  return (
    <View style={styles.quickStatsCard}>
      {/* Header */}
      <View style={styles.quickStatsHeader}>
        <View>
          <Text style={styles.quickStatsTitle}>Your Performance</Text>
          <Text style={styles.quickStatsSubtitle}>All time stats</Text>
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
          </View>
          <Text style={styles.quickStatCardValue}>{totalViews.toLocaleString()}</Text>
          <Text style={styles.quickStatCardLabel}>Total Views</Text>
        </TouchableOpacity>

        {/* Likes */}
        <TouchableOpacity style={styles.quickStatCard} activeOpacity={0.8}>
          <View style={styles.quickStatCardHeader}>
            <View style={[styles.quickStatIconSmall, { backgroundColor: colors.dangerLight }]}>
              <Ionicons name="heart" size={16} color={colors.danger} />
            </View>
          </View>
          <Text style={styles.quickStatCardValue}>{totalLikes.toLocaleString()}</Text>
          <Text style={styles.quickStatCardLabel}>Total Likes</Text>
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
            <Text style={styles.secondaryStatValue}>{soldItems}</Text>
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
    </View>
  );
};

// Main Profile Screen
export default function ProfileScreen() {
  const router = useRouter();
  const { signOut, user, updateUser } = useAuth();

  // State
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoadingListings, setIsLoadingListings] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [activeTab, setActiveTab] = useState<'active' | 'sold'>('active');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    if (!user) return;
    setRefreshing(true);
    // Re-fetch listings
    await fetchListings();
    // Also re-fetch user profile data if we had a method for it, but fetchListings is the main dynamic content here.
    // If we wanted to reload user data, we'd need to expose a reload function from useAuth or manually fetch.
    // For now, refreshing listings is the primary action.
    setRefreshing(false);
  }, [fetchListings, user]);

  // Fetch user's listings from Supabase
  const fetchListings = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoadingListings(true);
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[Profile] Error fetching listings:', error.message);
      } else {
        // Map created_at to createdAt for frontend usage
        setListings((data || []).map((item) => ({
          ...item,
          createdAt: item.created_at,
        })));
      }
    } catch (error) {
      console.error('[Profile] Exception fetching listings:', error);
    } finally {
      setIsLoadingListings(false);
    }
  }, [user]);

  // Fetch listings on mount
  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  // Update user profile
  const handleUpdateProfile = useCallback(async (updates: Partial<User>) => {
    try {
      setIsSavingProfile(true);
      await updateUser(updates);
      setShowEditModal(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('[Profile] Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setIsSavingProfile(false);
    }
  }, [updateUser]);

  // Handle logout
  const handleLogout = () => {
    setShowSettingsModal(false);

    setTimeout(() => {
      Alert.alert(
        'Logout',
        'Are you sure you want to logout?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Logout',
            style: 'destructive',
            onPress: async () => {
              console.log('[Profile] Logging out...');
              try {
                await signOut();
                console.log('[Profile] ✓ Logout successful');
                router.replace('/auth/login');
              } catch (error) {
                console.error('[Profile] Logout error:', error);
                router.replace('/auth/login');
              }
            },
          },
        ]
      );
    }, 300);
  };

  // Handle listing actions
  const handleListingPress = (listingId: string) => {
    router.push(`/listing/${listingId}`);
  };

  const handleEditListing = (listingId: string) => {
    Alert.alert('Edit Listing', `Editing listing ${listingId}`);
  };

  const handleDeleteListing = async (listingId: string) => {
    Alert.alert(
      'Delete Listing',
      'Are you sure you want to delete this listing?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('posts')
                .delete()
                .eq('id', listingId);

              if (error) {
                Alert.alert('Error', 'Failed to delete listing');
                return;
              }

              setListings((prev) => prev.filter((l) => l.id !== listingId));
              Alert.alert('Success', 'Listing deleted successfully!');
            } catch (error) {
              console.error('[Profile] Delete listing error:', error);
              Alert.alert('Error', 'Failed to delete listing');
            }
          },
        },
      ]
    );
  };

  // If user is not logged in, show loading
  if (!user) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  const activeListings = listings.filter((l) => !l.isSold);
  const soldListings = listings.filter((l) => l.isSold);
  const displayedListings = activeTab === 'active' ? activeListings : soldListings;

  // Avatar source
  const avatarSource = user.avatar ? { uri: user.avatar } : DEFAULT_AVATAR;

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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
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
              <Image source={avatarSource} style={styles.avatar} />
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
              <StatItem value={activeListings.length} label="Listings" />
              <StatItem value={soldListings.length} label="Sold" />
              <StatItem value={0} label="Followers" />
            </View>
          </View>

          {/* User Info */}
          <View style={styles.userInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.fullName}>{user.name || 'User'}</Text>
              {user.isVerified && (
                <View style={styles.verifiedTag}>
                  <Ionicons name="shield-checkmark" size={12} color={colors.primary} />
                  <Text style={styles.verifiedTagText}>Verified</Text>
                </View>
              )}
            </View>
            <Text style={styles.username}>{formatPhoneDisplay(user.phone, user.countryCode)}</Text>

            {(user.location || user.createdAt) && (
              <View style={styles.locationRow}>
                {user.location && (
                  <>
                    <Ionicons name="location-outline" size={14} color={colors.textSecondary} />
                    <Text style={styles.location}>{user.location}</Text>
                  </>
                )}
                <Text style={styles.joinedDate}>
                  {user.location ? '• ' : ''}Joined {formatJoinDate(user.createdAt)}
                </Text>
              </View>
            )}

            {user.bio && <Text style={styles.bio}>{user.bio}</Text>}
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
        <QuickStatsCard listings={listings} />

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
        {isLoadingListings ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : displayedListings.length > 0 ? (
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
              <TouchableOpacity
                style={styles.emptyStateButton}
                onPress={() => router.push('/(tabs)/post')}
              >
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
        isSaving={isSavingProfile}
      />

      {/* Settings Modal */}
      <SettingsModal
        visible={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
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
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
  disabledInput: {
    backgroundColor: colors.border,
  },
  disabledText: {
    fontSize: 15,
    color: colors.textTertiary,
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
