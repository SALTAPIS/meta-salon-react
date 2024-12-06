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