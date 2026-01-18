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
import { supabase } from '@/lib/supabase';
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
const saveUserToDatabase = async (userData: {
  id: string;
  phone: string;
  countryCode: string;
  name?: string | null;
  avatar?: string | null;
  bio?: string | null;
  location?: string | null;
  email?: string | null;
}): Promise<void> => {
  try {
    console.log('[Database] Saving user to Supabase:', userData.phone);

    // Upsert user - insert if not exists, update if exists
    // Only update basic auth fields, don't overwrite profile fields if they exist
    const { data, error } = await supabase
      .from('users')
      .upsert(
        {
          id: userData.id,
          phone: userData.phone,
          countryCode: userData.countryCode,
          name: userData.name || null,
          avatar: userData.avatar || null,
          isVerified: true,
          updatedAt: new Date().toISOString(),
        },
        {
          onConflict: 'phone', // If phone exists, update the record
          ignoreDuplicates: false,
        }
      )
      .select()
      .single();

    if (error) {
      console.error('[Database] Error saving user:', error.message);
      // Don't throw - auth should still work even if DB save fails
    } else {
      console.log('[Database] ✓ User saved successfully:', data?.id);
    }
  } catch (error) {
    console.error('[Database] Exception saving user:', error);
  }
};

// =============================================================================
// Save Session to Supabase Database
// =============================================================================
const saveSessionToDatabase = async (sessionData: {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
}): Promise<void> => {
  try {
    console.log('[Database] Saving session for user:', sessionData.userId);

    // First, delete any existing sessions for this user to avoid token conflicts
    // This ensures only one active session per user
    const { error: deleteError } = await supabase
      .from('sessions')
      .delete()
      .eq('userId', sessionData.userId);

    if (deleteError) {
      console.warn('[Database] Warning deleting old sessions:', deleteError.message);
      // Continue anyway - the old session might not exist
    }

    // Now insert the new session
    const { error: insertError } = await supabase.from('sessions').insert({
      id: sessionData.id,
      userId: sessionData.userId,
      token: sessionData.token,
      expiresAt: sessionData.expiresAt.toISOString(),
    });

    if (insertError) {
      console.error('[Database] Error saving session:', insertError.message);
    } else {
      console.log('[Database] ✓ Session saved successfully');
    }
  } catch (error) {
    console.error('[Database] Exception saving session:', error);
  }
};

interface AuthContextType extends AuthState {
  sendOtp: (phone: string) => Promise<{ success: boolean; error?: string }>;
  verifyOtp: (phone: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  resendOtp: (phone: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
  otpSent: boolean;
  setOtpSent: (value: boolean) => void;
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

        if (firebaseUser) {
          // User is signed in - first create base user object
          let appUser: User = {
            id: firebaseUser.uid,
            phone: firebaseUser.phoneNumber?.replace('+91', '') || '',
            countryCode: '91',
            name: firebaseUser.displayName,
            avatar: firebaseUser.photoURL,
            bio: null,
            location: null,
            email: null,
            isVerified: true,
            createdAt: new Date(firebaseUser.metadata.creationTime || Date.now()),
            updatedAt: new Date(),
          };

          // Try to fetch additional profile data from Supabase
          try {
            const { data: dbUser, error } = await supabase
              .from('users')
              .select('*')
              .eq('id', firebaseUser.uid)
              .single();

            if (dbUser && !error) {
              // Merge database fields with Firebase data
              appUser = {
                ...appUser,
                name: dbUser.name || appUser.name,
                avatar: dbUser.avatar || appUser.avatar,
                bio: dbUser.bio || null,
                location: dbUser.location || null,
                email: dbUser.email || null,
                createdAt: new Date(dbUser.createdAt),
                updatedAt: new Date(dbUser.updatedAt),
              };
              console.log('[Database] ✓ User profile loaded from database');
            }
          } catch (dbError) {
            console.warn('[Database] Could not fetch user profile:', dbError);
          }

          // Get the ID token for session
          const token = await firebaseUser.getIdToken();

          // Save to AsyncStorage for persistence
          await Promise.all([
            AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(appUser)),
            AsyncStorage.setItem(STORAGE_KEYS.TOKEN, token),
          ]);

          // Save user to Supabase database
          await saveUserToDatabase({
            id: appUser.id,
            phone: appUser.phone,
            countryCode: appUser.countryCode,
            name: appUser.name,
            avatar: appUser.avatar,
          });

          const sessionData = {
            id: `session_${firebaseUser.uid}_${Date.now()}`,
            userId: firebaseUser.uid,
            token,
            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
            createdAt: new Date(),
          };

          // Save session to Supabase database
          await saveSessionToDatabase(sessionData);

          setUser(appUser);
          setSession(sessionData);
        } else {
          // User is signed out
          setUser(null);
          setSession(null);
          await AsyncStorage.multiRemove([STORAGE_KEYS.USER, STORAGE_KEYS.TOKEN]);
        }

        setIsLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('[Firebase Auth] Initialization error:', error);
      setIsLoading(false);
    }
  }, []);

  // =============================================================================
  // Setup reCAPTCHA Verifier (for web)
  // =============================================================================
  const setupRecaptcha = useCallback(async () => {
    if (!authRef.current) return null;

    // Only needed for web platform
    if (Platform.OS === 'web') {
      try {
        // Clear existing verifier
        if (recaptchaVerifierRef.current) {
          recaptchaVerifierRef.current.clear();
        }

        // Create invisible reCAPTCHA
        recaptchaVerifierRef.current = new RecaptchaVerifier(authRef.current, 'recaptcha-container', {
          size: 'invisible',
          callback: () => {
            console.log('[Firebase Auth] reCAPTCHA verified');
          },
          'expired-callback': () => {
            console.log('[Firebase Auth] reCAPTCHA expired');
          },
        });

        await recaptchaVerifierRef.current.render();
        return recaptchaVerifierRef.current;
      } catch (error) {
        console.error('[Firebase Auth] reCAPTCHA setup error:', error);
        return null;
      }
    }

    return null;
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

      // Setup reCAPTCHA for web
      let appVerifier = recaptchaVerifierRef.current;
      if (Platform.OS === 'web' && !appVerifier) {
        appVerifier = await setupRecaptcha();
      }

      // Send OTP via Firebase
      // For mobile in Expo, we need to handle this differently
      // Firebase Phone Auth with Expo requires expo-firebase-recaptcha
      if (Platform.OS !== 'web') {
        // For mobile platforms, we'll use a different approach
        // This requires additional setup with expo-firebase-recaptcha
        console.log('[Firebase Auth] Mobile platform detected');
        
        // For now, use the standard signInWithPhoneNumber
        // This will work in development but needs proper reCAPTCHA in production
        const confirmation = await signInWithPhoneNumber(authRef.current, formattedPhone);
        confirmationRef.current = confirmation;
      } else {
        // Web platform
        if (!appVerifier) {
          return { success: false, error: 'reCAPTCHA verification failed. Please refresh and try again.' };
        }
        const confirmation = await signInWithPhoneNumber(authRef.current, formattedPhone, appVerifier);
        confirmationRef.current = confirmation;
      }

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
      const updatedUser = { ...user, ...data, updatedAt: new Date() };

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
          updatedAt: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        console.error('[Database] Error updating user:', error.message);
      } else {
        console.log('[Database] ✓ User profile updated successfully');
      }

      setUser(updatedUser);
    } catch (error) {
      console.error('[Firebase Auth] Update user error:', error);
    }
  }, [user]);

  // =============================================================================
  // Context Value
  // =============================================================================
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
    updateUser: updateUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// =============================================================================
// Hook
// =============================================================================
export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
