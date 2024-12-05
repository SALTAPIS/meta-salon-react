import { supabase } from '../../lib/supabase';
import type { AuthError, AuthResponse } from '@supabase/supabase-js';

const SITE_URL = import.meta.env.VITE_SITE_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://meta-salon-react.vercel.app');

export class AuthService {
  private static instance: AuthService;

  private constructor() {}

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async signInWithEmail(email: string): Promise<AuthResponse> {
    const redirectTo = `${SITE_URL}/auth/callback`;

    return await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    });
  }

  async signInWithPassword(email: string, password: string): Promise<AuthResponse> {
    try {
      console.log('Attempting sign in with password for:', email);
      const response = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (response.error) {
        console.error('Sign in error:', response.error);
      } else {
        console.log('Sign in successful:', response.data.user?.id);
      }

      return response;
    } catch (error) {
      console.error('Unexpected sign in error:', error);
      throw error;
    }
  }

  async signUpWithPassword(email: string, password: string): Promise<AuthResponse> {
    try {
      console.log('Starting signup process for:', email);
      const redirectTo = `${SITE_URL}/auth/callback?email=${encodeURIComponent(email)}`;

      const response = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectTo,
          data: {
            role: 'user',
            balance: 500 // Initial balance
          }
        }
      });

      if (response.error) {
        console.error('Signup error:', response.error);
        return response;
      }

      if (response.data.user) {
        console.log('User created successfully:', response.data.user.id);
        // The database trigger will handle profile creation
        // Wait a moment for the trigger to complete
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      return response;
    } catch (err) {
      console.error('Unexpected signup error:', err);
      return {
        data: { user: null, session: null },
        error: err as AuthError
      };
    }
  }

  async signOut(): Promise<void> {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error signing out:', error);
        throw error;
      }
    } catch (error) {
      console.error('Unexpected error during sign out:', error);
      throw error;
    }
  }

  async getCurrentUser() {
    console.log('Getting current user...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Error getting session:', sessionError);
      return null;
    }
    
    if (!session?.user) {
      console.log('No active session found');
      return null;
    }

    const user = session.user;
    console.log('Found authenticated user:', user.id);

    try {
      console.log('Fetching profile for user:', user.id);
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Error fetching profile:', profileError);
        // Return basic user without profile data rather than throwing
        return {
          ...user,
          role: 'user',
          balance: 0,
          wallet: null,
        };
      }

      console.log('Profile loaded:', profile);
      const fullUser = {
        ...user,
        role: profile?.role || 'user',
        balance: profile?.balance || 0,
        wallet: profile?.wallet || null,
        premiumUntil: profile?.premium_until ? new Date(profile.premium_until) : undefined,
      };

      console.log('Returning full user:', fullUser);
      return fullUser;
    } catch (error) {
      console.error('Unexpected error loading profile:', error);
      // Return basic user without profile data
      return {
        ...user,
        role: 'user',
        balance: 0,
        wallet: null,
      };
    }
  }

  async getSession() {
    return await supabase.auth.getSession();
  }

  async setSession(access_token: string, refresh_token: string) {
    try {
      const { data, error } = await supabase.auth.setSession({
        access_token,
        refresh_token
      });
      
      if (error) {
        console.error('Error setting session:', error);
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Unexpected error setting session:', error);
      throw error;
    }
  }
} 