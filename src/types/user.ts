import type { User as SupabaseUser } from '@supabase/supabase-js';

export type UserRole = 'user' | 'member' | 'admin';

// This is our single source of truth for user data
export interface User extends Omit<SupabaseUser, 'role'> {
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

// Database profile type that matches our Supabase table
export interface Profile {
  id: string;
  email: string | null;
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