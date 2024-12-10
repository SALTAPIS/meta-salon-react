import { supabase } from '../../lib/supabaseClient';
import type { Session } from '@supabase/supabase-js';
import type { User } from '../../types/user';

interface SignUpData {
  email: string;
  password: string;
  username: string;
  displayName?: string;
}

interface SignInData {
  email: string;
  password: string;
}

type Events = {
  authStateChange: [string, Session | null];
};

class SimpleEventEmitter<T extends Record<string, any[]>> {
  private listeners: { [K in keyof T]?: Array<(...args: T[K]) => void> } = {};

  on<K extends keyof T>(event: K, callback: (...args: T[K]) => void): void {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event]?.push(callback);
  }

  off<K extends keyof T>(event: K, callback: (...args: T[K]) => void): void {
    const eventListeners = this.listeners[event];
    if (eventListeners) {
      this.listeners[event] = eventListeners.filter(cb => cb === callback);
    }
  }

  emit<K extends keyof T>(event: K, ...args: T[K]): void {
    this.listeners[event]?.forEach(callback => callback(...args));
  }
}

export class AuthService extends SimpleEventEmitter<Events> {
  private static instance: AuthService;
  private cachedUser: User | null = null;

  private constructor() {
    super();
    console.log('[AuthService] Initializing with environment:', {
      url: import.meta.env.VITE_SUPABASE_URL ? '✓ Set' : '✗ Missing',
      anon_key: import.meta.env.VITE_SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing',
      service_key: import.meta.env.VITE_SUPABASE_SERVICE_KEY ? '✓ Set' : '✗ Missing',
      site_url: import.meta.env.VITE_SITE_URL || window.location.origin,
      timestamp: new Date().toISOString(),
    });

    // Set up auth state change listener
    supabase.auth.onAuthStateChange((event, session) => {
      this.emit('authStateChange', event, session);
    });
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async signUp({ email, password, username, displayName }: SignUpData) {
    try {
      // First, sign up the user
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            username,
            display_name: displayName,
          },
        },
      });

      if (signUpError) throw signUpError;

      console.log('[AuthService] Sign up successful:', {
        userId: signUpData.user?.id,
        email: signUpData.user?.email,
        timestamp: new Date().toISOString(),
      });

      if (!signUpData.user?.id) {
        throw new Error('No user ID returned from sign up');
      }

      // Create initial profile with retry logic
      let retryCount = 0;
      const maxRetries = 3;
      let profileError;

      while (retryCount < maxRetries) {
        try {
          const { error } = await supabase.rpc('create_initial_profile', {
            user_id: signUpData.user.id,
            user_email: email,
            user_role: 'user',
            initial_balance: 500
          });

          if (!error) {
            console.log('[AuthService] Profile created successfully');
            break;
          }

          profileError = error;
          retryCount++;
          
          if (retryCount < maxRetries) {
            console.log(`[AuthService] Retrying profile creation (attempt ${retryCount + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          }
        } catch (error) {
          profileError = error;
          retryCount++;
          
          if (retryCount < maxRetries) {
            console.log(`[AuthService] Retrying profile creation (attempt ${retryCount + 1}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          }
        }
      }

      if (profileError) {
        console.error('[AuthService] Error creating profile after retries:', profileError);
        // Don't throw here, let the sign-up complete and handle profile creation in AuthCallback
      }

      console.log('[AuthService] User needs to confirm email to complete setup');
      return signUpData;
    } catch (error) {
      console.error('[AuthService] Sign up error:', error);
      throw error;
    }
  }

  async signIn({ email, password }: SignInData): Promise<{ user: User; session: Session }> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Load profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();

      if (profileError) throw profileError;

      // Combine auth user with profile data
      const user: User = {
        ...data.user,
        role: profile.role,
        balance: profile.balance,
        username: profile.username,
        display_name: profile.display_name,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
        email_notifications: profile.email_notifications,
        email_verified: profile.email_verified,
        updated_at: profile.updated_at,
      };

      this.cachedUser = user;
      return { user, session: data.session };
    } catch (error) {
      console.error('[AuthService] Sign in error:', error);
      throw error;
    }
  }

  async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      this.cachedUser = null;
      console.log('[AuthService] Sign out successful');
    } catch (error) {
      console.error('[AuthService] Sign out error:', error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      if (this.cachedUser) {
        return this.cachedUser;
      }

      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error || !user) {
        console.log('[AuthService] No session, clearing cached user');
        this.cachedUser = null;
        return null;
      }

      // Load profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('[AuthService] Error loading profile:', profileError);
        return null;
      }

      // Combine auth user with profile data
      const fullUser: User = {
        ...user,
        role: profile.role,
        balance: profile.balance,
        username: profile.username,
        display_name: profile.display_name,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
        email_notifications: profile.email_notifications,
        email_verified: profile.email_verified,
        updated_at: profile.updated_at,
      };

      this.cachedUser = fullUser;
      return fullUser;
    } catch (error) {
      console.error('[AuthService] Get current user error:', error);
      return null;
    }
  }

  async setAdminRole(userId: string) {
    try {
      const { data, error } = await supabase
        .rpc('set_admin_role', {
          target_user_id: userId
        });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('[AuthService] Set admin role error:', error);
      return { data: null, error };
    }
  }

  async uploadAvatar(file: File) {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      return { data: { url: publicUrl }, error: null };
    } catch (error) {
      console.error('[AuthService] Upload avatar error:', error);
      return { data: null, error };
    }
  }

  async updateProfile(userId: string, updates: Partial<User>) {
    try {
      // First update the profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .update({
          username: updates.username,
          display_name: updates.display_name,
          bio: updates.bio,
          avatar_url: updates.avatar_url,
          email_notifications: updates.email_notifications,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)
        .select()
        .single();

      if (profileError) throw profileError;

      // Get the current auth user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('No user found');

      // Combine auth user with updated profile data
      const updatedUser: User = {
        ...user,
        role: profile.role,
        balance: profile.balance,
        username: profile.username,
        display_name: profile.display_name,
        bio: profile.bio,
        avatar_url: profile.avatar_url,
        email_notifications: profile.email_notifications,
        email_verified: profile.email_verified,
        updated_at: profile.updated_at,
      };

      // Update the cached user
      this.cachedUser = updatedUser;

      return { data: updatedUser, error: null };
    } catch (error) {
      console.error('[AuthService] Update profile error:', error);
      return { data: null, error };
    }
  }

  async signInWithPassword(email: string, password: string) {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      console.error('[AuthService] Sign in with password error:', error);
      return { error };
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
      console.error('[AuthService] Sign in with email error:', error);
      return { error };
    }
  }
} 