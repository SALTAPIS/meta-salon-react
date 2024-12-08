import { createClient } from '@supabase/supabase-js';
import { Database } from '../types/database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

console.log('[Supabase] Initializing clients:', {
  url: supabaseUrl,
  anon_key: supabaseAnonKey ? '✓ Set' : '✗ Missing',
  service_key: supabaseServiceKey ? '✓ Set' : '✗ Missing',
  timestamp: new Date().toISOString()
});

// Create the regular Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'meta-salon-auth',
    autoRefreshToken: true,
    detectSessionInUrl: true
  }
});

// Create the admin client for operations that need elevated privileges
export const supabaseAdmin = supabaseServiceKey ? createClient<Database>(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
}) : null;

console.log('[Supabase] Clients initialized:', {
  regular: supabase ? {
    url: supabaseUrl,
    auth: supabase.auth ? '✓ Available' : '✗ Missing',
  } : '✗ Failed to initialize',
  admin: supabaseAdmin ? {
    url: supabaseUrl,
    auth: supabaseAdmin.auth ? '✓ Available' : '✗ Missing',
  } : '✗ Not available',
  timestamp: new Date().toISOString()
});
 