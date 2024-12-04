import { supabase } from '../../lib/supabase';
import type { AuthError, AuthResponse } from '@supabase/supabase-js';

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
    const redirectTo = typeof window !== 'undefined' 
      ? `${window.location.origin}/auth/callback`
      : '/auth/callback';

    return await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectTo,
      },
    });
  }

  async signInWithPassword(email: string, password: string): Promise<AuthResponse> {
    return await supabase.auth.signInWithPassword({
      email,
      password,
    });
  }

  async signUpWithPassword(email: string, password: string): Promise<AuthResponse> {
    try {
      console.log('Starting signup process for:', email);
      const redirectTo = typeof window !== 'undefined' 
        ? `${window.location.origin}/auth/callback`
        : '/auth/callback';

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
    await supabase.auth.signOut();
  }

  async getCurrentUser() {
    console.log('Getting current user...');
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      console.log('No active session found');
      return null;
    }

    const user = session.user;
    console.log('Found authenticated user:', user.id);

    try {
      console.log('Fetching profile for user:', user.id);
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
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
} 