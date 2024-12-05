import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, AuthResponse, AuthError } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';

interface ExtendedUser extends User {
  balance?: number;
  wallet?: string | null;
  role?: string;
  premiumUntil?: Date | null;
  avatar_url?: string | null;
}

interface AuthState {
  user: ExtendedUser | null;
  isLoading: boolean;
  signInWithPassword: (email: string, password: string) => Promise<AuthResponse>;
  signUpWithPassword: (email: string, password: string) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthState>({
  user: null,
  isLoading: false,
  signInWithPassword: async () => ({ data: { user: null, session: null }, error: null }),
  signUpWithPassword: async () => ({ data: { user: null, session: null }, error: null }),
  signOut: async () => {}
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Omit<AuthState, 'signInWithPassword' | 'signUpWithPassword' | 'signOut'>>({
    user: null,
    isLoading: true
  });

  const loadUserProfile = async (user: User) => {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      const extendedUser = {
        ...user,
        role: profile?.role || 'user',
        balance: profile?.balance || 0,
        wallet: profile?.wallet || null,
        premiumUntil: profile?.premium_until ? new Date(profile.premium_until) : null,
        avatar_url: profile?.avatar_url || null
      };

      setState({ user: extendedUser, isLoading: false });
      
      if (window.location.pathname.startsWith('/auth/')) {
        window.location.href = '/dashboard';
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setState({ 
        user: {
          ...user,
          role: 'user',
          balance: 0,
          wallet: null,
          avatar_url: null
        }, 
        isLoading: false 
      });
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserProfile(session.user);
      } else {
        setState({ user: null, isLoading: false });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUserProfile(session.user);
      } else {
        setState({ user: null, isLoading: false });
        if (!window.location.pathname.startsWith('/auth/')) {
          window.location.href = '/auth/signin';
        }
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signUpWithPassword = async (email: string, password: string): Promise<AuthResponse> => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const siteUrl = import.meta.env.VITE_SITE_URL || window.location.origin;
      console.log('Using redirect URL:', `${siteUrl}/auth/callback`);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${siteUrl}/auth/callback`
        }
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      return {
        data: { user: null, session: null },
        error: error as AuthError
      };
    }
  };

  const signInWithPassword = async (email: string, password: string): Promise<AuthResponse> => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      return { 
        data: { user: null, session: null },
        error: error as AuthError
      };
    }
  };

  const signOut = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setState({ user: null, isLoading: false });
      window.location.href = '/auth/signin';
    } catch (error) {
      console.error('Sign out error:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const value = {
    ...state,
    signInWithPassword,
    signUpWithPassword,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 