import type { Database } from './database.types';

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

export interface ProfileFormData {
  username?: string | null;
  display_name?: string | null;
  bio?: string | null;
  website?: string | null;
  social_links?: Record<string, string> | null;
}

export interface ProfileError {
  message: string;
  code?: string;
  details?: string;
} 