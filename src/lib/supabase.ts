import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/supabase';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Helper function to check if error is from Supabase
export function isSupabaseError(error: unknown): error is { 
  message: string; 
  status?: number 
} {
  return (
    typeof error === 'object' &&
    error !== null &&
    'message' in error
  );
}

// Helper to handle Supabase errors consistently
export function handleSupabaseError(error: unknown): Error {
  if (isSupabaseError(error)) {
    return new Error(`Database error (${error.status}): ${error.message}`);
  }
  return error instanceof Error ? error : new Error('An unknown error occurred');
} 