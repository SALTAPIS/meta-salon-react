import { User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabaseClient';
import { User } from '../../types/user';

// Define event map type for type safety
interface EventMap extends Record<string, unknown> {
  profileUpdate: User;
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
  private cachedProfile: User | null = null;

  private constructor() {
    super();
    console.log('[AuthService] Initializing with environment:', {
      url: import.meta.env.VITE_SUPABASE_URL ? '✓ Set' : '✗ Missing',
      anon_key: import.meta.env.VITE_SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing',
      service_key: import.meta.env.VITE_SUPABASE_SERVICE_KEY ? '✓ Set' : '✗ Missing',
      site_url: import.meta.env.VITE_SITE_URL || window.location.origin,
      timestamp: new Date().toISOString()
    });

    // Try to load cached user on initialization
    const cachedUser = localStorage.getItem('cached_user');
    if (cachedUser) {
      try {
        this.cachedProfile = JSON.parse(cachedUser);
        console.log('[AuthService] Loaded cached user:', {
          id: this.cachedProfile?.id,
          email: this.cachedProfile?.email,
          role: this.cachedProfile?.role
        });
      } catch (error) {
        console.error('[AuthService] Error parsing cached user:', error);
        localStorage.removeItem('cached_user');
      }
    }
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
      console.log('[AuthService] Loading profile for user:', {
        id: user.id,
        email: user.email,
        timestamp: new Date().toISOString()
      });

      // First check if we have a cached profile that matches
      if (this.cachedProfile && this.cachedProfile.id === user.id) {
        console.log('[AuthService] Using cached profile');
        return this.cachedProfile;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('[AuthService] Error loading profile from database:', error);
        
        // If profile not found, create one
        if (error.code === 'PGRST116') {
          console.log('[AuthService] Profile not found, creating new profile');
          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              email: user.email,
              role: 'user',
              balance: 500,
              email_verified: user.email_confirmed_at ? true : false,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .select()
            .single();

          if (createError) {
            console.error('[AuthService] Error creating profile:', createError);
            throw createError;
          }

          console.log('[AuthService] New profile created:', {
            id: newProfile.id,
            role: newProfile.role,
            timestamp: new Date().toISOString()
          });

          const extendedUser: User = {
            ...user,
            email: user.email || '',
            role: newProfile.role,
            balance: newProfile.balance,
            username: newProfile.username,
            display_name: newProfile.display_name,
            bio: newProfile.bio,
            avatar_url: newProfile.avatar_url,
            email_verified: newProfile.email_verified,
            email_notifications: newProfile.email_notifications ?? true,
            updated_at: newProfile.updated_at || new Date().toISOString(),
          };

          // Cache the profile
          this.cachedProfile = extendedUser;
          localStorage.setItem('cached_user', JSON.stringify(extendedUser));

          return extendedUser;
        }
        throw error;
      }

      console.log('[AuthService] Profile loaded from database:', {
        id: profile.id,
        role: profile.role,
        timestamp: new Date().toISOString()
      });

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
        updated_at: profile?.updated_at || new Date().toISOString(),
      };

      // Cache the profile
      this.cachedProfile = extendedUser;
      localStorage.setItem('cached_user', JSON.stringify(extendedUser));

      return extendedUser;
    } catch (error) {
      console.error('[AuthService] Error in loadUserProfile:', error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      console.log('[AuthService] Getting current user session');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('[AuthService] Session error:', sessionError);
        throw sessionError;
      }

      if (!session?.user) {
        console.log('[AuthService] No active session found');
        return null;
      }

      console.log('[AuthService] Session found, loading profile');
      return await this.loadUserProfile(session.user);
    } catch (error) {
      console.error('[AuthService] Error getting current user:', error);
      return null;
    }
  }

  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    console.log('[AuthService] Setting up auth state change listener');
    return supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AuthService] Auth state changed:', { 
        event, 
        hasSession: !!session,
        userId: session?.user?.id,
        timestamp: new Date().toISOString()
      });

      try {
        if (session?.user) {
          const user = await this.loadUserProfile(session.user);
          callback(event, {
            ...session,
            user: {
              ...session.user,
              role: user.role || undefined,
              user_metadata: {
                ...session.user.user_metadata,
                role: user.role, // Ensure role is in user_metadata
                balance: user.balance,
                username: user.username,
                display_name: user.display_name,
                bio: user.bio,
                avatar_url: user.avatar_url,
                email_verified: user.email_verified,
                email_notifications: user.email_notifications,
              }
            }
          });
        } else {
          console.log('[AuthService] No session, clearing cached user');
          this.cachedProfile = null;
          localStorage.removeItem('cached_user');
          callback(event, null);
        }
      } catch (error) {
        console.error('[AuthService] Error in auth state change handler:', error);
        callback(event, session);
      }
    });
  }

  async signInWithPassword(email: string, password: string) {
    try {
      console.log('[AuthService] Attempting sign in for email:', email);

      // Clear any existing session first
      await supabase.auth.signOut();

      const { data, error } = await supabase.auth.signInWithPassword({ 
        email, 
        password
      });
      
      if (error) {
        console.error('[AuthService] Sign in error:', error.message);
        if (error.message.includes('Invalid login credentials')) {
          throw new Error('Invalid email or password. Please try again.');
        } else if (error.message.includes('Email not confirmed')) {
          throw new Error('Please confirm your email before signing in. Check your inbox for the confirmation link.');
        }
        throw error;
      }

      if (!data.user) {
        console.error('[AuthService] Sign in successful but no user data returned');
        throw new Error('Unable to retrieve user data. Please try again.');
      }

      // Load profile and update user metadata
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        if (profileError) {
          console.error('[AuthService] Error loading profile:', profileError);
        } else if (profile) {
          // Update user metadata with role from profile
          const { error: updateError } = await supabase.auth.updateUser({
            data: { 
              role: profile.role,
              balance: profile.balance,
              email_verified: profile.email_verified
            }
          });

          if (updateError) {
            console.error('[AuthService] Error updating user metadata:', updateError);
          } else {
            console.log('[AuthService] User metadata updated successfully:', {
              role: profile.role,
              userId: data.user.id
            });
          }
        }
      } catch (profileError) {
        console.error('[AuthService] Error handling profile:', profileError);
      }

      console.log('[AuthService] Sign in successful:', {
        userId: data.user.id,
        email: data.user.email,
        timestamp: new Date().toISOString()
      });

      return { data, error: null };
    } catch (error) {
      console.error('[AuthService] Sign in error:', error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('An unknown error occurred')
      };
    }
  }

  async signInWithEmail(email: string) {
    try {
      console.log('[AuthService] Sending magic link to:', email);

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        console.error('[AuthService] Magic link error:', error.message);
        throw error;
      }

      console.log('[AuthService] Magic link sent successfully');
      return { data: null, error: null };
    } catch (error) {
      console.error('[AuthService] Magic link error:', error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('An unknown error occurred')
      };
    }
  }

  async signUpWithPassword(email: string, password: string) {
    try {
      console.log('[AuthService] Attempting sign up for email:', email);

      // Clear any existing session first
      await supabase.auth.signOut();

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            role: email === 'admin@meta.salon' ? 'admin' : 'user'
          }
        }
      });

      if (error) {
        console.error('[AuthService] Sign up error:', error.message);
        throw error;
      }

      if (!data.user) {
        console.error('[AuthService] Sign up successful but no user data returned');
        throw new Error('Unable to create user. Please try again.');
      }

      console.log('[AuthService] Sign up successful:', {
        userId: data.user.id,
        email: data.user.email,
        timestamp: new Date().toISOString()
      });

      // Create initial profile using service role client
      try {
        const role = email === 'admin@meta.salon' ? 'admin' : 'user';
        const { error: profileError } = await supabase.rpc('create_initial_profile', {
          user_id: data.user.id,
          user_email: data.user.email,
          user_role: role,
          initial_balance: 500
        });

        if (profileError) {
          console.error('[AuthService] Error creating profile:', profileError);
        } else {
          console.log('[AuthService] Profile created successfully');
        }

        // Update user metadata with role
        const { error: updateError } = await supabase.auth.updateUser({
          data: { role: role }
        });

        if (updateError) {
          console.error('[AuthService] Error updating user metadata:', updateError);
        } else {
          console.log('[AuthService] User metadata updated successfully');
        }
      } catch (profileError) {
        console.error('[AuthService] Error creating profile:', profileError);
      }

      return { data: { user: data.user }, error: null };
    } catch (error) {
      console.error('[AuthService] Sign up error:', error);
      return {
        data: null,
        error: error instanceof Error ? error : new Error('An unknown error occurred')
      };
    }
  }

  async signOut() {
    try {
      console.log('[AuthService] Signing out');
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      // Clear cached user
      this.cachedProfile = null;
      localStorage.removeItem('cached_user');

      console.log('[AuthService] Sign out successful');
      return { error: null };
    } catch (error) {
      console.error('[AuthService] Sign out error:', error);
      return { error };
    }
  }

  async resendConfirmationEmail(email: string) {
    try {
      console.log('[AuthService] Resending confirmation email to:', email);
      return await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
    } catch (error) {
      console.error('[AuthService] Error resending confirmation email:', error);
      return { error };
    }
  }

  async updateProfile(userId: string, updates: Partial<User>) {
    try {
      console.log('[AuthService] Updating profile for user:', userId);
      const { error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) throw error;

      // Get the updated profile
      const { data: profile, error: refreshError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (refreshError) throw refreshError;

      // Update local storage with the new profile data
      if (this.cachedProfile && this.cachedProfile.id === userId) {
        this.cachedProfile = {
          ...this.cachedProfile,
          ...profile,
        };
        localStorage.setItem('cached_user', JSON.stringify(this.cachedProfile));
      }

      // Update user metadata with role if it changed
      if (updates.role) {
        const { error: updateError } = await supabase.auth.updateUser({
          data: { role: updates.role }
        });

        if (updateError) {
          console.error('[AuthService] Error updating user metadata:', updateError);
        } else {
          console.log('[AuthService] User metadata updated successfully');
        }
      }

      // Emit profile update event
      this.emit('profileUpdate', profile as User);

      return { error: null };
    } catch (error) {
      console.error('[AuthService] Error updating profile:', error);
      return { error: error instanceof Error ? error : new Error('An unknown error occurred') };
    }
  }

  async uploadAvatar(file: File): Promise<{ data?: { url: string }, error: Error | null }> {
    try {
      const user = await this.getCurrentUser();
      if (!user) {
        throw new Error('Not authenticated');
      }

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update profile with new avatar URL
      await this.updateProfile(user.id, {
        avatar_url: publicUrl
      });

      // Force refresh the cached profile
      if (this.cachedProfile) {
        this.cachedProfile = {
          ...this.cachedProfile,
          avatar_url: publicUrl
        };
        localStorage.setItem('cached_user', JSON.stringify(this.cachedProfile));
      }

      // Emit profile update event
      this.emit('profileUpdate', {
        ...user,
        avatar_url: publicUrl
      });

      return { data: { url: publicUrl }, error: null };
    } catch (error) {
      console.error('[AuthService] Error uploading avatar:', error);
      return { error: error instanceof Error ? error : new Error('An unknown error occurred') };
    }
  }

  async setAdminRole(userId: string): Promise<{ error: Error | null }> {
    try {
      console.log('[AuthService] Setting admin role for user:', userId);

      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          role: 'admin',
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { 
          role: 'admin',
          updated_at: new Date().toISOString()
        }
      });

      if (updateError) throw updateError;

      // Force refresh session to get new role
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.warn('[AuthService] Error refreshing session:', refreshError);
      }

      // Get updated session
      const { data: { session: newSession }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.warn('[AuthService] Error getting updated session:', sessionError);
      } else {
        console.log('[AuthService] Updated session:', {
          role: newSession?.user?.role,
          metadata: {
            user_metadata: newSession?.user?.user_metadata,
            app_metadata: newSession?.user?.app_metadata
          }
        });
      }

      // Verify role was set
      if (!newSession?.user?.user_metadata?.role) {
        console.warn('[AuthService] Role not set in user metadata, retrying...');
        
        // Try one more time
        const { error: retryError } = await supabase.auth.updateUser({
          data: { 
            role: 'admin',
            updated_at: new Date().toISOString()
          }
        });

        if (retryError) {
          console.error('[AuthService] Failed to set role on retry:', retryError);
        }
      }

      console.log('[AuthService] Admin role set successfully');
      return { error: null };
    } catch (error) {
      console.error('[AuthService] Error setting admin role:', error);
      return { error: error instanceof Error ? error : new Error('An unknown error occurred') };
    }
  }
} 