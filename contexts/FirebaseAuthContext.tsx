import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import {
  initializeFirebase,
  getFirebaseAuth,
  isFirebaseConfigured,
  formatPhoneNumber,
  validatePhone,
  OTP_CONFIG,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  onAuthStateChanged,
  firebaseSignOut,
  updateProfile,
  type Auth,
  type ConfirmationResult,
  type FirebaseUser,
} from '@/lib/firebase';
import { supabase, withAuth } from '@/lib/supabase';
import type { User, AuthState } from '@/lib/types';

// =============================================================================
// Firebase Phone Authentication Context (Expo Compatible)
// =============================================================================
// This provides complete phone authentication using Firebase JS SDK
// Features:
// - Works on Android, iOS, and Web with Expo
// - reCAPTCHA verification for security
// - Persistent sessions
// - User data saved to Supabase database
// =============================================================================

// Storage keys
const STORAGE_KEYS = {
  USER: '@auth_user',
  TOKEN: '@auth_token',
};

// =============================================================================
// Save User to Supabase Database
// =============================================================================
const saveUserToDatabase = async (user: any): Promise<void> => {
  try {
    if (!user?.uid) {
      console.error('[Database] Cannot save user: UID is missing.');
      return;
    }
    console.log('[Database] Saving user with UID:', user.uid);
    console.log('[Database] Phone:', user.phoneNumber);
    const { data, error } = await supabase
      .from('users')
      .upsert({
        id: user.uid,
        phone: user.phoneNumber?.replace('+', '') || '',
        country_code: '91',
        is_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'id' })
      .select()
      .single();
    if (error) {
      console.error('[Database] Error saving user:', error.message);
    } else {
      console.log('[Database] ✓ User saved successfully:', data?.id);
    }
  } catch (err: any) {
    console.error('[Database] Unexpected error:', err);
  }
};

// =============================================================================
// Save Session to Supabase Database
// =============================================================================
const saveSessionToDatabase = async (user: any): Promise<void> => {
  try {
    if (!user?.uid) {
      console.error('[Database] Cannot save session: UID is missing.');
      return;
    }
    console.log('[Database] Saving session for:', user.uid);
    const { error } = await supabase
      .from('sessions')
      .insert({
        id: `${user.uid}_${Date.now()}`,
        user_id: user.uid,
        token: `firebase_token_${Date.now()}`,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
      });
    if (error) {
      console.error('[Database] Error saving session:', error.message);
    } else {
      console.log('[Database] ✓ Session saved successfully');
    }
  } catch (err: any) {
    console.error('[Database] Unexpected error:', err);
  }
};

interface AuthContextType extends AuthState {
  sendOtp: (phone: string, recaptchaVerifier?: any) => Promise<{ success: boolean; error?: string }>;
  verifyOtp: (phone: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  resendOtp: (phone: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  otpSent: boolean;
  setOtpSent: (value: boolean) => void;
  setRecaptchaVerifier: (verifier: any) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<AuthState['session']>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [otpSent, setOtpSent] = useState(false);

  // Store the confirmation result for OTP verification
  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);
  const mobileRecaptchaVerifierRef = useRef<any>(null);
  const authRef = useRef<Auth | null>(null);

  // =============================================================================
  // Initialize Firebase and Auth State Listener
  // =============================================================================
  useEffect(() => {
    console.log('[Firebase Auth] Initializing...');

    if (!isFirebaseConfigured()) {
      console.error('[Firebase Auth] ❌ Firebase not configured! Add EXPO_PUBLIC_FIREBASE_* to .env');
      setIsLoading(false);
      return;
    }

    try {
      const { auth } = initializeFirebase();
      authRef.current = auth;

      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
        console.log('[Firebase Auth] Auth state changed:', firebaseUser?.uid || 'No user');
        console.log('[DEBUG] Full user object:', JSON.stringify({
          uid: firebaseUser?.uid,
          phoneNumber: firebaseUser?.phoneNumber,
          exists: !!firebaseUser
        }));
        if (firebaseUser) {
          console.log('[FirebaseAuthContext] ✅ Session found for UID:', firebaseUser.uid);
          const appUser: User = {
            id: firebaseUser.uid,
            phone: firebaseUser.phoneNumber?.replace('+', '') || '',
            countryCode: '91',
            name: firebaseUser.displayName,
            avatar: firebaseUser.photoURL,
            bio: null,
            location: null,
            email: null,
            isVerified: true,
            createdAt: new Date(firebaseUser.metadata?.creationTime || Date.now()),
            updatedAt: new Date(),
          };
          setUser(appUser);
          console.log('[FirebaseAuthContext] ✓ User state set in context');
          await saveUserToDatabase(firebaseUser);
          await saveSessionToDatabase(firebaseUser);
        } else {
          console.log('[FirebaseAuthContext] ℹ️ No active session found');
          setUser(null);
        }
        setIsLoading(false);
        console.log('[FirebaseAuthContext] 🏁 Auth initialization complete (isLoading=false)');
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('[Firebase Auth] Initialization error:', error);
      setIsLoading(false);
    }
  }, []);

  // =============================================================================
  // Setup reCAPTCHA Verifier (for web and mobile)
  // =============================================================================
  const setupRecaptcha = useCallback(async () => {
    if (!authRef.current) return null;

    try {
      if (Platform.OS === 'web') {
        // Web platform: Use standard RecaptchaVerifier
        if (recaptchaVerifierRef.current) {
          recaptchaVerifierRef.current.clear();
        }

        recaptchaVerifierRef.current = new RecaptchaVerifier(authRef.current, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {
            console.log('[Firebase Auth] reCAPTCHA verified (web)');
          },
          'expired-callback': () => {
            console.log('[Firebase Auth] reCAPTCHA expired (web)');
          },
        });

        await recaptchaVerifierRef.current.render();
        return recaptchaVerifierRef.current;
      } else {
        // Mobile platform: The verifier is passed from the UI component (FirebaseRecaptchaVerifierModal)
        // We don't create it programmatically here.
        return null;
      }
    } catch (error) {
      console.error('[Firebase Auth] reCAPTCHA setup error:', error);
      return null;
    }
  }, []);

  // =============================================================================
  // Send OTP
  // =============================================================================
  const sendOtp = useCallback(async (phone: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('[Firebase Auth] ══════════════════════════════════════');
      console.log('[Firebase Auth] Sending OTP to:', phone);
      console.log('[Firebase Auth] Platform:', Platform.OS);

      if (!isFirebaseConfigured()) {
        return { success: false, error: 'Firebase not configured. Please add Firebase config to .env' };
      }

      if (!authRef.current) {
        const { auth } = initializeFirebase();
        authRef.current = auth;
      }

      // Validate phone number
      if (!validatePhone(phone)) {
        return { success: false, error: 'Please enter a valid 10-digit phone number' };
      }

      // Format phone with country code
      const formattedPhone = formatPhoneNumber(phone, '+91');
      console.log('[Firebase Auth] Formatted phone:', formattedPhone);

      // Setup reCAPTCHA verifier for all platforms
      let appVerifier: any = null;

      if (Platform.OS === 'web') {
        // Web: Use standard RecaptchaVerifier
        appVerifier = recaptchaVerifierRef.current;
        if (!appVerifier) {
          appVerifier = await setupRecaptcha();
        }
        if (!appVerifier) {
          return { success: false, error: 'reCAPTCHA verification failed. Please refresh and try again.' };
        }
      } else {
        // Mobile: Use the verifier passed from the UI component (FirebaseRecaptchaVerifierModal)
        // or use mobileRecaptchaVerifierRef if set
        appVerifier = mobileRecaptchaVerifierRef.current;

        if (!appVerifier) {
          // If no verifier is set, return error asking to retry
          // The login screen should render FirebaseRecaptchaVerifierModal and set it
          return {
            success: false,
            error: 'reCAPTCHA not ready. Please wait a moment and try again.'
          };
        }
      }

      // Send OTP with verifier (required for all platforms)
      const confirmation = await signInWithPhoneNumber(authRef.current, formattedPhone, appVerifier);
      confirmationRef.current = confirmation;

      console.log('[Firebase Auth] ✓ OTP sent successfully');
      console.log('[Firebase Auth] ══════════════════════════════════════');

      setOtpSent(true);
      return { success: true };
    } catch (error: any) {
      console.error('[Firebase Auth] Send OTP error:', error);

      // Handle specific Firebase errors
      let errorMessage = 'Failed to send OTP. Please try again.';

      if (error.code === 'auth/invalid-phone-number') {
        errorMessage = 'Invalid phone number format. Please check and try again.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many attempts. Please try again later.';
      } else if (error.code === 'auth/quota-exceeded') {
        errorMessage = 'SMS quota exceeded. Please try again later.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection.';
      } else if (error.code === 'auth/app-not-authorized') {
        errorMessage = 'App not authorized. Please check Firebase configuration.';
      } else if (error.code === 'auth/captcha-check-failed') {
        errorMessage = 'reCAPTCHA verification failed. Please try again.';
      } else if (error.code === 'auth/missing-phone-number') {
        errorMessage = 'Phone number is required.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      return { success: false, error: errorMessage };
    }
  }, [setupRecaptcha]);

  // =============================================================================
  // Verify OTP
  // =============================================================================
  const verifyOtp = useCallback(async (phone: string, otp: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('[Firebase Auth] ══════════════════════════════════════');
      console.log('[Firebase Auth] Verifying OTP for:', phone);

      // Validate OTP format
      if (otp.length !== OTP_CONFIG.length) {
        return { success: false, error: `Please enter a ${OTP_CONFIG.length}-digit OTP` };
      }

      // Check if we have a confirmation result
      if (!confirmationRef.current) {
        console.error('[Firebase Auth] No confirmation result found');
        return { success: false, error: 'OTP session expired. Please request a new OTP.' };
      }

      // Verify the OTP
      const userCredential = await confirmationRef.current.confirm(otp);

      console.log('[Firebase Auth] ✓ OTP verified successfully');
      console.log('[Firebase Auth] User:', userCredential?.user?.uid || 'authenticated');
      console.log('[Firebase Auth] ══════════════════════════════════════');

      // Clear confirmation ref
      confirmationRef.current = null;
      setOtpSent(false);

      // User state will be updated by onAuthStateChanged listener
      return { success: true };
    } catch (error: any) {
      console.error('[Firebase Auth] Verify OTP error:', error);

      let errorMessage = 'OTP verification failed. Please try again.';

      if (error.code === 'auth/invalid-verification-code') {
        errorMessage = 'Invalid OTP. Please check and try again.';
      } else if (error.code === 'auth/code-expired') {
        errorMessage = 'OTP has expired. Please request a new OTP.';
      } else if (error.code === 'auth/session-expired') {
        errorMessage = 'Session expired. Please request a new OTP.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      return { success: false, error: errorMessage };
    }
  }, []);

  // =============================================================================
  // Resend OTP
  // =============================================================================
  const resendOtp = useCallback(async (phone: string): Promise<{ success: boolean; error?: string }> => {
    console.log('[Firebase Auth] Resending OTP to:', phone);
    // Clear existing confirmation
    confirmationRef.current = null;
    // Simply call sendOtp again
    return await sendOtp(phone);
  }, [sendOtp]);

  // =============================================================================
  // Sign Out
  // =============================================================================
  const signOut = useCallback(async () => {
    try {
      console.log('[Firebase Auth] Signing out...');

      if (authRef.current) {
        await firebaseSignOut(authRef.current);
      }

      // Clear local storage
      await AsyncStorage.multiRemove([STORAGE_KEYS.USER, STORAGE_KEYS.TOKEN]);

      // Clear state
      setUser(null);
      setSession(null);
      setOtpSent(false);
      confirmationRef.current = null;

      console.log('[Firebase Auth] ✓ Signed out successfully');
    } catch (error) {
      console.error('[Firebase Auth] Sign out error:', error);
      // Force clear state even if Firebase sign out fails
      setUser(null);
      setSession(null);
      setOtpSent(false);
    }
  }, []);

  // =============================================================================
  // Update User Profile
  // =============================================================================
  const updateUserProfile = useCallback(async (data: Partial<User>) => {
    if (!user) return;

    try {
      const updatedUser = { ...user, ...data, updated_at: new Date() };

      // Update in AsyncStorage
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));

      // Update Firebase profile if name or avatar changed
      if (authRef.current?.currentUser) {
        const updates: { displayName?: string | null; photoURL?: string | null } = {};
        if (data.name !== undefined) updates.displayName = data.name;
        if (data.avatar !== undefined) updates.photoURL = data.avatar;

        if (Object.keys(updates).length > 0) {
          await updateProfile(authRef.current.currentUser, updates);
        }
      }

      // Update in Supabase database
      const { error } = await supabase
        .from('users')
        .update({
          name: updatedUser.name,
          avatar: updatedUser.avatar,
          bio: updatedUser.bio,
          location: updatedUser.location,
          email: updatedUser.email,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        console.error('[Database] Error updating user:', error.message);
      } else {
        console.log('[Database] ✓ User updated successfully');
        setUser(updatedUser);
      }
    } catch (err) {
      console.error('[Database] Unexpected error updating user:', err);
    }
  }, [user]);

  // =============================================================================
  // Context Provider Value
  // =============================================================================
  const value = React.useMemo(() => ({
    user,
    session,
    isLoading,
    otpSent,
    sendOtp,
    verifyOtp,
    resendOtp,
    signOut,
    updateUser: updateUserProfile,
    setOtpSent,
    setRecaptchaVerifier: (verifier: any) => {
      if (Platform.OS === 'web') {
        recaptchaVerifierRef.current = verifier;
      } else {
        mobileRecaptchaVerifierRef.current = verifier;
      }
    },
    isAuthenticated: !!user,
  }), [user, session, isLoading, otpSent, sendOtp, verifyOtp, resendOtp, signOut, updateUserProfile]);

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
