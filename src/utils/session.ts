import { supabase } from '../lib/supabaseClient';
import { Session } from '@supabase/supabase-js';

/**
 * Get the current session
 * @returns The current session or null if not authenticated
 */
export async function getSession(): Promise<Session | null> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Failed to get session:', error);
      return null;
    }
    return session;
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
} 