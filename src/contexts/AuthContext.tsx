import React from 'react';
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

  const handleAuthChange = async (_event: string, session: Session | null) => {
    setIsLoading(true);
    try {
      if (session?.user) {
        const user = await authService.loadUserProfile(session.user);
        setUser(user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error handling auth change:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    let mounted = true;

    const initAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        if (mounted) {
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        if (mounted) {
          setUser(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    const { data: { subscription } } = authService.onAuthStateChange(handleAuthChange);
    initAuth();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Listen for profile updates
  React.useEffect(() => {
    const unsubscribeProfileUpdate = authService.onProfileUpdate((updatedProfile) => {
      setUser(updatedProfile);
    });

    return () => {
      unsubscribeProfileUpdate();
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
      setIsLoading(true);
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } finally {
        setIsLoading(false);
      }
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