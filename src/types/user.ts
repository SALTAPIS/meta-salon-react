import type { User as SupabaseUser } from '@supabase/supabase-js';

export type UserRole = 'user' | 'member' | 'admin';

export interface User extends SupabaseUser {
  id: string;
  email: string;
  role?: UserRole;
  balance?: number;
  created_at: string;
  avatar_url?: string;
}

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  balance: number;
  wallet: string | null;
  premium_until: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  wallet: string;
  balance: number;
  premiumUntil: string | null;
  role: UserRole;
  updatedAt: string;
} 