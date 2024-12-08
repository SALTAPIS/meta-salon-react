import { createContext } from 'react';
import type { AuthContextType } from '../types/user';

// Provide default values for all required properties
export const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  signInWithPassword: async () => ({ error: null }),
  signInWithEmail: async () => ({ error: null }),
  signUpWithPassword: async () => ({ data: { user: null }, error: null }),
  signOut: async () => {},
  refreshUser: async () => {},
  updateUserBalance: () => {},
}); 