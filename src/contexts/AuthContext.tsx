import * as React from 'react';
import type { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { AuthService } from '../services/auth/authService';
import type { User, AuthContextType, SignInResponse, SignUpResponse } from '../types/user';
import { createAuthError } from '../utils/errors';

const defaultContext: AuthContextType = {
  user: null,
  isLoading: true,
  signInWithPassword: async () => ({ data: null, error: null }),
  signInWithEmail: async () => ({ data: null, error: null }),
  signUpWithPassword: async () => ({ data: null, error: null }),
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
  console.log('[AuthContext] Rendering AuthProvider');
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const authService = React.useMemo(() => AuthService.getInstance(), []);

  const loadUserProfile = React.useCallback(async (supabaseUser: SupabaseUser): Promise<User> => {
    console.log('[AuthContext] Loading user profile...');
    const user = await authService.loadUserProfile(supabaseUser);
    console.log('[AuthContext] User profile loaded:', user);
    return user;
  }, [authService]);

  const signInWithPassword = React.useCallback(async (email: string, password: string): Promise<SignInResponse> => {
    try {
      const result = await authService.signInWithPassword(email, password);
      if (result.error) {
        return { data: null, error: result.error };
      }

      if (!result.data?.user) {
        return { 
          data: null, 
          error: createAuthError('No user data in response') 
        };
      }

      const userProfile = await loadUserProfile(result.data.user);
      return {
        data: {
          user: userProfile,
          session: result.data.session
        },
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: createAuthError(error instanceof Error ? error.message : 'Unknown error')
      };
    }
  }, [authService, loadUserProfile]);

  const signInWithEmail = React.useCallback(async (email: string): Promise<SignInResponse> => {
    try {
      const result = await authService.signInWithEmail(email);
      return result;
    } catch (error) {
      return {
        data: null,
        error: createAuthError(error instanceof Error ? error.message : 'Unknown error')
      };
    }
  }, [authService]);

  const signUpWithPassword = React.useCallback(async (email: string, password: string): Promise<SignUpResponse> => {
    try {
      const result = await authService.signUpWithPassword(email, password);
      if (result.error) {
        return { data: null, error: result.error };
      }

      if (!result.data?.user) {
        return { 
          data: null, 
          error: createAuthError('No user data in response') 
        };
      }

      // Create a default user profile
      const defaultUser: User = {
        ...result.data.user,
        email: result.data.user.email || '',
        role: 'user',
        balance: 0,
        username: null,
        display_name: null,
        bio: null,
        avatar_url: null,
        email_verified: false,
        email_notifications: true,
        created_at: result.data.user.created_at,
        updated_at: result.data.user.created_at,
      };

      return {
        data: { user: defaultUser },
        error: null
      };
    } catch (error) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Unknown error')
      };
    }
  }, [authService]);

  const signOut = React.useCallback(async () => {
    await authService.signOut();
    setUser(null);
  }, [authService]);

  const refreshUser = React.useCallback(async () => {
    const user = await authService.getCurrentUser();
    setUser(user);
  }, [authService]);

  const updateUserBalance = React.useCallback((newBalance: number) => {
    setUser((prev: User | null) => prev ? { ...prev, balance: newBalance } : null);
  }, []);

  React.useEffect(() => {
    console.log('[AuthContext] Setting up auth state listener');
    const { data: { subscription } } = authService.onAuthStateChange(async (event: string, session: Session | null) => {
      console.log('[AuthContext] Auth state changed:', event, session?.user?.id);
      setIsLoading(true);
      if (session?.user) {
        const userProfile = await loadUserProfile(session.user);
        setUser(userProfile);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => {
      console.log('[AuthContext] Cleaning up auth state listener');
      subscription.unsubscribe();
    };
  }, [authService, loadUserProfile]);

  const value = React.useMemo(() => ({
    user,
    isLoading,
    signInWithPassword,
    signInWithEmail,
    signUpWithPassword,
    signOut,
    refreshUser,
    updateUserBalance,
  }), [user, isLoading, signInWithPassword, signInWithEmail, signUpWithPassword, signOut, refreshUser, updateUserBalance]);

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