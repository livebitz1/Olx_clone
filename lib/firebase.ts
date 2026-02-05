// Firebase Configuration for React Native (Expo)
// ===========================================
// This file initializes Firebase for the app using Firebase JS SDK
//
// SETUP INSTRUCTIONS:
// 1. Go to Firebase Console: https://console.firebase.google.com/
// 2. Create a new project (or use existing)
// 3. Add a Web app (for Expo, we use the web SDK)
// 4. Copy the config values to your .env file
// 5. Enable Phone Authentication in Firebase Console:
//    - Go to Authentication > Sign-in method > Phone
//    - Enable it
// 6. Add your domain to authorized domains (for reCAPTCHA)
//    - Go to Authentication > Settings > Authorized domains

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  // @ts-ignore
  getReactNativePersistence,
  signInWithPhoneNumber,
  RecaptchaVerifier,
  PhoneAuthProvider,
  signInWithCredential,
  Auth,
  ConfirmationResult,
  onAuthStateChanged,
  signOut as firebaseSignOut,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase Web Config - Only 4 values needed for Phone Auth
// Get this from Firebase Console > Project Settings > Your apps > Web app
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '',
};

// Initialize Firebase
let app: FirebaseApp;
let authInstance: Auth;

export const initializeFirebase = (): { app: FirebaseApp; auth: Auth } => {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
    console.log('[Firebase] App initialized');
  } else {
    app = getApp();
    console.log('[Firebase] Using existing app');
  }

  // Use initializeAuth with AsyncStorage persistence for React Native
  // This ensures auth state persists between app sessions
  try {
    authInstance = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
    console.log('[Firebase] Auth initialized with persistence');
  } catch (error: any) {
    // If auth is already initialized, get the existing instance
    if (error.code === 'auth/already-initialized') {
      authInstance = getAuth(app);
      console.log('[Firebase] Auth already initialized, using existing instance');
    } else {
      throw error;
    }
  }

  return { app, auth: authInstance };
};

// Get Firebase Auth instance
export const getFirebaseAuth = (): Auth => {
  if (!authInstance) {
    initializeFirebase();
  }
  return authInstance;
};

// Check if Firebase is configured
export const isFirebaseConfigured = (): boolean => {
  return !!(
    firebaseConfig.apiKey &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
  );
};

// Phone number formatting
export const formatPhoneNumber = (phone: string, countryCode: string = '+91'): string => {
  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');

  // If already has country code, return as-is with + prefix
  if (cleanPhone.length > 10) {
    return `+${cleanPhone}`;
  }

  // Add country code
  return `${countryCode}${cleanPhone}`;
};

// Validate Indian phone number
export const validatePhone = (phone: string): boolean => {
  const cleanPhone = phone.replace(/\D/g, '');
  // Indian phone: 10 digits starting with 6-9
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(cleanPhone);
};

// OTP Configuration
export const OTP_CONFIG = {
  length: 6, // User requested 6-digit OTP
  timeoutSeconds: 60, // Auto-retrieval timeout
  maxAttempts: 3,
};

// Export Firebase Auth types and functions for use in context
export {
  signInWithPhoneNumber,
  RecaptchaVerifier,
  PhoneAuthProvider,
  signInWithCredential,
  onAuthStateChanged,
  firebaseSignOut,
  updateProfile,
};

export type { Auth, ConfirmationResult, FirebaseUser };

console.log('═══════════════════════════════════════════════════════════');
console.log('[Firebase] Configuration loaded');
console.log('[Firebase] Platform:', Platform.OS);
console.log('[Firebase] Configured:', isFirebaseConfigured() ? '✓ Yes' : '❌ No - Add config to .env');
if (!isFirebaseConfigured()) {
  console.log('[Firebase] Missing: EXPO_PUBLIC_FIREBASE_* variables in .env');
}
console.log('═══════════════════════════════════════════════════════════');
