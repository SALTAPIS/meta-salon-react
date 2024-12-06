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
          premium_until: string | null;
          last_active: string | null;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string | null;
          role?: string | null;
          created_at?: string;
          balance?: number;
          premium_until?: string | null;
          last_active?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          role?: string | null;
          created_at?: string;
          balance?: number;
          premium_until?: string | null;
          last_active?: string | null;
          updated_at?: string;
        };
      };
    };
    Functions: {
      get_user_stats: {
        Args: Record<string, never>;
        Returns: {
          total_submissions: number;
          total_votes: number;
          total_rewards: number;
          last_activity: string;
        };
      };
      process_transaction: {
        Args: {
          user_id: string;
          amount: number;
          description: string;
        };
        Returns: {
          success: boolean;
          message: string;
        };
      };
      purchase_vote_pack: {
        Args: {
          pack_id: number;
        };
        Returns: {
          success: boolean;
          message: string;
        };
      };
      get_all_profiles_admin: {
        Args: Record<string, never>;
        Returns: {
          id: string;
          email: string | null;
          role: string | null;
          created_at: string;
          balance: number;
          premium_until: string | null;
          last_active: string | null;
          updated_at: string;
        }[];
      };
    };
  };
} 