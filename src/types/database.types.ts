export interface ArtworkMetadata {
  dimensions?: {
    width: number;
    height: number;
  };
  fileSize?: number;
  mimeType?: string;
  tags?: string[];
  exif?: Record<string, string>;
}

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
          updated_at: string;
          username: string | null;
          display_name: string | null;
          bio: string | null;
          avatar_url: string | null;
          email_verified: boolean;
          email_notifications: boolean;
        };
        Insert: {
          id: string;
          email?: string | null;
          role?: string | null;
          created_at?: string;
          balance?: number;
          updated_at?: string;
          username?: string | null;
          display_name?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          email_verified?: boolean;
          email_notifications?: boolean;
        };
        Update: {
          id?: string;
          email?: string | null;
          role?: string | null;
          created_at?: string;
          balance?: number;
          updated_at?: string;
          username?: string | null;
          display_name?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          email_verified?: boolean;
          email_notifications?: boolean;
        };
      };
      vote_packs: {
        Row: {
          id: string;
          user_id: string;
          votes_remaining: number;
          vote_power: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          votes_remaining?: number;
          vote_power?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          votes_remaining?: number;
          vote_power?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      albums: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      artworks: {
        Row: {
          id: string;
          user_id: string;
          album_id: string;
          title: string;
          description: string | null;
          image_url: string;
          status: 'draft' | 'submitted' | 'approved' | 'rejected';
          submission_fee: number | null;
          challenge_id: string | null;
          metadata: ArtworkMetadata;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          album_id: string;
          title: string;
          description?: string | null;
          image_url: string;
          status?: 'draft' | 'submitted' | 'approved' | 'rejected';
          submission_fee?: number | null;
          challenge_id?: string | null;
          metadata?: ArtworkMetadata;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          album_id?: string;
          title?: string;
          description?: string | null;
          image_url?: string;
          status?: 'draft' | 'submitted' | 'approved' | 'rejected';
          submission_fee?: number | null;
          challenge_id?: string | null;
          metadata?: ArtworkMetadata;
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
          email: string;
          role: string;
          created_at: string;
          balance: number;
          updated_at: string;
        }[];
      };
    };
  };
}

export type Album = Database['public']['Tables']['albums']['Row'];
export type Artwork = Database['public']['Tables']['artworks']['Row']; 