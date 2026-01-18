// Supabase client
export { supabase } from './supabase';

// Environment configuration
export { env, validateEnv, isDev, isProd } from './env';

// OTP Configuration
export { MSG91_CONFIG, OTP_CONFIG, validatePhone, formatPhoneWithCountryCode } from './otp-config';

// TypeScript types (for frontend use)
export * from './types';

// Note: Prisma client (lib/prisma.ts) is for backend/API use only
// Do not import it in React Native components
