import { useState, useEffect, useCallback } from 'react';
import { AuthService } from '../../services/auth/authService';
import type { AuthState } from '../../types/auth/types';
import { supabase } from '../../lib/supabase';

const authService = new AuthService();

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    error: null,
  });

  const refreshState = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      const [session, user] = await Promise.all([
        authService.getSession(),
        authService.getUser(),
      ]);
      setState({ user, session, isLoading: false, error: null });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error as Error,
      }));
    }
  }, []);

  useEffect(() => {
    refreshState();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        await refreshState();
      } else if (event === 'SIGNED_OUT') {
        setState({
          user: null,
          session: null,
          isLoading: false,
          error: null,
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshState]);

  const signIn = async (email: string) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      await authService.signInWithEmail(email);
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error as Error,
      }));
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      await authService.signOut();
      setState({
        user: null,
        session: null,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error as Error,
      }));
      throw error;
    }
  };

  return {
    ...state,
    signIn,
    signOut,
    refresh: refreshState,
  };
} 