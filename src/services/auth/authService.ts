import { AuthError, User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import { User, ProfileUpdate } from '../../types/user';

// Define event map type for type safety
interface EventMap extends Record<string, unknown> {
  profileUpdate: User;
  // Add other events here as needed
  [key: string]: unknown; // Add index signature for string keys
}

// Simple event emitter implementation for browser
class SimpleEventEmitter<Events extends Record<string, unknown>> {
  private listeners: {
    [K in keyof Events]?: Array<(data: Events[K]) => void>;
  } = {};

  on<K extends keyof Events>(event: K, callback: (data: Events[K]) => void): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]?.push(callback);
  }

  emit<K extends keyof Events>(event: K, data: Events[K]): void {
    if (this.listeners[event]) {
      this.listeners[event]?.forEach(callback => callback(data));
    }
  }

  off<K extends keyof Events>(event: K, callback: (data: Events[K]) => void): void {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event]?.filter(cb => cb !== callback);
    }
  }
}

export class AuthService extends SimpleEventEmitter<EventMap> {
  private static instance: AuthService;

  private constructor() {
    super();
  }

  static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  onProfileUpdate(callback: (profile: User) => void) {
    this.on('profileUpdate', callback);
    return () => this.off('profileUpdate', callback);
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
      // First get the current profile to preserve existing values
      const { data: currentProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (fetchError) throw fetchError;

      // Preserve balance and other critical fields
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          ...updates,
          balance: currentProfile.balance, // Preserve the current balance
          role: currentProfile.role, // Preserve the current role
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Get the updated profile
      const { data: updatedProfile, error: refreshError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (refreshError) throw refreshError;

      // Update local storage with the new profile data
      localStorage.setItem('cached_user', JSON.stringify(updatedProfile));

      // Emit profile update event
      this.emit('profileUpdate', updatedProfile);

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
      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password 
      });
      
      if (error) throw error;

      // Load and cache the user profile after successful sign in
      if (data.user) {
        const extendedUser = await this.loadUserProfile(data.user);
        localStorage.setItem('cached_user', JSON.stringify(extendedUser));
        if (extendedUser.balance !== undefined) {
          localStorage.setItem('cached_balance', extendedUser.balance.toString());
        }
      }
      
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
      console.log('Starting signup process for:', email);
      
      // Log the redirect URL
      const redirectUrl = `${window.location.origin}/auth/callback`;
      console.log('Email confirmation redirect URL:', redirectUrl);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            email_confirmed: false,
          }
        },
      });
      
      if (error) {
        console.error('Signup error:', error);
        throw error;
      }

      console.log('Signup response:', {
        user: {
          id: data.user?.id,
          email: data.user?.email,
          created_at: data.user?.created_at,
          email_confirmed: data.user?.email_confirmed_at,
          last_sign_in: data.user?.last_sign_in_at,
        },
        session: data.session ? 'Session created' : 'No session',
      });

      // Check if email confirmation was sent
      if (!data.user) {
        console.error('No user data returned from signup');
        throw new Error('Failed to create user account');
      }

      if (data.user.identities?.length === 0) {
        console.error('Email already registered');
        throw new Error('Email address already registered');
      }

      // Log email confirmation status
      console.log('Email confirmation details:', {
        confirmationEmailSent: true,
        emailTo: email,
        redirectUrl: redirectUrl,
        provider: 'noreply@mail.app.supabase.io',
        subject: 'Welcome to Meta.Salon - Confirm Your Account'
      });

      // Create initial profile
      if (data.user) {
        console.log('Creating initial profile for user:', data.user.id);
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            email: data.user.email,
            email_verified: false,
            role: 'user',
            balance: 0,
          }, {
            onConflict: 'id'
          });

        if (profileError) {
          console.error('Error creating initial profile:', profileError);
        }
      }

      const extendedUser = data.user ? await this.loadUserProfile(data.user) : null;
      console.log('Signup completed successfully');
      
      return { 
        data: { 
          user: extendedUser,
          message: 'Please check your email for the confirmation link. The email will be sent from noreply@mail.app.supabase.io with subject "Welcome to Meta.Salon - Confirm Your Account"'
        },
        error: null 
      };
    } catch (error) {
      console.error('Signup process failed:', error);
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