import React from 'react';
import { Session } from '@supabase/supabase-js';
import type { AuthContextType, User } from '../types/user';
import { AuthService } from '../services/auth/authService';
import { supabase } from '../lib/supabase';

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
  const authService = React.useMemo(() => AuthService.getInstance(), []);

  const handleAuthChange = React.useCallback(async (_event: string, session: Session | null) => {
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
  }, [authService]);

  // Initialize auth state
  React.useEffect(() => {
    let mounted = true;
    setIsLoading(true);

    const initAuth = async () => {
      try {
        // Check for existing session
        const { data: { session } } = await supabase.auth.getSession();
        if (mounted && session?.user) {
          const user = await authService.loadUserProfile(session.user);
          setUser(user);
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

    initAuth();

    return () => {
      mounted = false;
    };
  }, [authService]);

  // Subscribe to auth changes
  React.useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthChange);
    return () => {
      subscription.unsubscribe();
    };
  }, [handleAuthChange]);

  // Listen for profile updates
  React.useEffect(() => {
    const unsubscribeProfileUpdate = authService.onProfileUpdate((updatedProfile) => {
      setUser(updatedProfile);
    });

    return () => {
      unsubscribeProfileUpdate();
    };
  }, [authService]);

  const updateUserBalance = React.useCallback((newBalance: number) => {
    if (user) {
      setUser({ ...user, balance: newBalance });
    }
  }, [user]);

  const value = React.useMemo(() => ({
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
  }), [user, isLoading, authService, updateUserBalance]);

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