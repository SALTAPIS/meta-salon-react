import { PostgrestError } from '@supabase/supabase-js';

/**
 * Handles errors from API calls and other operations
 * @param error The error to handle
 * @param defaultMessage Default message to show if error is not recognized
 * @returns A standardized error object
 */
export function handleError(error: unknown, defaultMessage: string): Error {
  if (error instanceof Error) {
    return error;
  }
  
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return new Error(error.message as string);
  }

  if ((error as PostgrestError)?.message) {
    return new Error((error as PostgrestError).message);
  }

  return new Error(defaultMessage);
} 