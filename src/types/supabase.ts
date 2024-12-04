export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          role: 'user' | 'guest' | 'member' | 'moderator' | 'admin';
          balance: number;
          wallet: string | null;
          avatar_url: string | null;
          premium_until: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email?: string;
          role?: 'user' | 'guest' | 'member' | 'moderator' | 'admin';
          balance?: number;
          wallet?: string | null;
          avatar_url?: string | null;
          premium_until?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          role?: 'user' | 'guest' | 'member' | 'moderator' | 'admin';
          balance?: number;
          wallet?: string | null;
          avatar_url?: string | null;
          premium_until?: string | null;
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
      vote_packs: {
        Row: {
          id: string;
          user_id: string;
          type: 'basic' | 'art_lover' | 'pro' | 'expert' | 'elite';
          votes_remaining: number;
          vote_power: number;
          expires_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: 'basic' | 'art_lover' | 'pro' | 'expert' | 'elite';
          votes_remaining: number;
          vote_power: number;
          expires_at?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: 'basic' | 'art_lover' | 'pro' | 'expert' | 'elite';
          votes_remaining?: number;
          vote_power?: number;
          expires_at?: string | null;
          created_at?: string;
        };
      };
      system_metrics: {
        Row: {
          id: string;
          metric_type: string;
          value: number;
          metadata: Record<string, unknown>;
          created_at: string;
        };
        Insert: {
          id?: string;
          metric_type: string;
          value: number;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
        Update: {
          id?: string;
          metric_type?: string;
          value?: number;
          metadata?: Record<string, unknown>;
          created_at?: string;
        };
      };
    };
    Views: {
      user_stats: {
        Row: {
          total_submissions: number;
          total_votes: number;
          total_rewards: number;
          last_activity: string;
        };
      };
    };
    Functions: {
      get_user_stats: {
        Args: { user_id: string };
        Returns: {
          total_submissions: number;
          total_votes: number;
          total_rewards: number;
          last_activity: string;
        };
      };
      process_transaction: {
        Args: {
          p_user_id: string;
          p_type: string;
          p_amount: number;
          p_description?: string;
          p_reference_id?: string;
        };
        Returns: string;
      };
      purchase_vote_pack: {
        Args: {
          p_user_id: string;
          p_type: string;
          p_amount: number;
        };
        Returns: string;
      };
    };
  };
}; 