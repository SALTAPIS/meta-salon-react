import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

// Debug logging for environment variables
const envVars = {
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? {
    length: import.meta.env.VITE_SUPABASE_ANON_KEY.length,
    preview: import.meta.env.VITE_SUPABASE_ANON_KEY.substring(0, 20) + '...'
  } : 'Not set',
  VITE_SITE_URL: import.meta.env.VITE_SITE_URL,
  MODE: import.meta.env.MODE,
  DEV: import.meta.env.DEV,
  PROD: import.meta.env.PROD
};

console.log('Environment variables loaded:', JSON.stringify(envVars, null, 2));

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase configuration error:', {
    url: supabaseUrl || 'Missing URL',
    keyPresent: supabaseAnonKey ? 'Yes (length: ' + supabaseAnonKey.length + ')' : 'No'
  });
  throw new Error('Missing Supabase environment variables. Please check your .env file.');
}

// Enhanced debug logging
const clientConfig = {
  url: supabaseUrl,
  keyLength: supabaseAnonKey.length,
  keyPreview: supabaseAnonKey.substring(0, 20) + '...',
  keyValid: supabaseAnonKey.includes('eyJ') && supabaseAnonKey.split('.').length === 3,
  keyActual: supabaseAnonKey
};

console.log('Initializing Supabase client with:', JSON.stringify(clientConfig, null, 2));

// Initialize Supabase client with debug mode
export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      debug: true
    },
    db: {
      schema: 'public'
    }
  }
);

// Helper to check database connection and tables
export async function checkDatabaseSetup() {
  try {
    console.log('Checking database setup...');

    // Check if tables exist
    const { error: tablesError } = await supabase
      .from('profiles')
      .select('count');
    
    if (tablesError) {
      console.error('Error accessing profiles table:', tablesError);
      return false;
    }

    console.log('Profiles table accessible');

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

      console.log('Profile data:', profile);
    }

    // Check if vote_packs table exists
    const { error: votePacksError } = await supabase
      .from('vote_packs')
      .select('count');

    if (votePacksError) {
      console.error('Error accessing vote_packs table:', votePacksError);
      return false;
    }

    console.log('Vote packs table accessible');

    // Check if transactions table exists
    const { error: transactionsError } = await supabase
      .from('transactions')
      .select('count');

    if (transactionsError) {
      console.error('Error accessing transactions table:', transactionsError);
      return false;
    }

    console.log('Transactions table accessible');
    console.log('Database setup complete and working');
    return true;
  } catch (error) {
    console.error('Database setup check failed:', error);
    return false;
  }
}
 