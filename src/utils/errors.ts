import { AuthError } from '@supabase/supabase-js';

export function createAuthError(message: string): AuthError {
  return new AuthError(message);
}

/**
 * Standard error handler for service operations
 */
export function handleError(error: unknown, defaultMessage: string): Error {
  console.error('Operation failed:', error);
  
  if (error instanceof Error) {
    return error;
  }
  
  return new Error(defaultMessage);
} 