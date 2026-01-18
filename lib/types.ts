// ===========================================
// User TypeScript Types
// ===========================================

export interface User {
  id: string;
  phone: string;
  countryCode: string;
  name: string | null;
  avatar: string | null;
  bio: string | null;
  location: string | null;
  email: string | null;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Listing {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  price: number;
  images: string[];
  category: string | null;
  location: string | null;
  isSold: boolean;
  views: number;
  likes: number;
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
