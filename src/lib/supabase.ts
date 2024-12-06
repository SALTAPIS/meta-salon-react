import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Extend the Database type to include our RPC functions
declare module '../types/database.types' {
  interface Database {
    public: {
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
      } & Database['public']['Functions'];
    };
  }
}
 