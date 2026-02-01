import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Pressable,
  Image,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons, Feather } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/OTPAuthContext';

const CATEGORIES = [
  { id: '1', name: 'Vehicles', icon: 'car-outline' },
  { id: '2', name: 'Electronics', icon: 'phone-portrait-outline' },
  { id: '3', name: 'Furniture', icon: 'bed-outline' },
  { id: '4', name: 'Fashion', icon: 'shirt-outline' },
  { id: '5', name: 'Sports', icon: 'basketball-outline' },
  { id: '6', name: 'Books', icon: 'book-outline' },
  { id: '7', name: 'Home & Garden', icon: 'home-outline' },
  { id: '8', name: 'Other', icon: 'ellipsis-horizontal-outline' },
];

const CONDITIONS = [
  { id: '1', name: 'New', description: 'Brand new, unused item' },
  { id: '2', name: 'Like New', description: 'Used once or twice, perfect condition' },
  { id: '3', name: 'Good', description: 'Minor signs of use, fully functional' },
  { id: '4', name: 'Fair', description: 'Visible wear, still works well' },
];

type FormData = {
  title: string;
  price: string;
  category: string;
  condition: string;
  location: string;
  description: string;
  images: string[];
};

type FormErrors = {
  title?: string;
  price?: string;
  category?: string;
  location?: string;
  description?: string;
  images?: string;
};

export default function PostAdScreen() {
  const { user } = useAuth();

  const [formData, setFormData] = useState<FormData>({
    title: '',
    price: '',
    category: '',
    condition: '',
    location: '',
    description: '',
    images: [],
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [conditionModalVisible, setConditionModalVisible] = useState(false);
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  // Fetch the current user's record from the users table (by Firebase UID)
  const [currentUserDbId, setCurrentUserDbId] = useState<string | null>(null);

  useEffect(() => {
    const fetchCurrentUserDbId = async () => {
      if (!user?.id) return;
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('id', user.id)
        .single();
      if (data && data.id) {
        setCurrentUserDbId(data.id);
      }
    };
    fetchCurrentUserDbId();
  }, [user]);

  const updateField = (field: keyof FormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const pickImage = async () => {
    if (formData.images.length >= 8) {
      Alert.alert('Limit Reached', 'You can only add up to 8 images.');
      return;
    }

    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photo library to add images.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images, // fallback for current Expo version
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      updateField('images', [...formData.images, result.assets[0].uri]);
    }
  };

  const removeImage = (index: number) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    updateField('images', newImages);
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    }

    if (!formData.price.trim()) {
      newErrors.price = 'Price is required';
    } else if (isNaN(Number(formData.price.replace(/[,$]/g, '')))) {
      newErrors.price = 'Please enter a valid price';
    }

    if (!formData.category) {
      newErrors.category = 'Please select a category';
    }

    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 20) {
      newErrors.description = 'Description must be at least 20 characters';
    }

    if (formData.images.length === 0) {
      newErrors.images = 'Please add at least one image';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const uploadImagesToSupabase = async (imageUris: string[], user_id: string) => {
    const uploadedUrls: string[] = [];
    for (let i = 0; i < imageUris.length; i++) {
      const uri = imageUris[i];
      const ext = uri.split('.').pop()?.split('?')[0] || 'jpg';
      const fileName = `${user_id}_${Date.now()}_${i}.${ext}`;
      // Read file as base64
      const base64 = await FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
      const binary = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0));
      const { data, error } = await supabase.storage
        .from('post-images')
        .upload(fileName, binary, { upsert: true, contentType: `image/${ext}` });
      if (error) {
        console.error('[Post Image Upload] Supabase error:', error.message, error);
        continue;
      }
      // Get public URL
      const { data: publicUrlData } = supabase.storage.from('post-images').getPublicUrl(fileName);
      if (publicUrlData?.publicUrl) {
        uploadedUrls.push(publicUrlData.publicUrl);
      }
    }
    return uploadedUrls;
  };

  // Simple UUID v4 generator
  const generateUUID = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }
    setIsSubmitting(true);
    // Upload images to Supabase Storage
    const user_id = currentUserDbId;
    if (!user_id) {
      Alert.alert('Error', 'User not authenticated. Please log in again.');
      setIsSubmitting(false);
      return;
    }
    const uploadedImageUrls = await uploadImagesToSupabase(formData.images, user_id);
    if (uploadedImageUrls.length === 0) {
      Alert.alert('Error', 'Failed to upload images. Please try again.');
      setIsSubmitting(false);
      return;
    }
    // Save post to Supabase
    const { error } = await supabase.from('posts').insert({
      id: generateUUID(), // Generate UUID client-side
      title: formData.title,
      price: formData.price,
      category: formData.category,
      condition: formData.condition,
      location: formData.location,
      description: formData.description,
      images: uploadedImageUrls, // array of image URLs
      user_id: user_id, // <-- Now set from users table
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    if (error) {
      console.error('Supabase insert error:', error);
      Alert.alert('Error', error.message || 'Failed to save post. Please try again.');
      setIsSubmitting(false);
      return;
    }
    setIsSubmitting(false);
    Alert.alert(
      'Ad Posted Successfully! 🎉',
      'Your listing is now live and visible to buyers.',
      [
        {
          text: 'Post Another',
          onPress: resetForm,
        },
        {
          text: 'Done',
          style: 'default',
        },
      ]
    );
  };

  const resetForm = () => {
    setFormData({
      title: '',
      price: '',
      category: '',
      condition: '',
      location: '',
      description: '',
      images: [],
    });
    setErrors({});
  };

  const getInputStyle = (field: string) => [
    styles.input,
    focusedField === field && styles.inputFocused,
    errors[field as keyof FormErrors] && styles.inputError,
  ];

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Post Your Ad</Text>
          <Pressable onPress={() => setPreviewModalVisible(true)} style={styles.previewButton}>
            <Feather name="eye" size={20} color="#2563eb" />
            <Text style={styles.previewText}>Preview</Text>
          </Pressable>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Image Upload Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Photos</Text>
            <Text style={styles.sectionSubtitle}>Add up to 8 photos. First image will be the cover.</Text>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.imageScrollView}
              contentContainerStyle={styles.imageContainer}
            >
              {/* Add Image Button */}
              <Pressable
                style={[styles.addImageButton, errors.images && styles.addImageButtonError]}
                onPress={pickImage}
              >
                <View style={styles.addImageContent}>
                  <Ionicons name="camera-outline" size={28} color="#64748b" />
                  <Text style={styles.addImageText}>Add Photo</Text>
                  <Text style={styles.imageCount}>{formData.images.length}/8</Text>
                </View>
              </Pressable>

              {/* Image Previews */}
              {formData.images.map((uri, index) => (
                <View key={index} style={styles.imagePreviewContainer}>
                  <Image source={{ uri }} style={styles.imagePreview} />
                  {index === 0 && (
                    <View style={styles.coverBadge}>
                      <Text style={styles.coverText}>Cover</Text>
                    </View>
                  )}
                  <Pressable
                    style={styles.removeImageButton}
                    onPress={() => removeImage(index)}
                  >
                    <Ionicons name="close" size={16} color="#fff" />
                  </Pressable>
                </View>
              ))}
            </ScrollView>
            {errors.images && <Text style={styles.errorText}>{errors.images}</Text>}
          </View>

          {/* Title */}
          <View style={styles.section}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={getInputStyle('title')}
              placeholder="What are you selling?"
              placeholderTextColor="#94a3b8"
              value={formData.title}
              onChangeText={(text) => updateField('title', text)}
              onFocus={() => setFocusedField('title')}
              onBlur={() => setFocusedField(null)}
              maxLength={70}
            />
            <View style={styles.inputFooter}>
              {errors.title ? (
                <Text style={styles.errorText}>{errors.title}</Text>
              ) : (
                <Text style={styles.helperText}>Be specific (e.g., "iPhone 14 Pro 256GB")</Text>
              )
              }
              <Text style={styles.charCount}>{formData.title.length}/70</Text>
            </View>
          </View>

          {/* Price */}
          <View style={styles.section}>
            <Text style={styles.label}>Price *</Text>
            <View style={[styles.priceInputContainer, focusedField === 'price' && styles.inputFocused, errors.price && styles.inputError]}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="0"
                placeholderTextColor="#94a3b8"
                keyboardType="numeric"
                value={formData.price}
                onChangeText={(text) => updateField('price', text.replace(/[^0-9.]/g, ''))}
                onFocus={() => setFocusedField('price')}
                onBlur={() => setFocusedField(null)}
              />
            </View>
            {errors.price && <Text style={styles.errorText}>{errors.price}</Text>}
          </View>

          {/* Category */}
          <View style={styles.section}>
            <Text style={styles.label}>Category *</Text>
            <Pressable
              style={[styles.selectButton, errors.category && styles.inputError]}
              onPress={() => setCategoryModalVisible(true)}
            >
              <View style={styles.selectContent}>
                {formData.category ? (
                  <>
                    <Ionicons
                      name={CATEGORIES.find(c => c.name === formData.category)?.icon as any || 'grid-outline'}
                      size={20}
                      color="#1e293b"
                    />
                    <Text style={styles.selectText}>{formData.category}</Text>
                  </>
                ) : (
                  <Text style={styles.selectPlaceholder}>Select a category</Text>
                )}
              </View>
              <Ionicons name="chevron-down" size={20} color="#64748b" />
            </Pressable>
            {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
          </View>

          {/* Condition */}
          <View style={styles.section}>
            <Text style={styles.label}>Condition</Text>
            <Pressable
              style={styles.selectButton}
              onPress={() => setConditionModalVisible(true)}
            >
              <View style={styles.selectContent}>
                {formData.condition ? (
                  <Text style={styles.selectText}>{formData.condition}</Text>
                ) : (
                  <Text style={styles.selectPlaceholder}>Select condition (optional)</Text>
                )}
              </View>
              <Ionicons name="chevron-down" size={20} color="#64748b" />
            </Pressable>
          </View>

          {/* Location */}
          <View style={styles.section}>
            <Text style={styles.label}>Location *</Text>
            <View style={[styles.locationInputContainer, focusedField === 'location' && styles.inputFocused, errors.location && styles.inputError]}>
              <Ionicons name="location-outline" size={20} color="#64748b" />
              <TextInput
                style={styles.locationInput}
                placeholder="City, State"
                placeholderTextColor="#94a3b8"
                value={formData.location}
                onChangeText={(text) => updateField('location', text)}
                onFocus={() => setFocusedField('location')}
                onBlur={() => setFocusedField(null)}
              />
            </View>
            {errors.location && <Text style={styles.errorText}>{errors.location}</Text>}
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                focusedField === 'description' && styles.inputFocused,
                errors.description && styles.inputError,
              ]}
              placeholder="Describe your item in detail. Include condition, features, and reason for selling."
              placeholderTextColor="#94a3b8"
              value={formData.description}
              onChangeText={(text) => updateField('description', text)}
              onFocus={() => setFocusedField('description')}
              onBlur={() => setFocusedField(null)}
              multiline
              numberOfLines={5}
              textAlignVertical="top"
              maxLength={1000}
            />
            <View style={styles.inputFooter}>
              {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
              <Text style={styles.charCount}>{formData.description.length}/1000</Text>
            </View>
          </View>

          {/* Tips Card */}
          <View style={styles.tipsCard}>
            <View style={styles.tipsHeader}>
              <Ionicons name="bulb-outline" size={20} color="#f59e0b" />
              <Text style={styles.tipsTitle}>Tips for a great listing</Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipText}>Use clear, well-lit photos</Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipText}>Set a competitive price</Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipText}>Be honest about the condition</Text>
            </View>
            <View style={styles.tipItem}>
              <Text style={styles.tipBullet}>•</Text>
              <Text style={styles.tipText}>Respond quickly to messages</Text>
            </View>
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.submitContainer}>
          <Pressable
            style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Text style={styles.submitButtonText}>Posting...</Text>
            ) : (
              <>
                <Ionicons name="checkmark-circle-outline" size={22} color="#fff" />
                <Text style={styles.submitButtonText}>Post Ad</Text>
              </>
            )}
          </Pressable>
        </View>

        {/* Category Modal */}
        <Modal
          visible={categoryModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setCategoryModalVisible(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <Pressable onPress={() => setCategoryModalVisible(false)}>
                <Ionicons name="close" size={24} color="#1e293b" />
              </Pressable>
            </View>
            <ScrollView style={styles.modalContent}>
              {CATEGORIES.map((category) => (
                <Pressable
                  key={category.id}
                  style={[
                    styles.categoryItem,
                    formData.category === category.name && styles.categoryItemSelected,
                  ]}
                  onPress={() => {
                    updateField('category', category.name);
                    setCategoryModalVisible(false);
                  }}
                >
                  <View style={styles.categoryIcon}>
                    <Ionicons name={category.icon as any} size={24} color="#2563eb" />
                  </View>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  {formData.category === category.name && (
                    <Ionicons name="checkmark-circle" size={24} color="#2563eb" />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* Condition Modal */}
        <Modal
          visible={conditionModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setConditionModalVisible(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Condition</Text>
              <Pressable onPress={() => setConditionModalVisible(false)}>
                <Ionicons name="close" size={24} color="#1e293b" />
              </Pressable>
            </View>
            <ScrollView style={styles.modalContent}>
              {CONDITIONS.map((condition) => (
                <Pressable
                  key={condition.id}
                  style={[
                    styles.conditionItem,
                    formData.condition === condition.name && styles.conditionItemSelected,
                  ]}
                  onPress={() => {
                    updateField('condition', condition.name);
                    setConditionModalVisible(false);
                  }}
                >
                  <View style={styles.conditionInfo}>
                    <Text style={styles.conditionName}>{condition.name}</Text>
                    <Text style={styles.conditionDescription}>{condition.description}</Text>
                  </View>
                  {formData.condition === condition.name && (
                    <Ionicons name="checkmark-circle" size={24} color="#2563eb" />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* Preview Modal */}
        <Modal
          visible={previewModalVisible}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setPreviewModalVisible(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Preview</Text>
              <Pressable onPress={() => setPreviewModalVisible(false)}>
                <Ionicons name="close" size={24} color="#1e293b" />
              </Pressable>
            </View>
            <ScrollView style={styles.previewContent}>
              {formData.images.length > 0 ? (
                <Image
                  source={{ uri: formData.images[0] }}
                  style={styles.previewImage}
                />
              ) : (
                <View style={styles.previewImagePlaceholder}>
                  <Ionicons name="image-outline" size={48} color="#cbd5e1" />
                  <Text style={styles.previewPlaceholderText}>No images added</Text>
                </View>
              )}
              <View style={styles.previewDetails}>
                <Text style={styles.previewPrice}>
                  {formData.price ? `$${formData.price}` : '$0'}
                </Text>
                <Text style={styles.previewTitle}>
                  {formData.title || 'Product Title'}
                </Text>
                <View style={styles.previewMeta}>
                  <Ionicons name="location-outline" size={16} color="#64748b" />
                  <Text style={styles.previewLocation}>
                    {formData.location || 'Location not set'}
                  </Text>
                </View>
                {formData.category && (
                  <View style={styles.previewCategory}>
                    <Text style={styles.previewCategoryText}>{formData.category}</Text>
                  </View>
                )}
                <Text style={styles.previewDescriptionLabel}>Description</Text>
                <Text style={styles.previewDescription}>
                  {formData.description || 'No description provided'}
                </Text>
              </View>
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#eff6ff',
    borderRadius: 20,
  },
  previewText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 20,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1e293b',
  },
  inputFocused: {
    borderColor: '#2563eb',
    backgroundColor: '#fff',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  textArea: {
    height: 120,
    paddingTop: 14,
  },
  inputFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  helperText: {
    fontSize: 12,
    color: '#94a3b8',
  },
  charCount: {
    fontSize: 12,
    color: '#94a3b8',
  },
  errorText: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 4,
  },
  priceInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginRight: 4,
  },
  priceInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
  },
  locationInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    gap: 10,
  },
  locationInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1e293b',
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  selectContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  selectText: {
    fontSize: 16,
    color: '#1e293b',
  },
  selectPlaceholder: {
    fontSize: 16,
    color: '#94a3b8',
  },
  imageScrollView: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  imageContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingRight: 20,
  },
  addImageButton: {
    width: 100,
    height: 100,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderStyle: 'dashed',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addImageButtonError: {
    borderColor: '#ef4444',
  },
  addImageContent: {
    alignItems: 'center',
    gap: 4,
  },
  addImageText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
  },
  imageCount: {
    fontSize: 11,
    color: '#94a3b8',
  },
  imagePreviewContainer: {
    position: 'relative',
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
  },
  coverBadge: {
    position: 'absolute',
    bottom: 6,
    left: 6,
    backgroundColor: '#2563eb',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  coverText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  removeImageButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 24,
    height: 24,
    backgroundColor: '#ef4444',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipsCard: {
    marginHorizontal: 20,
    backgroundColor: '#fffbeb',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fef3c7',
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  tipsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#92400e',
  },
  tipItem: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 6,
  },
  tipBullet: {
    color: '#f59e0b',
    fontSize: 14,
  },
  tipText: {
    fontSize: 14,
    color: '#78350f',
  },
  bottomPadding: {
    height: 100,
  },
  submitContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#2563eb',
    paddingVertical: 16,
    borderRadius: 14,
  },
  submitButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1e293b',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginBottom: 10,
  },
  categoryItemSelected: {
    backgroundColor: '#eff6ff',
    borderWidth: 1.5,
    borderColor: '#2563eb',
  },
  categoryIcon: {
    width: 48,
    height: 48,
    backgroundColor: '#fff',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  categoryName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  conditionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    marginBottom: 10,
  },
  conditionItemSelected: {
    backgroundColor: '#eff6ff',
    borderWidth: 1.5,
    borderColor: '#2563eb',
  },
  conditionInfo: {
    flex: 1,
  },
  conditionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  conditionDescription: {
    fontSize: 13,
    color: '#64748b',
  },
  // Preview Modal Styles
  previewContent: {
    flex: 1,
  },
  previewImage: {
    width: '100%',
    height: 280,
    backgroundColor: '#e2e8f0',
  },
  previewImagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewPlaceholderText: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 8,
  },
  previewDetails: {
    padding: 20,
  },
  previewPrice: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1e293b',
    marginBottom: 8,
  },
  previewTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 12,
  },
  previewMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  previewLocation: {
    fontSize: 14,
    color: '#64748b',
  },
  previewCategory: {
    alignSelf: 'flex-start',
    backgroundColor: '#eff6ff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
  },
  previewCategoryText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563eb',
  },
  previewDescriptionLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  previewDescription: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 22,
  },
});
