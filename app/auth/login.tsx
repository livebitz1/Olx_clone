import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  Animated,
  Dimensions,
  useWindowDimensions,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/OTPAuthContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type Country = {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
};

// Country list with India as default
const COUNTRIES: Country[] = [
  { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳' },
  { code: 'US', name: 'United States', dialCode: '+1', flag: '🇺🇸' },
  { code: 'GB', name: 'United Kingdom', dialCode: '+44', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada', dialCode: '+1', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺' },
  { code: 'DE', name: 'Germany', dialCode: '+49', flag: '🇩🇪' },
  { code: 'FR', name: 'France', dialCode: '+33', flag: '🇫🇷' },
  { code: 'JP', name: 'Japan', dialCode: '+81', flag: '🇯🇵' },
  { code: 'BR', name: 'Brazil', dialCode: '+55', flag: '🇧🇷' },
  { code: 'MX', name: 'Mexico', dialCode: '+52', flag: '🇲🇽' },
];

const OTP_LENGTH = 6; // Firebase uses 6-digit OTP

export default function LoginScreen() {
  const router = useRouter();
  const { sendOtp, verifyOtp, resendOtp, isAuthenticated, isLoading: authLoading } = useAuth();
  
  // Phone input state
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [isSendingOTP, setIsSendingOTP] = useState(false);
  
  // OTP state
  const [showOTPScreen, setShowOTPScreen] = useState(false);
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [otpError, setOtpError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  
  // Refs for OTP inputs
  const otpInputs = useRef<(TextInput | null)[]>([]);
  
  // Animation
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, authLoading]);

  // Resend timer countdown
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev: number) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  const formatPhoneNumber = (text: string): string => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length <= 5) {
      return cleaned;
    } else {
      return `${cleaned.slice(0, 5)} ${cleaned.slice(5, 10)}`;
    }
  };

  const handlePhoneChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    setPhoneNumber(formatted);
    setPhoneError('');
  };

  const getCleanPhoneNumber = (): string => {
    return phoneNumber.replace(/\D/g, '');
  };

  const validatePhone = (): boolean => {
    const cleanNumber = getCleanPhoneNumber();
    if (!cleanNumber) {
      setPhoneError('Phone number is required');
      return false;
    }
    if (cleanNumber.length < 10) {
      setPhoneError('Please enter a valid 10-digit phone number');
      return false;
    }
    return true;
  };

  const handleSendOTP = async () => {
    if (!validatePhone()) return;

    setIsSendingOTP(true);
    const cleanNumber = getCleanPhoneNumber();
    
    const result = await sendOtp(cleanNumber);
    
    setIsSendingOTP(false);
    
    if (!result.success) {
      setPhoneError(result.error || 'Failed to send OTP');
      return;
    }
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: -50,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowOTPScreen(true);
      setResendTimer(30);
      slideAnim.setValue(50);
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        otpInputs.current[0]?.focus();
      });
    });
  };

  const handleOTPChange = (text: string, index: number) => {
    const digit = text.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setOtpError('');

    if (digit && index < OTP_LENGTH - 1) {
      otpInputs.current[index + 1]?.focus();
    }
  };

  const handleOTPKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputs.current[index - 1]?.focus();
    }
  };

  const isOTPComplete = (): boolean => {
    return otp.every((digit: string) => digit !== '');
  };

  const handleVerifyOTP = async () => {
    if (!isOTPComplete()) {
      setOtpError('Please enter the complete OTP');
      return;
    }

    setIsVerifying(true);
    const cleanNumber = getCleanPhoneNumber();
    const enteredOTP = otp.join('');
    
    const result = await verifyOtp(cleanNumber, enteredOTP);
    
    setIsVerifying(false);
    
    if (result.success) {
      router.replace('/(tabs)');
    } else {
      setOtpError(result.error || 'Invalid OTP. Please try again.');
      setOtp(Array(OTP_LENGTH).fill(''));
      otpInputs.current[0]?.focus();
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;

    setOtp(Array(OTP_LENGTH).fill(''));
    setOtpError('');
    
    const cleanNumber = getCleanPhoneNumber();
    const result = await resendOtp(cleanNumber);
    
    if (result.success) {
      setResendTimer(30);
      otpInputs.current[0]?.focus();
    } else {
      setOtpError(result.error || 'Failed to resend OTP');
    }
  };

  const handleBackToPhone = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowOTPScreen(false);
      setOtp(Array(OTP_LENGTH).fill(''));
      setOtpError('');
      fadeAnim.setValue(1);
      slideAnim.setValue(0);
    });
  };

  const renderPhoneScreen = () => (
    <Animated.View 
      style={[
        styles.content,
        { opacity: fadeAnim, transform: [{ translateX: slideAnim }] },
      ]}
    >
      {/* Logo/Brand Section */}
      <View style={styles.brandSection}>
        <LinearGradient
          colors={['#2563eb', '#1d4ed8', '#1e40af']}
          style={styles.logoGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Ionicons name="storefront" size={32} color="#fff" />
        </LinearGradient>
        <Text style={styles.brandName}>Marketplace</Text>
        <Text style={styles.brandTagline}>Buy & Sell Anything</Text>
      </View>

      {/* Card Container */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Welcome Back</Text>
          <Text style={styles.cardSubtitle}>
            Enter your phone number to receive a verification code
          </Text>
        </View>

        <View style={styles.inputSection}>
          <Text style={styles.label}>Phone Number</Text>
          <View style={styles.phoneInputContainer}>
            <Pressable 
              style={styles.countrySelector}
              onPress={() => setCountryModalVisible(true)}
            >
              <Text style={styles.countryFlag}>{selectedCountry.flag}</Text>
              <Text style={styles.countryCode}>{selectedCountry.dialCode}</Text>
              <Ionicons name="chevron-down" size={14} color="#64748b" />
            </Pressable>

            <TextInput
              style={[styles.phoneInput, phoneError && styles.inputError]}
              placeholder="98765 43210"
              placeholderTextColor="#94a3b8"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={handlePhoneChange}
              maxLength={11}
              autoFocus
            />
          </View>
          {phoneError ? (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle" size={14} color="#ef4444" />
              <Text style={styles.errorText}>{phoneError}</Text>
            </View>
          ) : null}
        </View>

        <Pressable
          style={[
            styles.primaryButton,
            (!getCleanPhoneNumber() || isSendingOTP) && styles.primaryButtonDisabled,
          ]}
          onPress={handleSendOTP}
          disabled={!getCleanPhoneNumber() || isSendingOTP}
        >
          <LinearGradient
            colors={(!getCleanPhoneNumber() || isSendingOTP) ? ['#93c5fd', '#93c5fd'] : ['#2563eb', '#1d4ed8']}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {isSendingOTP ? (
              <Text style={styles.primaryButtonText}>Sending OTP...</Text>
            ) : (
              <>
                <Text style={styles.primaryButtonText}>Get OTP</Text>
                <Ionicons name="arrow-forward" size={20} color="#fff" />
              </>
            )}
          </LinearGradient>
        </Pressable>

        {/* Info Note */}
        <View style={styles.infoNote}>
          <Ionicons name="information-circle-outline" size={18} color="#64748b" />
          <Text style={styles.infoNoteText}>
            We'll send a 6-digit verification code to this number
          </Text>
        </View>
      </View>

      <Text style={styles.termsText}>
        By continuing, you agree to our{' '}
        <Text style={styles.termsLink}>Terms of Service</Text>
        {' '}and{' '}
        <Text style={styles.termsLink}>Privacy Policy</Text>
      </Text>
    </Animated.View>
  );

  const renderOTPScreen = () => (
    <Animated.View 
      style={[
        styles.content,
        { opacity: fadeAnim, transform: [{ translateX: slideAnim }] },
      ]}
    >
      <Pressable style={styles.backButton} onPress={handleBackToPhone}>
        <Ionicons name="arrow-back" size={22} color="#1e293b" />
      </Pressable>

      {/* OTP Card */}
      <View style={styles.card}>
        <View style={styles.otpHeader}>
          <LinearGradient
            colors={['#10b981', '#059669']}
            style={styles.otpIconGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Ionicons name="shield-checkmark" size={32} color="#fff" />
          </LinearGradient>
          <Text style={styles.cardTitle}>Verify OTP</Text>
          <Text style={styles.cardSubtitle}>
            Enter the {OTP_LENGTH}-digit code sent to{'\n'}
            <Text style={styles.phoneHighlight}>
              {selectedCountry.dialCode} {phoneNumber}
            </Text>
          </Text>
        </View>

        <View style={styles.otpSection}>
          <View style={styles.otpContainer}>
            {otp.map((digit: string, index: number) => (
              <TextInput
                key={index}
                ref={(ref: TextInput | null) => {
                  otpInputs.current[index] = ref;
                }}
                style={[
                  styles.otpInput,
                  digit && styles.otpInputFilled,
                  otpError && styles.otpInputError,
                ]}
                value={digit}
                onChangeText={(text: string) => handleOTPChange(text, index)}
                onKeyPress={(e) => handleOTPKeyPress(e, index)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
              />
            ))}
          </View>
          {otpError ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color="#ef4444" />
              <Text style={styles.errorText}>{otpError}</Text>
            </View>
          ) : null}
        </View>

        <Pressable
          style={[
            styles.primaryButton,
            (!isOTPComplete() || isVerifying) && styles.primaryButtonDisabled,
          ]}
          onPress={handleVerifyOTP}
          disabled={!isOTPComplete() || isVerifying}
        >
          <LinearGradient
            colors={(!isOTPComplete() || isVerifying) ? ['#93c5fd', '#93c5fd'] : ['#10b981', '#059669']}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {isVerifying ? (
              <Text style={styles.primaryButtonText}>Verifying...</Text>
            ) : (
              <>
                <Text style={styles.primaryButtonText}>Verify & Continue</Text>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
              </>
            )}
          </LinearGradient>
        </Pressable>

        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>Didn't receive the code?</Text>
          <Pressable onPress={handleResendOTP} disabled={resendTimer > 0}>
            <Text style={[styles.resendLink, resendTimer > 0 && styles.resendLinkDisabled]}>
              {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Security Note */}
      <View style={styles.securityNote}>
        <Ionicons name="lock-closed" size={16} color="#64748b" />
        <Text style={styles.securityNoteText}>
          Your information is protected with end-to-end encryption
        </Text>
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {showOTPScreen ? renderOTPScreen() : renderPhoneScreen()}
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal
        visible={countryModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setCountryModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Country</Text>
            <Pressable onPress={() => setCountryModalVisible(false)}>
              <Ionicons name="close" size={24} color="#1e293b" />
            </Pressable>
          </View>
          <ScrollView style={styles.modalContent}>
            {COUNTRIES.map((country: Country) => (
              <Pressable
                key={country.code}
                style={[
                  styles.countryItem,
                  selectedCountry.code === country.code && styles.countryItemSelected,
                ]}
                onPress={() => {
                  setSelectedCountry(country);
                  setCountryModalVisible(false);
                }}
              >
                <Text style={styles.countryItemFlag}>{country.flag}</Text>
                <Text style={styles.countryItemName}>{country.name}</Text>
                <Text style={styles.countryItemDialCode}>{country.dialCode}</Text>
                {selectedCountry.code === country.code && (
                  <Ionicons name="checkmark-circle" size={22} color="#2563eb" />
                )}
              </Pressable>
            ))}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: SCREEN_WIDTH > 400 ? 28 : 20,
    paddingVertical: SCREEN_HEIGHT > 700 ? 40 : 24,
    minHeight: SCREEN_HEIGHT - 100,
  },
  content: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
  },
  // Brand Section Styles
  brandSection: {
    alignItems: 'center',
    marginBottom: SCREEN_HEIGHT > 700 ? 36 : 24,
  },
  logoGradient: {
    width: SCREEN_WIDTH > 400 ? 72 : 64,
    height: SCREEN_WIDTH > 400 ? 72 : 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  brandName: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1e293b',
    letterSpacing: -0.5,
  },
  brandTagline: {
    fontSize: 15,
    color: '#64748b',
    marginTop: 4,
  },
  // Card Styles
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: SCREEN_WIDTH > 380 ? 24 : 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 8,
    marginBottom: 20,
    marginHorizontal: SCREEN_WIDTH > 400 ? 0 : -4,
  },
  cardHeader: {
    marginBottom: SCREEN_HEIGHT > 700 ? 28 : 20,
  },
  cardTitle: {
    fontSize: SCREEN_WIDTH > 380 ? 24 : 22,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 15,
    color: '#64748b',
    lineHeight: 22,
  },
  // OTP Header Styles
  otpHeader: {
    alignItems: 'center',
    marginBottom: 28,
  },
  otpIconGradient: {
    width: 64,
    height: 64,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  infoNoteText: {
    fontSize: 13,
    color: '#64748b',
    flex: 1,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 20,
  },
  securityNoteText: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
  },
  // Button Gradient
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 18,
    borderRadius: 14,
  },
  // Divider Styles
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 13,
    color: '#94a3b8',
    fontWeight: '500',
  },
  // Social Button Styles
  socialContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingVertical: 14,
  },
  socialButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
  },
  phoneHighlight: {
    fontWeight: '700',
    color: '#2563eb',
  },
  inputSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  phoneInputContainer: {
    flexDirection: 'row',
    gap: SCREEN_WIDTH > 380 ? 10 : 8,
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SCREEN_WIDTH > 380 ? 6 : 4,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: SCREEN_WIDTH > 380 ? 14 : 10,
    paddingVertical: SCREEN_WIDTH > 380 ? 16 : 14,
  },
  countryFlag: {
    fontSize: SCREEN_WIDTH > 380 ? 22 : 20,
  },
  countryCode: {
    fontSize: SCREEN_WIDTH > 380 ? 16 : 14,
    fontWeight: '600',
    color: '#1e293b',
  },
  phoneInput: {
    flex: 1,
    minWidth: 0,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    paddingHorizontal: SCREEN_WIDTH > 380 ? 18 : 14,
    paddingVertical: SCREEN_WIDTH > 380 ? 16 : 14,
    fontSize: SCREEN_WIDTH > 380 ? 18 : 16,
    fontWeight: '600',
    color: '#1e293b',
    letterSpacing: SCREEN_WIDTH > 380 ? 1.5 : 1,
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  errorText: {
    fontSize: 13,
    color: '#ef4444',
    marginTop: 8,
    fontWeight: '500',
  },
  primaryButton: {
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 0,
  },
  primaryButtonDisabled: {
    opacity: 1,
  },
  primaryButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
  },
  termsText: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  termsLink: {
    color: '#2563eb',
    fontWeight: '600',
  },
  otpSection: {
    marginBottom: 28,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SCREEN_WIDTH > 380 ? 12 : 8,
  },
  otpInput: {
    width: SCREEN_WIDTH > 380 ? 50 : 44,
    height: SCREEN_WIDTH > 380 ? 60 : 52,
    backgroundColor: '#f8fafc',
    borderWidth: 2,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    fontSize: SCREEN_WIDTH > 380 ? 26 : 22,
    fontWeight: '700',
    color: '#1e293b',
    textAlign: 'center',
  },
  otpInputFilled: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  otpInputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  resendContainer: {
    alignItems: 'center',
    gap: 6,
  },
  resendText: {
    fontSize: 14,
    color: '#64748b',
  },
  resendLink: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2563eb',
  },
  resendLinkDisabled: {
    color: '#94a3b8',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
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
    padding: 16,
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    marginBottom: 8,
    gap: 14,
  },
  countryItemSelected: {
    backgroundColor: '#eff6ff',
    borderWidth: 2,
    borderColor: '#2563eb',
  },
  countryItemFlag: {
    fontSize: 28,
  },
  countryItemName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#1e293b',
  },
  countryItemDialCode: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '500',
    marginRight: 8,
  },
});
