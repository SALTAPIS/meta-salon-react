import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

let supabaseInstance: SupabaseClient<Database> | null = null;

export const getSupabaseClient = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        storageKey: 'meta-salon-auth',
        autoRefreshToken: true,
        detectSessionInUrl: true,
      }
    });
  }
  return supabaseInstance;
};

export const supabase = getSupabaseClient();
 