// ===========================================
// User TypeScript Types
// ===========================================

export interface User {
  id: string;
  phone: string;
  countryCode: string;
  name: string | null;
  avatar: string | null;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
  user?: User;
}

// ===========================================
// API Response Types
// ===========================================
export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  success: boolean;
}

// ===========================================
// OTP Types
// ===========================================
export interface OTPResponse {
  type: 'success' | 'error';
  message?: string;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// ===========================================
// Input Types for User
// ===========================================
export interface CreateUserInput {
  phone: string;
  countryCode?: string;
  name?: string;
  avatar?: string;
}

export interface UpdateUserInput {
  name?: string;
  avatar?: string;
}
