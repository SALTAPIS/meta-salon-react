import { createContext, useEffect, useState, useContext } from 'react';
import { AuthService } from '../../services/auth/authService';
import { User } from '../../types/user';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signInWithPassword: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithEmail: (email: string) => Promise<{ error: Error | null }>;
  signUpWithPassword: (email: string, password: string) => Promise<{ data: { user: User | null } | null; error: Error | null }>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CACHED_USER_KEY = 'cached_user';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Try to get cached user first
  const cachedUser = localStorage.getItem(CACHED_USER_KEY);
  const initialUser = cachedUser ? JSON.parse(cachedUser) as User : null;
  
  const [user, setUser] = useState<User | null>(initialUser);
  const [isLoading, setIsLoading] = useState(!initialUser);
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
        const cachedUser = localStorage.getItem(CACHED_USER_KEY);
        if (cachedUser) {
          setUser(JSON.parse(cachedUser));
        }
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
    signOut: async () => {
      await authService.signOut();
      setUser(null);
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