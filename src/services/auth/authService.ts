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
    return await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
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
      const response = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            role: 'user',
            balance: 0
          }
        }
      });

      if (response.error) {
        console.error('Signup error:', response.error);
        return response;
      }

      if (response.data.user) {
        console.log('User created successfully:', response.data.user.id);
        
        // Try to create profile with retries
        let profileCreated = false;
        let retryCount = 0;
        
        while (!profileCreated && retryCount < 3) {
          try {
            console.log(`Attempting to create profile (attempt ${retryCount + 1}/3)...`);
            const { error: profileError } = await supabase
              .from('profiles')
              .upsert([
                {
                  id: response.data.user.id,
                  email: response.data.user.email,
                  role: 'user',
                  balance: 0,
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString()
                }
              ], { 
                onConflict: 'id',
                ignoreDuplicates: false 
              });

            if (profileError) {
              console.error('Profile creation error:', {
                code: profileError.code,
                message: profileError.message,
                details: profileError.details,
                hint: profileError.hint
              });
              
              if (profileError.code === 'PGRST301') {
                console.error('Database permission denied - check RLS policies');
                break; // Don't retry on permission errors
              }
              
              throw profileError;
            }

            // Verify profile was created
            const { data: verifyProfile, error: verifyError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', response.data.user.id)
              .single();

            if (verifyError) {
              console.error('Profile verification failed:', verifyError);
              throw verifyError;
            }

            if (verifyProfile) {
              console.log('Profile created and verified:', verifyProfile);
              profileCreated = true;
            } else {
              throw new Error('Profile verification returned no data');
            }
          } catch (error) {
            console.error(`Profile creation attempt ${retryCount + 1} failed:`, error);
            retryCount++;
            if (retryCount < 3) {
              console.log('Waiting 2s before retry...');
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }
        }

        if (!profileCreated) {
          console.warn('Failed to create profile after all retries');
        }
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