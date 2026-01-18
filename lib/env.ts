// Environment configuration with type safety
// All EXPO_PUBLIC_ prefixed variables are available in the client

interface EnvConfig {
  supabase: {
    url: string;
    anonKey: string;
  };
  app: {
    name: string;
    env: 'development' | 'staging' | 'production';
  };
}

const getEnvVar = (key: string, defaultValue?: string): string => {
  const value = process.env[key];
  if (!value && !defaultValue) {
    console.warn(`Environment variable ${key} is not defined`);
    return '';
  }
  return value || defaultValue || '';
};

export const env: EnvConfig = {
  supabase: {
    url: getEnvVar('EXPO_PUBLIC_SUPABASE_URL'),
    anonKey: getEnvVar('EXPO_PUBLIC_SUPABASE_ANON_KEY'),
  },
  app: {
    name: getEnvVar('EXPO_PUBLIC_APP_NAME', 'Marketplace'),
    env: getEnvVar('EXPO_PUBLIC_APP_ENV', 'development') as EnvConfig['app']['env'],
  },
};

// Validation function to check if all required env vars are set
export const validateEnv = (): boolean => {
  const required = [
    'EXPO_PUBLIC_SUPABASE_URL',
    'EXPO_PUBLIC_SUPABASE_ANON_KEY',
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    console.error('Missing required environment variables:', missing.join(', '));
    return false;
  }

  return true;
};

// Check if we're in development mode
export const isDev = env.app.env === 'development';
export const isProd = env.app.env === 'production';
