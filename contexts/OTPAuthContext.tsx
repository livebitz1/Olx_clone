import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { OTPWidget } from '@msg91comm/sendotp-react-native';
import { MSG91_CONFIG, OTP_CONFIG, validatePhone, formatPhoneWithCountryCode } from '@/lib/otp-config';
import type { User, AuthState } from '@/lib/types';

// MSG91 Response type
interface MSG91Response {
  type: 'success' | 'error';
  message?: string;
  reqId?: string;
}

// Storage keys
const STORAGE_KEYS = {
  USER: '@auth_user',
  TOKEN: '@auth_token',
};

interface AuthContextType extends AuthState {
  // OTP Actions
  sendOtp: (phone: string) => Promise<{ success: boolean; error?: string }>;
  verifyOtp: (phone: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  resendOtp: (phone: string) => Promise<{ success: boolean; error?: string }>;
  
  // Auth Actions
  signOut: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  
  // State
  otpSent: boolean;
  setOtpSent: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<AuthState['session']>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [otpSent, setOtpSent] = useState(false);
  
  // Store the request ID from sendOTP for verification
  const reqIdRef = useRef<string | null>(null);

  // Initialize MSG91 Widget
  useEffect(() => {
    const initializeOTP = async () => {
      try {
        if (MSG91_CONFIG.widgetId) {
          // Auth token is optional for some MSG91 widget configurations
          const authToken = MSG91_CONFIG.authToken || '';
          OTPWidget.initializeWidget(MSG91_CONFIG.widgetId, authToken);
        }
      } catch (error) {
        console.error('Failed to initialize OTP widget:', error);
      }
    };

    initializeOTP();
  }, []);

  // Load stored auth state on mount
  useEffect(() => {
    const loadStoredAuth = async () => {
      try {
        const [storedUser, storedToken] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.USER),
          AsyncStorage.getItem(STORAGE_KEYS.TOKEN),
        ]);

        if (storedUser && storedToken) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setSession({
            id: '',
            userId: parsedUser.id,
            token: storedToken,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            createdAt: new Date(),
          });
        }
      } catch (error) {
        console.error('Failed to load stored auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadStoredAuth();
  }, []);

  // Send OTP to phone number
  const sendOtp = useCallback(async (phone: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Validate phone number
      if (!validatePhone(phone)) {
        return { success: false, error: 'Please enter a valid 10-digit phone number' };
      }

      const formattedPhone = formatPhoneWithCountryCode(phone, MSG91_CONFIG.defaultCountryCode);

      const response: MSG91Response = await OTPWidget.sendOTP({
        identifier: formattedPhone,
      });

      if (response?.type === 'success') {
        // Store the request ID for verification
        if (response.reqId) {
          reqIdRef.current = response.reqId;
        }
        setOtpSent(true);
        return { success: true };
      } else {
        return { success: false, error: response?.message || 'Failed to send OTP' };
      }
    } catch (error) {
      console.error('Send OTP error:', error);
      return { success: false, error: 'Something went wrong. Please try again.' };
    }
  }, []);

  // Verify OTP
  const verifyOtp = useCallback(async (phone: string, otp: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Validate OTP length
      if (otp.length !== OTP_CONFIG.length) {
        return { success: false, error: `Please enter a ${OTP_CONFIG.length}-digit OTP` };
      }

      const formattedPhone = formatPhoneWithCountryCode(phone, MSG91_CONFIG.defaultCountryCode);

      const response: MSG91Response = await OTPWidget.verifyOTP({
        identifier: formattedPhone,
        otp,
        reqId: reqIdRef.current || undefined,
      });

      if (response?.type === 'success') {
        // Clear the reqId after successful verification
        reqIdRef.current = null;
        
        // Create or get user after successful verification
        const newUser: User = {
          id: `user_${Date.now()}`, // This should come from your backend
          phone: phone,
          countryCode: MSG91_CONFIG.defaultCountryCode,
          name: null,
          avatar: null,
          isVerified: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        const token = `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        // Store auth state
        await Promise.all([
          AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(newUser)),
          AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token),
        ]);

        setUser(newUser);
        setSession({
          id: `session_${Date.now()}`,
          userId: newUser.id,
          token,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          createdAt: new Date(),
        });
        setOtpSent(false);

        return { success: true };
      } else {
        return { success: false, error: response?.message || 'Invalid OTP. Please try again.' };
      }
    } catch (error) {
      console.error('Verify OTP error:', error);
      return { success: false, error: 'Verification failed. Please try again.' };
    }
  }, []);

  // Resend OTP
  const resendOtp = useCallback(async (phone: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const formattedPhone = formatPhoneWithCountryCode(phone, MSG91_CONFIG.defaultCountryCode);

      const response: MSG91Response = await OTPWidget.retryOTP({
        identifier: formattedPhone,
        retryType: 'text', // SMS
      });

      if (response?.type === 'success') {
        // Store new reqId if provided
        if (response.reqId) {
          reqIdRef.current = response.reqId;
        }
        return { success: true };
      } else {
        return { success: false, error: response?.message || 'Failed to resend OTP' };
      }
    } catch (error) {
      console.error('Resend OTP error:', error);
      return { success: false, error: 'Failed to resend OTP. Please try again.' };
    }
  }, []);

  // Sign out
  const signOut = useCallback(async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(STORAGE_KEYS.USER),
        AsyncStorage.removeItem(STORAGE_KEYS.TOKEN),
      ]);
      setUser(null);
      setSession(null);
      setOtpSent(false);
    } catch (error) {
      console.error('Sign out error:', error);
    }
  }, []);

  // Update user profile
  const updateUser = useCallback(async (data: Partial<User>) => {
    if (!user) return;

    const updatedUser = { ...user, ...data, updatedAt: new Date() };
    await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
    setUser(updatedUser);
  }, [user]);

  const value: AuthContextType = {
    user,
    session,
    isLoading,
    isAuthenticated: !!session && !!user,
    otpSent,
    setOtpSent,
    sendOtp,
    verifyOtp,
    resendOtp,
    signOut,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
