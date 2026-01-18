// MSG91 OTP Configuration
// Get credentials from: https://control.msg91.com/app/

export const MSG91_CONFIG = {
  // Widget-based configuration (for native SDK)
  widgetId: process.env.EXPO_PUBLIC_MSG91_WIDGET_ID || '',
  authToken: process.env.EXPO_PUBLIC_MSG91_AUTH_TOKEN || '',

  // REST API configuration (more reliable, works on all platforms)
  // Get authkey from MSG91 Dashboard > Authkey
  authKey: process.env.EXPO_PUBLIC_MSG91_AUTH_KEY || process.env.EXPO_PUBLIC_MSG91_AUTH_TOKEN || '',
  templateId: process.env.EXPO_PUBLIC_MSG91_TEMPLATE_ID || '',

  defaultCountryCode: '91',

  // API endpoints
  apiBaseUrl: 'https://control.msg91.com/api/v5',
};

export const OTP_CONFIG = {
  length: 4,
  expiryMinutes: 10,
  maxAttempts: 3,
  cooldownMinutes: 10,
};

export const validatePhone = (phone: string): boolean => {
  // Indian phone number validation (10 digits)
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
};

export const formatPhoneWithCountryCode = (
  phone: string,
  countryCode: string = '91'
): string => {
  // Remove any non-digit characters
  const cleanPhone = phone.replace(/\D/g, '');
  return `${countryCode}${cleanPhone}`;
};

// Helper to format phone for MSG91 API (with + prefix)
export const formatPhoneForAPI = (
  phone: string,
  countryCode: string = '91'
): string => {
  const cleanPhone = phone.replace(/\D/g, '');
  return `+${countryCode}${cleanPhone}`;
};
