// MSG91 OTP Configuration
// Get credentials from: https://control.msg91.com/app/

export const MSG91_CONFIG = {
  widgetId: process.env.EXPO_PUBLIC_MSG91_WIDGET_ID || '',
  authToken: process.env.EXPO_PUBLIC_MSG91_AUTH_TOKEN || '',
  defaultCountryCode: '91',
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
