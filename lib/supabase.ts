import 'react-native-url-polyfill/auto';
import { Platform } from 'react-native';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase URL or Anon Key is missing. Please check your .env file.'
  );
}

// Custom storage that handles SSR (server-side rendering) safely
const createCustomStorage = () => {
  // Check if we're in a browser/client environment
  const isBrowser = typeof window !== 'undefined';
  
  if (!isBrowser) {
    // Return a no-op storage for SSR
    return {
      getItem: async () => null,
      setItem: async () => {},
      removeItem: async () => {},
    };
  }
  
  // For client-side, dynamically import AsyncStorage
  // This prevents the error during SSR
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  return AsyncStorage;
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: createCustomStorage(),
    autoRefreshToken: true,
    persistSession: Platform.OS !== 'web' || typeof window !== 'undefined',
    detectSessionInUrl: false,
  },
});

// Export types for use throughout the app
export type { User, Session } from '@supabase/supabase-js';
