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
          full_name: string | null;
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
          full_name?: string | null;
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
          full_name?: string | null;
          avatar_url?: string | null;
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
          full_name: string | null;
          avatar_url: string | null;
          updated_at: string;
        }[];
      };
    };
  };
} 