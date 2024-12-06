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
        };
        Insert: {
          id: string;
          email?: string | null;
          role?: string | null;
          created_at?: string;
          balance?: number;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string | null;
          role?: string | null;
          created_at?: string;
          balance?: number;
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