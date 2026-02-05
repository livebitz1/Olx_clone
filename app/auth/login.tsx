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
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';

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

const OTP_LENGTH = 6; // Updated back to 6-digit as requested

export default function LoginScreen() {
  const router = useRouter();
  const { sendOtp, verifyOtp, resendOtp, isAuthenticated, isLoading: authLoading, setRecaptchaVerifier } = useAuth();

  // Phone input state
  const [selectedCountry, setSelectedCountry] = useState<Country>(COUNTRIES[0]);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [isSendingOTP, setIsSendingOTP] = useState(false);

  // reCAPTCHA verifier ref (for mobile)
  const recaptchaVerifierRef = useRef<any>(null);

  // OTP state
  const [showOTPScreen, setShowOTPScreen] = useState(false);
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [otpError, setOtpError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [showSuccessLoader, setShowSuccessLoader] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  // Refs for OTP inputs
  const otpInputs = useRef<(TextInput | null)[]>([]);

  // Animation
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const loaderProgressAnim = useRef(new Animated.Value(0)).current;

  // Firebase config for reCAPTCHA
  const firebaseConfig = Platform.OS !== 'web' ? {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
  } : undefined;

  // Set reCAPTCHA verifier when component mounts (for mobile)
  useEffect(() => {
    if (Platform.OS !== 'web' && recaptchaVerifierRef.current && setRecaptchaVerifier) {
      setRecaptchaVerifier(recaptchaVerifierRef.current);
    }
  }, [setRecaptchaVerifier]);



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
    // Only allow numbers
    const clean = text.replace(/\D/g, '');
    if (clean.length > 10) return;
    const formatted = formatPhoneNumber(clean);
    setPhoneNumber(formatted);
    setPhoneError('');
  };

  const handleKeyPress = (key: string) => {
    if (showOTPScreen) {
      if (key === 'backspace') {
        // Find last filled index
        const lastIndex = otp.map((d, i) => d !== '' ? i : -1).filter(v => v !== -1).pop();
        if (lastIndex !== undefined) {
          const newOtp = [...otp];
          newOtp[lastIndex] = '';
          setOtp(newOtp);
        }
      } else {
        // Find first empty index
        const emptyIndex = otp.findIndex(d => d === '');
        if (emptyIndex !== -1) {
          const newOtp = [...otp];
          newOtp[emptyIndex] = key;
          setOtp(newOtp);
        }
      }
      return;
    }

    if (key === 'backspace') {
      const clean = getCleanPhoneNumber();
      const newNumber = clean.slice(0, -1);
      handlePhoneChange(newNumber);
    } else {
      const clean = getCleanPhoneNumber();
      if (clean.length < 10) {
        handlePhoneChange(clean + key);
      }
    }
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
    setOtpError('');
    const cleanNumber = getCleanPhoneNumber();
    const enteredOTP = otp.join('');

    const result = await verifyOtp(cleanNumber, enteredOTP);

    setIsVerifying(false);

    if (result.success) {
      // Show professional success loader
      setShowSuccessLoader(true);

      // Animate progress bar
      loaderProgressAnim.setValue(0);
      Animated.timing(loaderProgressAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: false,
      }).start();

      // Wait for user data to be saved to Supabase and then navigate
      setTimeout(() => {
        // Smooth navigation with sleek fade-out animation
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 500, // Sleeker, slightly slower fade
          useNativeDriver: true,
        }).start(() => {
          router.replace('/auth/location-permission');
        });
      }, 3000); // Show success animation for 3 seconds only
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
      {/* Header with Back Arrow */}
      <View style={styles.headerRow}>
        <Pressable onPress={() => router.back()} style={styles.headerBackButton}>
          <Ionicons name="arrow-back" size={28} color="#000" />
        </Pressable>
      </View>

      <Text style={styles.mockupTitle}>Continue with Phone</Text>

      <View style={styles.mockupInputSection}>
        <Text style={styles.mockupLabel}>Number</Text>
        <View style={styles.mockupPhoneRow}>
          <View style={styles.countryBox}>
            <Text style={styles.countryBoxText}>{selectedCountry.dialCode}</Text>
          </View>
          <View style={styles.numberBox}>
            <Text style={[styles.numberBoxText, !phoneNumber && styles.placeholderText]}>
              {phoneNumber || '63832 92272'}
            </Text>
          </View>
        </View>
      </View>

      <Pressable
        style={[
          styles.mockupButton,
          (!getCleanPhoneNumber() || isSendingOTP) && styles.mockupButtonDisabled,
        ]}
        onPress={handleSendOTP}
        disabled={!getCleanPhoneNumber() || isSendingOTP}
      >
        {isSendingOTP ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.mockupButtonText}>Send Code</Text>
        )}
      </Pressable>

      {/* Custom Keypad */}
      <View style={styles.keypadContainer}>
        <View style={styles.keypadRow}>
          {['1', '2', '3'].map((key) => (
            <Pressable key={key} style={styles.key} onPress={() => handleKeyPress(key)}>
              <Text style={styles.keyText}>{key}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.keypadRow}>
          {['4', '5', '6'].map((key) => (
            <Pressable key={key} style={styles.key} onPress={() => handleKeyPress(key)}>
              <Text style={styles.keyText}>{key}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.keypadRow}>
          {['7', '8', '9'].map((key) => (
            <Pressable key={key} style={styles.key} onPress={() => handleKeyPress(key)}>
              <Text style={styles.keyText}>{key}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.keypadRow}>
          <View style={[styles.key, { backgroundColor: 'transparent' }]} />
          <Pressable style={styles.key} onPress={() => handleKeyPress('0')}>
            <Text style={styles.keyText}>0</Text>
          </Pressable>
          <Pressable style={[styles.key, { backgroundColor: 'transparent' }]} onPress={() => handleKeyPress('backspace')}>
            <Ionicons name="backspace-outline" size={24} color="#000" />
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );

  const renderOTPScreen = () => (
    <Animated.View
      style={[
        styles.content,
        { opacity: fadeAnim, transform: [{ translateX: slideAnim }] },
      ]}
    >
      <View style={styles.headerRow}>
        <Pressable onPress={handleBackToPhone} style={styles.headerBackButton}>
          <Ionicons name="arrow-back" size={28} color="#000" />
        </Pressable>
      </View>

      <Text style={styles.mockupTitle}>Enter 6 Digit Code</Text>
      <Text style={styles.mockupSubtitle}>
        Enter 6 digit code that your receive on your Phone ({phoneNumber || '63832 92272'}).
      </Text>

      <View style={styles.otpBoxesRow}>
        {otp.map((digit, index) => (
          <View key={index} style={styles.otpBox}>
            <Text style={styles.otpBoxText}>{digit}</Text>
          </View>
        ))}
      </View>

      <View style={styles.resendWrapper}>
        <Text style={styles.resendWrapperText}>Email not received? </Text>
        <Pressable onPress={handleResendOTP} disabled={resendTimer > 0}>
          <Text style={styles.resendWrapperLink}>
            {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend code'}
          </Text>
        </Pressable>
      </View>

      <Pressable
        style={[
          styles.mockupButton,
          (!isOTPComplete() || isVerifying) && styles.mockupButtonDisabled,
          { marginTop: 40 }
        ]}
        onPress={handleVerifyOTP}
        disabled={!isOTPComplete() || isVerifying}
      >
        {isVerifying ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.mockupButtonText}>Continue</Text>
        )}
      </Pressable>

      {/* Custom Keypad */}
      <View style={styles.keypadContainer}>
        <View style={styles.keypadRow}>
          {['1', '2', '3'].map((key) => (
            <Pressable key={key} style={styles.key} onPress={() => handleKeyPress(key)}>
              <Text style={styles.keyText}>{key}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.keypadRow}>
          {['4', '5', '6'].map((key) => (
            <Pressable key={key} style={styles.key} onPress={() => handleKeyPress(key)}>
              <Text style={styles.keyText}>{key}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.keypadRow}>
          {['7', '8', '9'].map((key) => (
            <Pressable key={key} style={styles.key} onPress={() => handleKeyPress(key)}>
              <Text style={styles.keyText}>{key}</Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.keypadRow}>
          <View style={[styles.key, { backgroundColor: 'transparent' }]} />
          <Pressable style={styles.key} onPress={() => handleKeyPress('0')}>
            <Text style={styles.keyText}>0</Text>
          </Pressable>
          <Pressable style={[styles.key, { backgroundColor: 'transparent' }]} onPress={() => handleKeyPress('backspace')}>
            <Ionicons name="backspace-outline" size={24} color="#000" />
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );

  // Success Loader Component
  const renderSuccessLoader = () => (
    <View style={styles.loaderOverlay}>
      <Animated.View
        style={[
          styles.loaderContainer,
          {
            opacity: fadeAnim,
            transform: [
              {
                scale: fadeAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.8, 1],
                }),
              },
            ],
          },
        ]}
      >
        <View style={styles.successCheckmarkWrapper}>
          <Ionicons name="checkmark-circle" size={100} color="#10b981" />
        </View>
        <Text style={styles.mockupSuccessTitle}>Log in Successfully</Text>
        <Text style={styles.mockupSuccessSubtitle}>
          You’re logged in successfully, start buying selling.
        </Text>
      </Animated.View>
    </View>
  );

  // Animate loader on mount
  useEffect(() => {
    if (showSuccessLoader) {
      fadeAnim.setValue(0);
      Animated.spring(fadeAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    }
  }, [showSuccessLoader]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Firebase reCAPTCHA Modal (for mobile platforms) */}
      {Platform.OS !== 'web' && firebaseConfig && (
        <FirebaseRecaptchaVerifierModal
          ref={recaptchaVerifierRef}
          firebaseConfig={firebaseConfig as any}
          attemptInvisibleVerification={true}
          title=""
          cancelLabel=""
        />
      )}

      {/* Success Loader Overlay */}
      {showSuccessLoader && renderSuccessLoader()}

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
          <View style={{ height: 20 }} />
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
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SCREEN_WIDTH > 400 ? 28 : 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  content: {
    flex: 1,
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
    borderColor: '#FF4D00',
    backgroundColor: '#FFF5F0',
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
    color: '#FF4D00',
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

  // Success Loader Styles
  loaderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  successCheckmarkWrapper: {
    marginBottom: 20,
  },
  mockupSuccessTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
    marginBottom: 10,
    textAlign: 'center',
  },
  mockupSuccessSubtitle: {
    fontSize: 16,
    color: '#808080',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 30,
  },
  // Mockup Specific Styles
  headerRow: {
    marginTop: 10,
    marginBottom: 20,
  },
  headerBackButton: {
    padding: 8,
    marginLeft: -8,
  },
  mockupTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FF4D00',
    marginTop: 0,
    marginBottom: 40,
    textAlign: 'left',
  },
  mockupInputSection: {
    marginBottom: 40,
  },
  mockupLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  mockupPhoneRow: {
    flexDirection: 'row',
    gap: 12,
  },
  countryBox: {
    backgroundColor: '#F2F2F2',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 18,
    minWidth: 70,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countryBoxText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  numberBox: {
    flex: 1,
    backgroundColor: '#F2F2F2',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    justifyContent: 'center',
  },
  numberBoxText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    letterSpacing: 1,
  },
  placeholderText: {
    color: '#A0A0A0',
  },
  mockupButton: {
    backgroundColor: '#FF4D00',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  mockupButtonDisabled: {
    opacity: 0.6,
  },
  mockupButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  keypadContainer: {
    marginTop: 'auto',
    gap: 12,
  },
  keypadRow: {
    flexDirection: 'row',
    gap: 12,
  },
  key: {
    flex: 1,
    backgroundColor: '#F2F2F2',
    borderRadius: 16,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
  },
  mockupSubtitle: {
    fontSize: 16,
    color: '#A0A0A0',
    lineHeight: 22,
    marginBottom: 30,
  },
  otpBoxesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  otpBox: {
    width: (SCREEN_WIDTH - 100) / 6,
    height: 60,
    backgroundColor: '#F2F2F2',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#000',
  },
  resendWrapper: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resendWrapperText: {
    fontSize: 15,
    color: '#A0A0A0',
  },
  resendWrapperLink: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
});
