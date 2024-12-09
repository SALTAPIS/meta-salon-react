export interface ArtworkMetadata {
  size?: number;
  width?: number;
  height?: number;
  format?: string;
  [key: string]: number | string | undefined;
}

export interface Challenge {
  id: string;
  title: string;
  description: string | null;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  type: 'open' | 'public' | 'private';
  submission_fee: number;
  start_time: string;
  end_time: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export type Database = {
  public: {
    Tables: {
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

      profiles: {
        Row: {
          id: string;
          email: string | null;
          username: string | null;
          display_name: string | null;
          avatar_url: string | null;
          website: string | null;
          balance: number;
          role: 'user' | 'member' | 'moderator' | 'admin';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          website?: string | null;
          balance?: number;
          role?: 'user' | 'member' | 'moderator' | 'admin';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          username?: string | null;
          display_name?: string | null;
          avatar_url?: string | null;
          website?: string | null;
          balance?: number;
          role?: 'user' | 'member' | 'moderator' | 'admin';
          created_at?: string;
          updated_at?: string;
        };
      };

      transactions: {
        Row: {
          id: string;
          user_id: string;
          type: 'grant' | 'submission' | 'vote_pack' | 'reward' | 'premium' | 'refund';
          amount: number;
          description: string | null;
          reference_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'grant' | 'submission' | 'vote_pack' | 'reward' | 'premium' | 'refund';
          amount: number;
          description?: string | null;
          reference_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: 'grant' | 'submission' | 'vote_pack' | 'reward' | 'premium' | 'refund';
          amount?: number;
          description?: string | null;
          reference_id?: string | null;
          created_at?: string;
        };
      };
    };
  };
};

export interface Album {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  is_default: boolean;
  is_private: boolean;
  cover_image: string | null;
  created_at: string;
  updated_at: string;
}

export interface Vote {
  id: string;
  user_id: string;
  artwork_id: string;
  pack_id: string;
  value: number;
  consumed: boolean;
  created_at: string;
  consumed_at: string | null;
}

export interface VaultState {
  artwork_id: string;
  accumulated_value: number;
  total_votes: number;
  last_vote_at: string | null;
  updated_at: string;
}

export interface Artwork {
  id: string;
  user_id: string;
  album_id: string;
  title: string;
  description: string | null;
  image_url: string;
  metadata: ArtworkMetadata;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  challenge_id: string | null;
  created_at: string;
  updated_at: string;
  vault_status: 'active' | 'locked' | 'distributed';
  vote_count: number;
  vault_value: number;
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Transaction = Database['public']['Tables']['transactions']['Row'];

export interface VotePack {
  id: string;
  user_id: string;
  votes: number;
  status: 'active' | 'used' | 'expired';
  created_at: string;
  updated_at: string;
} 