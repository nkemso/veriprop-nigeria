export type UserRole =
  | 'super_admin' | 'admin' | 'compliance_officer'
  | 'agent' | 'agency' | 'developer'
  | 'buyer' | 'seller' | 'tenant' | 'landlord'
  | 'lawyer' | 'surveyor' | 'guest';

export interface UserProfile {
  id: string;
  displayName: string;
  bio?: string;
  avatar?: string;
  state?: string;
  address?: string;
  website?: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: UserRole;
  isVerified: boolean;
  isActive: boolean;
  ninVerified?: boolean;
    phoneVerified?: boolean;
  verificationLevel?: number;
  profile?: UserProfile;
  createdAt: string;
  lastLoginAt?: string;
  _count?: { properties: number; transactions: number };
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: UserRole;
}

export interface LoginPayload {
  email: string;
  password: string;
}
