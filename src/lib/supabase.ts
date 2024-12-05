import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Initialize Supabase client
export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    },
    db: {
      schema: 'public'
    }
  }
);

// Helper to check database connection and tables
export async function checkDatabaseSetup() {
  try {
    // Check if tables exist
    const { error: tablesError } = await supabase
      .from('profiles')
      .select('count');
    
    if (tablesError) {
      console.error('Error accessing profiles table:', tablesError);
      return false;
    }

    // Check RLS policies by trying to read own profile
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (profileError) {
        console.error('Error accessing own profile:', profileError);
        return false;
      }
    }

    // Check if vote_packs table exists
    const { error: votePacksError } = await supabase
      .from('vote_packs')
      .select('count');

    if (votePacksError) {
      console.error('Error accessing vote_packs table:', votePacksError);
      return false;
    }

    // Check if transactions table exists
    const { error: transactionsError } = await supabase
      .from('transactions')
      .select('count');

    if (transactionsError) {
      console.error('Error accessing transactions table:', transactionsError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Database setup check failed:', error);
    return false;
  }
}
 