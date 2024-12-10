import { User as SupabaseUser } from '@supabase/supabase-js';

export type UserRole = 'user' | 'admin' | 'artist' | 'moderator';

export interface User extends SupabaseUser {
  role: UserRole;
  balance: number;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  email_notifications: boolean;
  email_verified: boolean;
  updated_at: string;
} 