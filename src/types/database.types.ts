import type { ImageMetadata } from './storage.types';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string | null;
          role: string | null;
          created_at: string;
          balance: number;
          username: string | null;
          display_name: string | null;
          bio: string | null;
          website: string | null;
          social_links: Record<string, string> | null;
          avatar_url: string | null;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          role?: string | null;
          created_at?: string;
          balance?: number;
          username?: string | null;
          display_name?: string | null;
          bio?: string | null;
          website?: string | null;
          social_links?: Record<string, string> | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          role?: string | null;
          created_at?: string;
          balance?: number;
          username?: string | null;
          display_name?: string | null;
          bio?: string | null;
          website?: string | null;
          social_links?: Record<string, string> | null;
          avatar_url?: string | null;
          updated_at?: string;
        };
      };
      albums: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          description: string | null;
          is_default: boolean;
          privacy: 'public' | 'private' | 'unlisted';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          description?: string | null;
          is_default?: boolean;
          privacy?: 'public' | 'private' | 'unlisted';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          description?: string | null;
          is_default?: boolean;
          privacy?: 'public' | 'private' | 'unlisted';
          created_at?: string;
          updated_at?: string;
        };
      };
      images: {
        Row: {
          id: string;
          album_id: string;
          user_id: string;
          title: string | null;
          description: string | null;
          storage_path: string;
          metadata: ImageMetadata | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          album_id: string;
          user_id: string;
          title?: string | null;
          description?: string | null;
          storage_path: string;
          metadata?: ImageMetadata | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          album_id?: string;
          user_id?: string;
          title?: string | null;
          description?: string | null;
          storage_path?: string;
          metadata?: ImageMetadata | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Functions: {
      get_all_profiles_admin: {
        Args: Record<string, never>;
        Returns: {
          id: string;
          email: string | null;
          role: string | null;
          created_at: string;
          balance: number;
          username: string | null;
          display_name: string | null;
          bio: string | null;
          website: string | null;
          social_links: Record<string, string> | null;
          avatar_url: string | null;
          updated_at: string;
        }[];
      };
    };
  };
} 