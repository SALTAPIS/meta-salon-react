import { AuthError } from '@supabase/supabase-js';

export function createAuthError(message: string): AuthError {
  return new AuthError(message);
} 