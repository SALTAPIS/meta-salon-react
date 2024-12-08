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
        // Emit profile update event
        this.emit('profileUpdate', extendedUser);
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
      console.log('[AuthService] Starting signup process for:', email);

      // Check if user exists first
      const { data: { user: existingUser } } = await supabase.auth.getUser();
      if (existingUser) {
        console.log('[AuthService] User already exists:', existingUser.email);
        throw new Error('User already exists. Please sign in instead.');
      }

      // Sign up the user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            email_confirmed: false,
          }
        },
      });
      
      if (error) {
        console.error('[AuthService] Signup error:', error);
        throw error;
      }

      if (!data?.user) {
        console.error('[AuthService] No user returned from signup');
        throw new Error('Failed to create user account');
      }

      console.log('[AuthService] Signup successful:', data.user.email);

      // Create initial profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: data.user.id,
          email: data.user.email,
          email_verified: false,
          role: 'user',
          balance: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'id'
        });

      if (profileError) {
        console.error('[AuthService] Profile creation error:', profileError);
        // Don't throw here, as the user is already created
      } else {
        console.log('[AuthService] Profile created successfully');
      }

      // Sign out immediately to force email confirmation
      await supabase.auth.signOut();
      
      return { 
        data: { 
          user: data.user,
          message: 'Please check your email for the confirmation link'
        },
        error: null 
      };
    } catch (error) {
      console.error('[AuthService] Signup process error:', error);
      return { 
        data: null,
        error: error as AuthError 
      };
    }
  }

  async handleEmailConfirmation() {
    try {
      console.log('Starting email confirmation process');
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Session error:', error);
        throw error;
      }

      console.log('Current session:', session);

      if (session?.user) {
        console.log('Updating profile for user:', session.user.id);
        // Update profile with email_verified status
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            email_verified: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', session.user.id);

        if (updateError) {
          console.error('Profile update error:', updateError);
          throw updateError;
        }

        console.log('Profile updated successfully');

        // Load and cache the user profile
        const extendedUser = await this.loadUserProfile(session.user);
        console.log('Loaded user profile:', extendedUser);
        
        localStorage.setItem('cached_user', JSON.stringify(extendedUser));
        
        // Emit profile update event
        this.emit('profileUpdate', extendedUser);

        return { 
          data: { user: extendedUser },
          error: null 
        };
      }

      console.log('No session found during confirmation');
      return { 
        data: { user: null },
        error: new Error('No session found') 
      };
    } catch (error) {
      console.error('Email confirmation error:', error);
      return { 
        data: null,
        error: error instanceof Error ? error : new Error('Failed to confirm email') 
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

  async resendConfirmationEmail(email: string) {
    try {
      console.log('[AuthService] Attempting to resend confirmation email to:', email);
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      
      if (error) {
        console.error('[AuthService] Resend error:', error);
        throw error;
      }
      
      console.log('[AuthService] Confirmation email resent successfully');
      return { error: null };
    } catch (error) {
      console.error('[AuthService] Error resending confirmation email:', error);
      return { error: error as AuthError };
    }
  }

  async checkRecentSignups() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('email, created_at, email_verified')
        .order('created_at', { ascending: false })
        .limit(2);

      if (error) throw error;
      console.log('Recent signups:', data);
      return data;
    } catch (error) {
      console.error('Error checking recent signups:', error);
      return null;
    }
  }
} 