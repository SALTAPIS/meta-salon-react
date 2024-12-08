import { AuthError, User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { User, ProfileUpdate } from '../../types/user';

export class AuthService {
  private static instance: AuthService;

  private constructor() {}

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async loadUserProfile(user: SupabaseUser): Promise<User> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      const extendedUser: User = {
        ...user,
        email: user.email || '',
        role: profile?.role || 'user',
        balance: profile?.balance || 0,
        username: profile?.username || null,
        display_name: profile?.display_name || null,
        bio: profile?.bio || null,
        avatar_url: profile?.avatar_url || null,
        email_verified: profile?.email_verified || false,
        email_notifications: profile?.email_notifications ?? true,
        updated_at: profile?.updated_at || user.created_at,
      };

      return extendedUser;
    } catch (error) {
      console.error('Error loading profile:', error);
      const defaultUser: User = {
        ...user,
        email: user.email || '',
        role: 'user',
        balance: 0,
        username: null,
        display_name: null,
        bio: null,
        avatar_url: null,
        email_verified: false,
        email_notifications: true,
        updated_at: user.created_at,
      };
      return defaultUser;
    }
  }

  async updateProfile(userId: string, updates: ProfileUpdate): Promise<{ error: Error | null }> {
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Refresh the session to update the user context
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Load and cache the updated user profile
        const updatedUser = await this.loadUserProfile(session.user);
        localStorage.setItem('cached_user', JSON.stringify(updatedUser));
        
        // Force a session refresh to update the user metadata
        await supabase.auth.refreshSession();
      }

      return { error: null };
    } catch (error) {
      console.error('Error updating profile:', error);
      return { error: error instanceof Error ? error : new Error('Failed to update profile') };
    }
  }

  async getCurrentUser(): Promise<User | null> {
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

  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const extendedUser = await this.loadUserProfile(session.user);
        localStorage.setItem('cached_user', JSON.stringify(extendedUser));
        callback(event, {
          ...session,
          user: {
            ...session.user,
            role: extendedUser.role || undefined,
            user_metadata: {
              ...session.user.user_metadata,
              balance: extendedUser.balance,
              username: extendedUser.username,
              display_name: extendedUser.display_name,
              bio: extendedUser.bio,
              avatar_url: extendedUser.avatar_url,
              email_verified: extendedUser.email_verified,
              email_notifications: extendedUser.email_notifications,
            }
          }
        });
      } else {
        localStorage.removeItem('cached_user');
        callback(event, session);
      }
    });
  }

  async signInWithPassword(email: string, password: string) {
    try {
      const { error } = await supabase.auth.signInWithPassword({ 
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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) throw error;

      const extendedUser = data.user ? await this.loadUserProfile(data.user) : null;
      
      return { 
        data: { user: extendedUser },
        error: null 
      };
    } catch (error) {
      console.error('Sign up error:', error);
      return { 
        data: null,
        error: error as AuthError 
      };
    }
  }

  async signOut() {
    try {
      // Clear any local storage data first
      localStorage.clear();
      
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Force reload the page to clear any cached state
      window.location.href = '/auth/signin';
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  }
} 