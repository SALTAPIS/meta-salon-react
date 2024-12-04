import { useState, useEffect, useCallback } from 'react';
import type { User } from '../../types/user';
import { AuthService } from '../../services/auth/authService';
import { supabase } from '../../lib/supabase';

interface AuthState {
  user: User | null;
  isLoading: boolean;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
  });

  const loadUser = useCallback(async () => {
    try {
      console.log('Loading user profile...');
      const authService = AuthService.getInstance();
      const user = await authService.getCurrentUser();
      console.log('User profile loaded:', { 
        id: user?.id,
        email: user?.email,
        role: user?.role,
        balance: user?.balance
      });
      setState(prev => ({ 
        ...prev, 
        user: user as User | null,
        isLoading: false 
      }));
    } catch (error) {
      console.error('Error loading user:', error);
      setState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // Check initial session
    supabase.auth.getSession().then(({ data: { session }}) => {
      if (!mounted) return;
      
      console.log('Initial session check:', { 
        hasSession: !!session,
        userId: session?.user?.id
      });

      if (session?.user) {
        loadUser();
      } else {
        setState(prev => ({ ...prev, isLoading: false }));
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', { event, session });
        if (!mounted) return;

        if (event === 'SIGNED_IN') {
          console.log('User signed in, loading profile...');
          await loadUser();
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out, clearing state...');
          setState(prev => ({
            ...prev,
            user: null,
            isLoading: false,
          }));
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [loadUser]);

  const signInWithPassword = async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const authService = AuthService.getInstance();
      const result = await authService.signInWithPassword(email, password);
      if (result.error) {
        console.error('Sign in error:', result.error);
      }
      return result;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const signUpWithPassword = async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const authService = AuthService.getInstance();
      const result = await authService.signUpWithPassword(email, password);
      if (result.error) {
        console.error('Sign up error:', result.error);
      }
      return result;
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const signOut = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const authService = AuthService.getInstance();
      await authService.signOut();
      setState(prev => ({ ...prev, user: null }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  return {
    user: state.user,
    isLoading: state.isLoading,
    signInWithPassword,
    signUpWithPassword,
    signOut,
  };
} 