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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const authService = AuthService.getInstance();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      } catch (error) {
        console.error('Error checking user:', error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();

    const { data: { subscription } } = authService.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user as ExtendedUser);
      } else {
        setUser(null);
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
    signOut: authService.signOut.bind(authService),
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