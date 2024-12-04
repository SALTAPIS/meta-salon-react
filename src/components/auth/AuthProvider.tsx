import React, { createContext, useContext, useEffect, useState } from 'react';
import type { User, AuthResponse } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';

interface ExtendedUser extends User {
  balance?: number;
  wallet?: string | null;
  role?: string;
  premiumUntil?: Date | null;
}

interface AuthState {
  user: ExtendedUser | null;
  isLoading: boolean;
  signInWithPassword: (email: string, password: string) => Promise<AuthResponse>;
  signUpWithPassword: (email: string, password: string) => Promise<AuthResponse>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState>({
  user: null,
  isLoading: false,
  signInWithPassword: async () => ({ data: { user: null, session: null }, error: null }),
  signUpWithPassword: async () => ({ data: { user: null, session: null }, error: null }),
  signOut: async () => {}
});

async function createInitialProfile(user: User): Promise<void> {
  console.log('Creating initial profile for user:', user.id);
  
  try {
    // First check if profile already exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (checkError) {
      console.error('Error checking existing profile:', checkError);
      if (checkError.code === 'PGRST301') {
        throw new Error('Database permission denied. Please check RLS policies.');
      }
    }

    if (existingProfile) {
      console.log('Profile already exists for user:', user.id);
      return;
    }

    console.log('Attempting to insert new profile for user:', user.id);
    const { error: insertError } = await supabase
      .from('profiles')
      .upsert([
        {
          id: user.id,
          email: user.email,
          role: 'user',
          balance: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ], { onConflict: 'id' });

    if (insertError) {
      console.error('Error creating profile:', insertError);
      if (insertError.code === 'PGRST301') {
        throw new Error('Database permission denied. Please check RLS policies.');
      }
      throw insertError;
    }

    // Verify profile was created
    const { data: verifyProfile, error: verifyError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    if (verifyError) {
      console.error('Error verifying profile creation:', verifyError);
      throw verifyError;
    }

    if (!verifyProfile) {
      throw new Error('Profile creation failed - verification returned no data');
    }

    console.log('Profile verified after creation:', verifyProfile);
  } catch (error) {
    console.error('Profile creation process failed:', error);
    throw error;
  }
}

async function loadUserProfile(user: User, retryCount = 0): Promise<ExtendedUser> {
  console.log('Loading profile for user:', user.id, 'attempt:', retryCount + 1);
  
  try {
    // Add timeout to the profile loading request
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Profile load timeout')), 5000);
    });

    const loadPromise = supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    // Race between the load and timeout
    const { data: profile, error: loadError } = await Promise.race([
      loadPromise,
      timeoutPromise
    ]) as { data: any, error: any };

    if (loadError) {
      console.error('Profile load error:', {
        code: loadError.code,
        message: loadError.message,
        details: loadError.details,
        hint: loadError.hint
      });
      
      if (loadError.code === 'PGRST301') {
        console.error('Database permission denied - check RLS policies');
        throw loadError;
      }
      
      if (retryCount < 2) {
        console.log(`Will retry profile load in 2s (attempt ${retryCount + 1}/3)`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return loadUserProfile(user, retryCount + 1);
      }
      
      throw loadError;
    }

    if (!profile) {
      console.error('No profile found for user:', user.id);
      
      // Try to create profile as fallback
      try {
        console.log('Attempting to create profile as fallback...');
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .upsert([
            {
              id: user.id,
              email: user.email,
              role: 'user',
              balance: 0,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            }
          ], { 
            onConflict: 'id',
            ignoreDuplicates: false 
          });

        if (createError) {
          console.error('Fallback profile creation failed:', createError);
          throw createError;
        }

        if (newProfile) {
          console.log('Fallback profile created successfully');
          return {
            ...user,
            balance: 0,
            wallet: null,
            role: 'user',
            premiumUntil: null
          };
        }
      } catch (createError) {
        console.error('Error in fallback profile creation:', createError);
      }

      if (retryCount < 2) {
        console.log(`Will retry profile load in 2s (attempt ${retryCount + 1}/3)`);
        await new Promise(resolve => setTimeout(resolve, 2000));
        return loadUserProfile(user, retryCount + 1);
      }
      throw new Error('Profile not found after multiple attempts');
    }

    const extendedUser = {
      ...user,
      balance: profile.balance ?? 0,
      wallet: profile.wallet ?? null,
      role: profile.role ?? 'user',
      premiumUntil: profile.premium_until ? new Date(profile.premium_until) : null
    };
    
    console.log('Profile loaded successfully:', {
      userId: extendedUser.id,
      email: extendedUser.email,
      role: extendedUser.role,
      balance: extendedUser.balance
    });
    
    return extendedUser;
  } catch (error) {
    console.error('Profile loading process failed:', error);
    
    // Return fallback user data after all retries failed
    const fallbackUser = {
      ...user,
      balance: 0,
      wallet: null,
      role: 'user',
      premiumUntil: null
    };
    console.log('Returning fallback user:', {
      userId: fallbackUser.id,
      email: fallbackUser.email,
      role: fallbackUser.role
    });
    return fallbackUser;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<Omit<AuthState, 'signInWithPassword' | 'signUpWithPassword' | 'signOut'>>({
    user: null,
    isLoading: true
  });

  useEffect(() => {
    let mounted = true;
    let retryTimeout: NodeJS.Timeout;

    async function initAuth() {
      try {
        console.log('Initializing auth state...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Session retrieval error:', error);
          if (mounted) {
            setState({ user: null, isLoading: false });
          }
          return;
        }

        if (!mounted) return;

        if (session?.user) {
          console.log('Session found, loading user data...');
          try {
            const extendedUser = await loadUserProfile(session.user);
            if (mounted) {
              setState({
                user: extendedUser,
                isLoading: false
              });
            }
          } catch (profileError) {
            console.error('Profile loading error:', profileError);
            if (mounted) {
              setState({
                user: session.user as ExtendedUser,
                isLoading: false
              });
            }
          }
        } else {
          console.log('No session found');
          if (mounted) {
            setState({
              user: null,
              isLoading: false
            });
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
        if (mounted) {
          setState({
            user: null,
            isLoading: false
          });
        }
      }
    }

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', { 
        event, 
        userId: session?.user?.id,
        email: session?.user?.email,
        isLoading: state.isLoading,
        hasUser: !!state.user
      });
      
      if (!mounted) {
        console.log('Component unmounted, skipping auth state update');
        return;
      }

      setState(prev => {
        console.log('Setting loading state, previous state:', {
          isLoading: prev.isLoading,
          hasUser: !!prev.user
        });
        return { ...prev, isLoading: true };
      });

      if (event === 'SIGNED_OUT') {
        console.log('User signed out, clearing state');
        setState({
          user: null,
          isLoading: false
        });
        return;
      }

      if (session?.user) {
        console.log('Session user found, starting profile load process');
        const retryProfileLoad = async (retryCount = 0) => {
          try {
            console.log(`Attempting to load profile (attempt ${retryCount + 1}/3) for user:`, {
              userId: session.user?.id,
              email: session.user?.email
            });
            
            const extendedUser = await loadUserProfile(session.user!);
            
            if (!mounted) {
              console.log('Component unmounted during profile load, skipping state update');
              return;
            }

            console.log('Profile loaded successfully, updating state:', {
              userId: extendedUser.id,
              email: extendedUser.email,
              role: extendedUser.role
            });

            setState({
              user: extendedUser,
              isLoading: false
            });
          } catch (error) {
            console.error(`Profile load attempt ${retryCount + 1} failed:`, error);
            
            if (!mounted) {
              console.log('Component unmounted during error handling, skipping retry');
              return;
            }

            if (retryCount < 3) {
              console.log(`Scheduling retry in 1s (attempt ${retryCount + 1}/3)`);
              retryTimeout = setTimeout(() => retryProfileLoad(retryCount + 1), 1000);
            } else {
              console.log('All retries failed, falling back to basic user data');
              if (mounted) {
                const fallbackUser = {
                  ...session.user,
                  balance: 0,
                  wallet: null,
                  role: 'user',
                  premiumUntil: null
                } as ExtendedUser;
                
                console.log('Setting fallback user state:', {
                  userId: fallbackUser.id,
                  email: fallbackUser.email,
                  role: fallbackUser.role
                });

                setState({
                  user: fallbackUser,
                  isLoading: false
                });
              }
            }
          }
        };

        await retryProfileLoad();
      } else {
        console.log('No session user found, clearing state');
        if (mounted) {
          setState({
            user: null,
            isLoading: false
          });
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, []);

  const signInWithPassword = async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const response = await supabase.auth.signInWithPassword({ email, password });
      if (response.error) throw response.error;
      return response;
    } catch (error) {
      console.error('Sign in error:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const signUpWithPassword = async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      console.log('Starting signup for:', email);
      const response = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: {
            role: 'user'
          }
        }
      });

      if (response.error) {
        console.error('Signup error:', response.error);
        setState(prev => ({ ...prev, isLoading: false }));
        throw response.error;
      }

      // If we have a user, create their profile immediately
      if (response.data?.user) {
        try {
          console.log('Creating initial profile during signup:', response.data.user.id);
          await createInitialProfile(response.data.user);
        } catch (profileError) {
          console.error('Profile creation error during signup:', profileError);
        }
      }

      // Don't set state here - let the auth state change handler handle it
      return response;
    } catch (error) {
      console.error('Signup process error:', error);
      setState(prev => ({ ...prev, isLoading: false }));
      throw error;
    }
  };

  const signOut = async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      setState({
        user: null,
        isLoading: false
      });
    } catch (error) {
      console.error('Sign out error:', error);
      setState({
        user: null,
        isLoading: false
      });
    }
  };

  const value = {
    ...state,
    signInWithPassword,
    signUpWithPassword,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const useAuthContext = useAuth; 