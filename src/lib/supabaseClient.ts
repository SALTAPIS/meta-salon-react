import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Create singleton instances
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null;
let supabaseAdminInstance: ReturnType<typeof createClient<Database>> | null = null;

// Get or create the regular Supabase client
export const supabase = supabaseInstance || createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'meta-salon-auth',
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  // Use local Edge Functions in development
  ...(import.meta.env.DEV ? {
    edgeFunctionUrl: 'http://localhost:54321/functions/v1'
  } : {})
});

// Get or create the admin client for operations that need elevated privileges
export const supabaseAdmin = supabaseServiceKey ? (
  supabaseAdminInstance || createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
) : null;

// Store instances
supabaseInstance = supabase;
supabaseAdminInstance = supabaseAdmin; 