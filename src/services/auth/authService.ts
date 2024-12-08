import { AuthError, User as SupabaseUser, Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
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
        updated_at: profile?.updated_at || user.created_at,
      };

      // Cache the profile
      this.cachedProfile = extendedUser;
      localStorage.setItem('cached_user', JSON.stringify(extendedUser));

      return extendedUser;
    } catch (error) {
      console.error('[AuthService] Error loading profile, using defaults:', error);
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

      // Cache the default profile
      this.cachedProfile = defaultUser;
      localStorage.setItem('cached_user', JSON.stringify(defaultUser));

      return defaultUser;
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
        // Still call callback even if there's an error, to prevent UI from getting stuck
        callback(event, session);
      }
    });
  }

  async signInWithPassword(email: string, password: string) {
    try {
      console.log('[AuthService] Attempting sign in for email:', email);

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

      console.log('[AuthService] Sign in successful:', {
        userId: data.user.id,
        email: data.user.email,
        timestamp: new Date().toISOString()
      });

      // Load user profile immediately after sign in
      try {
        const user = await this.loadUserProfile(data.user);
        console.log('[AuthService] User profile loaded after sign in:', {
          id: user.id,
          email: user.email,
          role: user.role
        });
      } catch (profileError) {
        console.error('[AuthService] Error loading profile after sign in:', profileError);
        // Don't throw here, we still want to return success since auth worked
      }

      return { data, error: null };
    } catch (error) {
      console.error('[AuthService] Sign in error:', error);
      return { data: null, error: error as AuthError };
    }
  }

  async signInWithEmail(email: string) {
    try {
      console.log('[AuthService] Sending magic link to:', email);

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${import.meta.env.VITE_SITE_URL || window.location.origin}/auth/callback`
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
      return { data: null, error: error as AuthError };
    }
  }

  async signUpWithPassword(email: string, password: string) {
    try {
      console.log('[AuthService] Attempting sign up for email:', email);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${import.meta.env.VITE_SITE_URL || window.location.origin}/auth/callback`
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

      // Create initial profile
      try {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            email: data.user.email,
            role: 'user',
            balance: 500, // Initial balance
            email_verified: false,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (profileError) {
          console.error('[AuthService] Error creating profile:', profileError);
          // Don't throw here, we still want to return success since auth worked
        } else {
          console.log('[AuthService] Profile created successfully');
          
          // Create initial vote pack
          try {
            const { error: votePackError } = await supabase.rpc('purchase_vote_pack', {
              p_user_id: data.user.id,
              p_type: 'basic',
              p_amount: 10,
            });

            if (votePackError) {
              console.error('[AuthService] Error creating initial vote pack:', votePackError);
            } else {
              console.log('[AuthService] Initial vote pack created successfully');
            }
          } catch (votePackError) {
            console.error('[AuthService] Error creating initial vote pack:', votePackError);
          }
        }
      } catch (profileError) {
        console.error('[AuthService] Error creating profile:', profileError);
        // Don't throw here, we still want to return success since auth worked
      }

      return { data: { user: data.user }, error: null };
    } catch (error) {
      console.error('[AuthService] Sign up error:', error);
      return { data: null, error: error as AuthError };
    }
  }

  async signOut() {
    try {
      console.log('[AuthService] Signing out');
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('[AuthService] Sign out error:', error);
        throw error;
      }

      // Clear cached profile
      this.cachedProfile = null;
      localStorage.removeItem('cached_user');
      
      console.log('[AuthService] Sign out successful');
    } catch (error) {
      console.error('[AuthService] Sign out error:', error);
      throw error;
    }
  }

  async resendConfirmationEmail(email: string) {
    try {
      console.log('[AuthService] Resending confirmation email to:', email);
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${import.meta.env.VITE_SITE_URL || window.location.origin}/auth/callback`,
        },
      });
      
      if (error) throw error;
      
      console.log('[AuthService] Confirmation email resent successfully');
      return { error: null };
    } catch (error) {
      console.error('[AuthService] Error resending confirmation email:', error);
      return { error: error as AuthError };
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

      // Emit profile update event
      this.emit('profileUpdate', profile as User);

      return { error: null };
    } catch (error) {
      console.error('[AuthService] Error updating profile:', error);
      return { error: error as Error };
    }
  }
} 