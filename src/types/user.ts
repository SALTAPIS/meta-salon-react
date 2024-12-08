import type { User as SupabaseUser, Session } from '@supabase/supabase-js';

export type UserRole = 'user' | 'member' | 'admin';

// This is our single source of truth for user data
export interface User extends Omit<SupabaseUser, 'role' | 'email'> {
  id: string;
  email: string;
  role: UserRole | null;
  balance: number;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  email_verified: boolean;
  email_notifications: boolean;
  created_at: string;
  updated_at: string;
  realtimeStatus?: 'online' | 'offline';
}

// Database profile type that matches our Supabase table
export interface Profile {
  id: string;
  email: string;
  role: UserRole | null;
  balance: number;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  email_verified: boolean;
  email_notifications: boolean;
  created_at: string;
  updated_at: string;
}

// Type for profile updates
export interface ProfileUpdate {
  username?: string | null;
  display_name?: string | null;
  bio?: string | null;
  avatar_url?: string | null;
  email_notifications?: boolean;
}

// Auth response types
export interface AuthResponse<T> {
  data: T | null;
  error: Error | null;
}

export type SignInResponse = AuthResponse<{
  user: User;
  session: Session;
}>;

export type SignUpResponse = {
  data: { user: User | null } | null;
  error: Error | null;
};

// Auth context type
export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signInWithPassword: (email: string, password: string) => Promise<SignInResponse>;
  signInWithEmail: (email: string) => Promise<SignInResponse>;
  signUpWithPassword: (email: string, password: string) => Promise<SignUpResponse>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUserBalance: (newBalance: number) => void;
} 