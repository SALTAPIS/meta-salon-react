import { AuthError, User } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { ExtendedUser } from '../../components/auth/AuthProvider';

export class AuthService {
  private static instance: AuthService;

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async loadUserProfile(user: User): Promise<ExtendedUser> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      return {
        ...user,
        role: profile?.role || 'user',
        balance: profile?.balance || 0,
        username: profile?.username || null,
        display_name: profile?.display_name || null,
        bio: profile?.bio || null,
        avatar_url: profile?.avatar_url || null,
        email_verified: profile?.email_verified || false,
        email_notifications: profile?.email_notifications ?? true,
      };
    } catch (error) {
      console.error('Error loading profile:', error);
      return {
        ...user,
        role: 'user',
        balance: 0,
        username: null,
        display_name: null,
        bio: null,
        avatar_url: null,
        email_verified: false,
        email_notifications: true,
      };
    }
  }

  async getCurrentUser(): Promise<ExtendedUser | null> {
    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) throw sessionError;
      if (!session?.user) return null;

      return await this.loadUserProfile(session.user);
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const extendedUser = await this.loadUserProfile(session.user);
        callback(event, { ...session, user: extendedUser });
      } else {
        callback(event, session);
      }
    });
  }

  async signInWithPassword(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) throw error;
      
      return { error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { error: error as AuthError };
    }
  }

  async signInWithEmail(email: string) {
    try {
      const { error } = await supabase.auth.signInWithOtp({ 
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) throw error;
      
      return { error: null };
    } catch (error) {
      console.error('Sign in with email error:', error);
      return { error: error as AuthError };
    }
  }

  async signUpWithPassword(email: string, password: string) {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) throw error;
      
      return { error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { error: error as AuthError };
    }
  }

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }
} 