import { User } from '@supabase/supabase-js';
import { createContext, useEffect, useState } from 'react';
import { AuthService } from '../../services/auth/authService';

export interface ExtendedUser extends User {
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
  signInWithPassword: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithEmail: (email: string) => Promise<{ error: Error | null }>;
  signUpWithPassword: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<ExtendedUser | null>(null);
  const authService = AuthService.getInstance();

  useEffect(() => {
    const checkUser = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser as ExtendedUser | null);
      } catch (error) {
        console.error('Error checking user:', error);
        setUser(null);
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