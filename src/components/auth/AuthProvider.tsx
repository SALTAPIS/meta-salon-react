import { createContext, useEffect, useState, useContext } from 'react';
import { AuthService } from '../../services/auth/authService';
import type { User, AuthContextType, SignInResponse, SignUpResponse } from '../../types/user';
import { supabase } from '../../lib/supabase';

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const CACHED_USER_KEY = 'cached_user';
const CACHED_BALANCE_KEY = 'cached_balance';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  console.log('[AuthProvider] Initializing...');
  
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
    console.log('[AuthProvider] Setting up profile update listener');
    // Listen for profile updates
    const unsubscribeProfileUpdate = authService.onProfileUpdate((updatedProfile) => {
      console.log('[AuthProvider] Profile update received:', updatedProfile);
      setUser(prevUser => {
        if (!prevUser) {
          console.log('[AuthProvider] No previous user, ignoring profile update');
          return null;
        }
        const newUser = { ...prevUser, ...updatedProfile };
        console.log('[AuthProvider] Updating user with new profile:', newUser);
        localStorage.setItem(CACHED_USER_KEY, JSON.stringify(newUser));
        if (newUser.balance !== undefined) {
          localStorage.setItem(CACHED_BALANCE_KEY, newUser.balance.toString());
        }
        return newUser;
      });
    });

    return () => {
      console.log('[AuthProvider] Cleaning up profile update listener');
      unsubscribeProfileUpdate();
    };
  }, []);

  const updateUserBalance = (newBalance: number) => {
    console.log('[AuthProvider] Updating user balance:', newBalance);
    if (!user) {
      console.log('[AuthProvider] No user found, cannot update balance');
      return;
    }
    
    try {
      // Update local state
      const updatedUser = { ...user, balance: newBalance };
      setUser(updatedUser);
      
      // Update cache atomically
      localStorage.setItem(CACHED_USER_KEY, JSON.stringify(updatedUser));
      localStorage.setItem(CACHED_BALANCE_KEY, newBalance.toString());
      
      console.log('[AuthProvider] Balance updated successfully:', {
        newBalance,
        userId: user.id,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('[AuthProvider] Balance update failed:', {
        error,
        userId: user?.id,
        attempted_balance: newBalance,
        timestamp: new Date().toISOString()
      });
    }
  };

  const refreshUser = async () => {
    console.log('[AuthProvider] Refreshing user...');
    try {
      const currentUser = await authService.getCurrentUser();
      console.log('[AuthProvider] Got current user:', currentUser);
      
      if (currentUser) {
        // Preserve the cached balance if it exists and no new balance is provided
        if (cachedBalance && currentUser.balance === undefined) {
          currentUser.balance = parseInt(cachedBalance, 10);
          console.log('[AuthProvider] Applied cached balance:', currentUser.balance);
        }
        setUser(currentUser);
        localStorage.setItem(CACHED_USER_KEY, JSON.stringify(currentUser));
        if (currentUser.balance !== undefined) {
          localStorage.setItem(CACHED_BALANCE_KEY, currentUser.balance.toString());
        }
        console.log('[AuthProvider] User refreshed successfully:', currentUser);
      } else {
        console.log('[AuthProvider] No user found, clearing state');
        setUser(null);
        localStorage.removeItem(CACHED_USER_KEY);
        localStorage.removeItem(CACHED_BALANCE_KEY);
      }
    } catch (error) {
      console.error('[AuthProvider] Error refreshing user:', error);
      setUser(null);
      localStorage.removeItem(CACHED_USER_KEY);
      localStorage.removeItem(CACHED_BALANCE_KEY);
    }
  };

  useEffect(() => {
    console.log('[AuthProvider] Setting up initial auth check');
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        console.log('[AuthProvider] Initial session check:', { 
          hasSession: !!session,
          userId: session?.user?.id 
        });
        
        if (session?.user) {
          await refreshUser();
        } else {
          console.log('[AuthProvider] No session found, clearing state');
          setUser(null);
          localStorage.removeItem(CACHED_USER_KEY);
          localStorage.removeItem(CACHED_BALANCE_KEY);
        }
      } catch (error) {
        console.error('[AuthProvider] Error checking user:', error);
        setUser(null);
        localStorage.removeItem(CACHED_USER_KEY);
        localStorage.removeItem(CACHED_BALANCE_KEY);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();

    console.log('[AuthProvider] Setting up auth state change listener');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthProvider] Auth state changed:', { 
        event, 
        userId: session?.user?.id,
        timestamp: new Date().toISOString()
      });
      
      if (session?.user) {
        await refreshUser();
      } else {
        console.log('[AuthProvider] No session in auth change, clearing state');
        setUser(null);
        localStorage.removeItem(CACHED_USER_KEY);
        localStorage.removeItem(CACHED_BALANCE_KEY);
      }
    });

    return () => {
      console.log('[AuthProvider] Cleaning up auth state listener');
      subscription.unsubscribe();
    };
  }, []);

  const value: AuthContextType = {
    user,
    isLoading,
    signInWithPassword: async (email: string, password: string): Promise<SignInResponse> => {
      console.log('[AuthProvider] Attempting sign in for:', email);
      setIsLoading(true);
      try {
        const result = await authService.signInWithPassword(email, password);
        console.log('[AuthProvider] Sign in result:', { 
          success: !result.error,
          hasUser: !!result.data?.user,
          error: result.error?.message
        });
        
        if (!result.error && result.data?.user) {
          console.log('[AuthProvider] Loading user profile after sign in');
          const userProfile = await authService.loadUserProfile(result.data.user);
          console.log('[AuthProvider] User profile loaded:', userProfile);
          return {
            data: {
              user: userProfile,
              session: result.data.session
            },
            error: null
          };
        }
        return {
          data: null,
          error: result.error || new Error('No user data in response')
        };
      } catch (error) {
        console.error('[AuthProvider] Sign in error:', error);
        return {
          data: null,
          error: error instanceof Error ? error : new Error('Unknown error during sign in')
        };
      } finally {
        setIsLoading(false);
      }
    },
    signInWithEmail: async (email: string) => {
      console.log('[AuthProvider] Attempting magic link sign in for:', email);
      setIsLoading(true);
      try {
        const result = await authService.signInWithEmail(email);
        console.log('[AuthProvider] Magic link result:', {
          success: !result.error,
          error: result.error?.message
        });
        return result;
      } finally {
        setIsLoading(false);
      }
    },
    signUpWithPassword: async (email: string, password: string): Promise<SignUpResponse> => {
      console.log('[AuthProvider] Attempting sign up for:', email);
      setIsLoading(true);
      try {
        const result = await authService.signUpWithPassword(email, password);
        console.log('[AuthProvider] Sign up result:', {
          success: !result.error,
          hasUser: !!result.data?.user,
          error: result.error?.message
        });
        
        if (!result.error && result.data?.user) {
          console.log('[AuthProvider] Creating default user profile');
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
          console.log('[AuthProvider] Default user profile created:', defaultUser);
          return {
            data: { user: defaultUser },
            error: null
          };
        }
        return {
          data: null,
          error: result.error || new Error('No user data in response')
        };
      } catch (error) {
        console.error('[AuthProvider] Sign up error:', error);
        return {
          data: null,
          error: error instanceof Error ? error : new Error('Unknown error during sign up')
        };
      } finally {
        setIsLoading(false);
      }
    },
    signOut: async () => {
      console.log('[AuthProvider] Signing out');
      setIsLoading(true);
      try {
        await authService.signOut();
        console.log('[AuthProvider] Sign out successful, clearing state');
        setUser(null);
        localStorage.removeItem(CACHED_USER_KEY);
        localStorage.removeItem(CACHED_BALANCE_KEY);
      } catch (error) {
        console.error('[AuthProvider] Sign out error:', error);
      } finally {
        setIsLoading(false);
      }
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