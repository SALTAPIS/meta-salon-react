import type { User as SupabaseUser } from '@supabase/supabase-js';

export type UserRole = 'member' | 'admin';

export interface User extends SupabaseUser {
  role?: UserRole;
  wallet?: string;
  balance?: number;
  premiumUntil?: string;
}

export interface UserProfile {
  id: string;
  wallet: string;
  balance: number;
  premiumUntil: string | null;
  role: UserRole;
  updatedAt: string;
} 