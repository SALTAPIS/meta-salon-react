export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          role: 'guest' | 'user' | 'member' | 'moderator' | 'admin';
          wallet: string | null;
          balance: number;
          premium_until: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          role?: 'guest' | 'user' | 'member' | 'moderator' | 'admin';
          wallet?: string | null;
          balance?: number;
          premium_until?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          email?: string;
          role?: 'guest' | 'user' | 'member' | 'moderator' | 'admin';
          wallet?: string | null;
          balance?: number;
          premium_until?: string | null;
          updated_at?: string;
        };
      };
      challenges: {
        Row: {
          id: string;
          title: string;
          description: string;
          type: 'main' | 'public' | 'private';
          status: 'created' | 'active' | 'voting' | 'calculating' | 'distributing' | 'completed';
          start_time: string;
          end_time: string;
          reward_pool: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          type: 'main' | 'public' | 'private';
          status?: 'created' | 'active' | 'voting' | 'calculating' | 'distributing' | 'completed';
          start_time: string;
          end_time: string;
          reward_pool?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string;
          type?: 'main' | 'public' | 'private';
          status?: 'created' | 'active' | 'voting' | 'calculating' | 'distributing' | 'completed';
          start_time?: string;
          end_time?: string;
          reward_pool?: number;
          updated_at?: string;
        };
      };
      entries: {
        Row: {
          id: string;
          user_id: string;
          challenge_id: string;
          title: string;
          description: string | null;
          image_url: string;
          ordinal_id: string | null;
          status: 'pending' | 'approved' | 'rejected';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          challenge_id: string;
          title: string;
          description?: string | null;
          image_url: string;
          ordinal_id?: string | null;
          status?: 'pending' | 'approved' | 'rejected';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          title?: string;
          description?: string | null;
          image_url?: string;
          ordinal_id?: string | null;
          status?: 'pending' | 'approved' | 'rejected';
          updated_at?: string;
        };
      };
      votes: {
        Row: {
          id: string;
          user_id: string;
          challenge_id: string;
          entry_id: string;
          power: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          challenge_id: string;
          entry_id: string;
          power: number;
          created_at?: string;
        };
        Update: {
          power?: number;
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
          type?: 'grant' | 'submission' | 'vote_pack' | 'reward' | 'premium' | 'refund';
          amount?: number;
          description?: string | null;
          reference_id?: string | null;
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
          type?: 'basic' | 'art_lover' | 'pro' | 'expert' | 'elite';
          votes_remaining?: number;
          vote_power?: number;
          expires_at?: string | null;
        };
      };
    };
    Views: {
      user_stats: {
        Row: {
          user_id: string;
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
          p_type: 'grant' | 'submission' | 'vote_pack' | 'reward' | 'premium' | 'refund';
          p_amount: number;
          p_description?: string;
          p_reference_id?: string;
        };
        Returns: string;
      };
      purchase_vote_pack: {
        Args: {
          p_user_id: string;
          p_type: 'basic' | 'art_lover' | 'pro' | 'expert' | 'elite';
          p_amount: number;
        };
        Returns: string;
      };
    };
  };
} 