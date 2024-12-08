import * as React from 'react';
import { Session } from '@supabase/supabase-js';
import type { AuthContextType, User } from '../types/user';
import { AuthService } from '../services/auth/authService';

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

export const AuthContext = React.createContext<AuthContextType>(defaultContext);
AuthContext.displayName = 'AuthContext';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const authService = AuthService.getInstance();

  const handleAuthChange = async (event: string, session: Session | null) => {
    if (session?.user) {
      const user = await authService.loadUserProfile(session.user);
      setUser(user);
    } else {
      setUser(null);
    }
    setIsLoading(false);
  };

  React.useEffect(() => {
    const initAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const { data: { subscription } } = authService.onAuthStateChange(handleAuthChange);
    initAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const updateUserBalance = (newBalance: number) => {
    if (user) {
      setUser({ ...user, balance: newBalance });
    }
  };

  const value = {
    user,
    isLoading,
    signInWithPassword: authService.signInWithPassword.bind(authService),
    signInWithEmail: authService.signInWithEmail.bind(authService),
    signUpWithPassword: authService.signUpWithPassword.bind(authService),
    signOut: authService.signOut.bind(authService),
    refreshUser: async () => {
      const currentUser = await authService.getCurrentUser();
      setUser(currentUser);
    },
    updateUserBalance,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 