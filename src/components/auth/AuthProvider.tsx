import { User } from '@supabase/supabase-js';
import { createContext, useEffect, useState, useContext } from 'react';
import { AuthService } from '../../services/auth/authService';

export interface ExtendedUser extends Omit<User, 'role'> {
  role: string | null;
  balance: number;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  email_verified: boolean;
  email_notifications: boolean;
}

interface AuthContextType {
  user: ExtendedUser | null;
  isLoading: boolean;
  signInWithPassword: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithEmail: (email: string) => Promise<{ error: Error | null }>;
  signUpWithPassword: (email: string, password: string) => Promise<{ data: { user: ExtendedUser | null } | null; error: Error | null }>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CACHED_USER_KEY = 'cached_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Try to get cached user first
  const cachedUser = localStorage.getItem(CACHED_USER_KEY);
  const initialUser = cachedUser ? JSON.parse(cachedUser) as ExtendedUser : null;
  
  const [user, setUser] = useState<ExtendedUser | null>(initialUser);
  const [isLoading, setIsLoading] = useState(!initialUser);
  const authService = AuthService.getInstance();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
        if (currentUser) {
          localStorage.setItem(CACHED_USER_KEY, JSON.stringify(currentUser));
        } else {
          localStorage.removeItem(CACHED_USER_KEY);
        }
      } catch (error) {
        console.error('Error checking user:', error);
        setUser(null);
        localStorage.removeItem(CACHED_USER_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();

    const { data: { subscription } } = authService.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const extendedUser = session.user as ExtendedUser;
        setUser(extendedUser);
        localStorage.setItem(CACHED_USER_KEY, JSON.stringify(extendedUser));
      } else {
        setUser(null);
        localStorage.removeItem(CACHED_USER_KEY);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const value = {
    user,
    isLoading,
    signInWithPassword: authService.signInWithPassword.bind(authService),
    signInWithEmail: authService.signInWithEmail.bind(authService),
    signUpWithPassword: authService.signUpWithPassword.bind(authService),
    signOut: async () => {
      await authService.signOut();
      localStorage.removeItem(CACHED_USER_KEY);
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 