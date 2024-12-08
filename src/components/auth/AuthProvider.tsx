import { createContext, useEffect, useState, useContext } from 'react';
import { AuthService } from '../../services/auth/authService';
import { User } from '../../types/user';
import { supabase } from '../../lib/supabase';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signInWithPassword: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithEmail: (email: string) => Promise<{ error: Error | null }>;
  signUpWithPassword: (email: string, password: string) => Promise<{ data: { user: User | null } | null; error: Error | null }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateUserBalance: (newBalance: number) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CACHED_USER_KEY = 'cached_user';
const CACHED_BALANCE_KEY = 'cached_balance';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Try to get cached user and balance first
  const cachedUser = localStorage.getItem(CACHED_USER_KEY);
  const cachedBalance = localStorage.getItem(CACHED_BALANCE_KEY);
  const initialUser = cachedUser ? JSON.parse(cachedUser) as User : null;
  if (initialUser && cachedBalance) {
    initialUser.balance = parseInt(cachedBalance, 10);
  }
  
  const [user, setUser] = useState<User | null>(initialUser);
  const [isLoading, setIsLoading] = useState(!initialUser);
  const authService = AuthService.getInstance();

  useEffect(() => {
    // Listen for profile updates
    const unsubscribeProfileUpdate = authService.onProfileUpdate((updatedProfile) => {
      setUser(prevUser => {
        if (!prevUser) return null;
        const newUser = { ...prevUser, ...updatedProfile };
        localStorage.setItem(CACHED_USER_KEY, JSON.stringify(newUser));
        if (newUser.balance !== undefined) {
          localStorage.setItem(CACHED_BALANCE_KEY, newUser.balance.toString());
        }
        return newUser;
      });
    });

    return () => {
      unsubscribeProfileUpdate();
    };
  }, []);

  const updateUserBalance = (newBalance: number) => {
    if (!user) return;
    
    try {
      // Update local state
      const updatedUser = { ...user, balance: newBalance };
      setUser(updatedUser);
      
      // Update cache atomically
      localStorage.setItem(CACHED_USER_KEY, JSON.stringify(updatedUser));
      localStorage.setItem(CACHED_BALANCE_KEY, newBalance.toString());
      
      console.log('Balance updated successfully:', {
        newBalance,
        userId: user.id,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Balance update failed:', {
        error,
        userId: user?.id,
        attempted_balance: newBalance,
        timestamp: new Date().toISOString()
      });
    }
  };

  const refreshUser = async () => {
    try {
      const currentUser = await authService.getCurrentUser();
      if (currentUser) {
        // Preserve the cached balance if it exists and no new balance is provided
        if (cachedBalance && currentUser.balance === undefined) {
          currentUser.balance = parseInt(cachedBalance, 10);
        }
        setUser(currentUser);
        localStorage.setItem(CACHED_USER_KEY, JSON.stringify(currentUser));
        if (currentUser.balance !== undefined) {
          localStorage.setItem(CACHED_BALANCE_KEY, currentUser.balance.toString());
        }
      } else {
        setUser(null);
        localStorage.removeItem(CACHED_USER_KEY);
        localStorage.removeItem(CACHED_BALANCE_KEY);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      setUser(null);
      localStorage.removeItem(CACHED_USER_KEY);
      localStorage.removeItem(CACHED_BALANCE_KEY);
    }
  };

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          await refreshUser();
        } else {
          setUser(null);
          localStorage.removeItem(CACHED_USER_KEY);
          localStorage.removeItem(CACHED_BALANCE_KEY);
        }
      } catch (error) {
        console.error('Error checking user:', error);
        setUser(null);
        localStorage.removeItem(CACHED_USER_KEY);
        localStorage.removeItem(CACHED_BALANCE_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);
      
      if (session?.user) {
        await refreshUser();
      } else {
        setUser(null);
        localStorage.removeItem(CACHED_USER_KEY);
        localStorage.removeItem(CACHED_BALANCE_KEY);
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
      localStorage.removeItem(CACHED_USER_KEY);
      localStorage.removeItem(CACHED_BALANCE_KEY);
    },
    refreshUser,
    updateUserBalance,
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