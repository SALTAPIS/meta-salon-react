import { createContext, useContext } from 'react';
import type { AuthContextType } from '../types/user';

const defaultContext: AuthContextType = {
  user: null,
  isLoading: true,
  signInWithPassword: async () => ({ error: null }),
  signInWithEmail: async () => ({ error: null }),
  signUpWithPassword: async () => ({ data: { user: null }, error: null }),
  signOut: async () => {},
  refreshUser: async () => {},
  updateUserBalance: () => {},
};

export const AuthContext = createContext<AuthContextType>(defaultContext);
AuthContext.displayName = 'AuthContext';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 