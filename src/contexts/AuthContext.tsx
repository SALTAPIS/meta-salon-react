import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { AuthService } from '../services/auth/authService';
import type { User } from '../types/user';

export interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: Error | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const authService = AuthService.getInstance();

  useEffect(() => {
    console.log('[AuthContext] Setting up auth state listener');
    
    const loadUser = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (err) {
        console.error('[AuthContext] Error loading user:', err);
        setError(err instanceof Error ? err : new Error('Failed to load user'));
      } finally {
        setLoading(false);
      }
    };

    loadUser();

    const handleAuthChange = (event: string, session: Session | null) => {
      console.log('[AuthContext] Auth state changed:', event, session?.user?.id);
      
      if (event === 'SIGNED_IN') {
        authService.getCurrentUser().then(user => {
          setUser(user);
          setError(null);
        });
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setError(null);
      } else if (event === 'USER_UPDATED') {
        authService.getCurrentUser().then(user => {
          setUser(user);
          setError(null);
        });
      }
    };

    authService.on('authStateChange', handleAuthChange);

    return () => {
      authService.off('authStateChange', handleAuthChange);
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const { user: signedInUser } = await authService.signIn({ email, password });
      setUser(signedInUser);
    } catch (err) {
      console.error('[AuthContext] Sign in error:', err);
      setError(err instanceof Error ? err : new Error('Failed to sign in'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await authService.signUp({
        email,
        password,
        username: email.split('@')[0], // Default username from email
        displayName: email.split('@')[0], // Default display name from email
      });
      console.log('Signup response:', result);
    } catch (err) {
      console.error('[AuthContext] Sign up error:', err);
      setError(err instanceof Error ? err : new Error('Failed to sign up'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);
      await authService.signOut();
      setUser(null);
    } catch (err) {
      console.error('[AuthContext] Sign out error:', err);
      setError(err instanceof Error ? err : new Error('Failed to sign out'));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        signIn,
        signUp,
        signOut,
        isLoading: loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 