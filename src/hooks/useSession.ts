import { useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

interface UseSessionReturn {
  session: Session | null;
  loading: boolean;
  error: Error | null;
}

export function useSession(): UseSessionReturn {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadSession() {
      try {
        console.log('[useSession] Loading initial session...');
        const { data: { session: initialSession }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('[useSession] Error getting session:', sessionError);
          if (mounted) {
            setError(sessionError);
            setLoading(false);
          }
          return;
        }

        if (initialSession?.user) {
          console.log('[useSession] Initial session loaded:', {
            userId: initialSession.user.id,
            role: initialSession.user.role,
            metadata: initialSession.user.user_metadata,
          });
        } else {
          console.log('[useSession] No initial session found');
        }

        if (mounted) {
          setSession(initialSession);
          setLoading(false);
        }
      } catch (err) {
        console.error('[useSession] Unexpected error:', err);
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to load session'));
          setLoading(false);
        }
      }
    }

    loadSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      console.log('[useSession] Auth state changed:', {
        event,
        userId: newSession?.user?.id,
        role: newSession?.user?.role,
        metadata: newSession?.user?.user_metadata,
      });

      if (mounted) {
        setSession(newSession);
        setLoading(false);
      }
    });

    // Cleanup
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return { session, loading, error };
} 