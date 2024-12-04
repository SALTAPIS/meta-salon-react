import { supabase } from '../../lib/supabase';
import type { User, Session } from '../../types/auth/types';
import type { AuthSession, User as SupabaseUser } from '@supabase/supabase-js';

export class AuthService {
  private refreshTimeout?: NodeJS.Timeout;

  constructor() {
    // Set up auth state change listener
    supabase.auth.onAuthStateChange(this.handleAuthChange);
  }

  async signInWithEmail(email: string) {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) throw error;
    return data;
  }

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    this.clearRefreshTimeout();
  }

  async getSession(): Promise<Session | null> {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    if (!session) return null;

    const transformedSession = this.transformSession(session);
    this.setupSessionRefresh(session);
    return transformedSession;
  }

  async getUser(): Promise<User | null> {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    if (!user) return null;

    return this.transformUser(user);
  }

  async refreshSession(): Promise<Session | null> {
    const { data: { session }, error } = await supabase.auth.refreshSession();
    if (error) throw error;
    if (!session) return null;

    const transformedSession = this.transformSession(session);
    this.setupSessionRefresh(session);
    return transformedSession;
  }

  private handleAuthChange = async (event: string, session: AuthSession | null) => {
    if (event === 'SIGNED_OUT') {
      this.clearRefreshTimeout();
    } else if (session) {
      this.setupSessionRefresh(session);
    }
  };

  private setupSessionRefresh(session: AuthSession) {
    this.clearRefreshTimeout();
    
    // Calculate time until refresh (5 minutes before expiry)
    const expiresAt = session.expires_at || 0;
    const expiresIn = expiresAt * 1000 - Date.now() - 5 * 60 * 1000;
    
    if (expiresIn > 0) {
      this.refreshTimeout = setTimeout(() => {
        this.refreshSession();
      }, expiresIn);
    }
  }

  private clearRefreshTimeout() {
    if (this.refreshTimeout) {
      clearTimeout(this.refreshTimeout);
      this.refreshTimeout = undefined;
    }
  }

  private transformSession(supabaseSession: AuthSession): Session {
    return {
      user: this.transformUser(supabaseSession.user),
      token: supabaseSession.access_token,
      expiresAt: new Date(supabaseSession.expires_at ? supabaseSession.expires_at * 1000 : 0),
    };
  }

  private transformUser(supabaseUser: SupabaseUser): User {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email || '',
      role: supabaseUser.user_metadata.role || 'guest',
      wallet: supabaseUser.user_metadata.wallet,
      balance: supabaseUser.user_metadata.balance || 0,
      premiumUntil: supabaseUser.user_metadata.premiumUntil 
        ? new Date(supabaseUser.user_metadata.premiumUntil)
        : undefined,
      createdAt: new Date(supabaseUser.created_at),
      updatedAt: new Date(supabaseUser.updated_at),
    };
  }
} 