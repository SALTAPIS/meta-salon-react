import { useEffect, useState, useRef, useCallback } from 'react';
import { TokenService } from '../../services/token/tokenService';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';

const CHANNEL_NAME = 'token-updates';

export function useTokens() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const channelRef = useRef<any>(null);

  const fetchBalance = useCallback(async () => {
    if (!user?.id) return;
    try {
      const tokenService = TokenService.getInstance();
      const balance = await tokenService.getBalance(user.id);
      setBalance(balance);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch balance'));
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchBalance();

    // Subscribe to token updates
    if (user?.id) {
      channelRef.current = supabase
        .channel(CHANNEL_NAME)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'tokens',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchBalance();
          }
        )
        .subscribe();

      return () => {
        if (channelRef.current) {
          supabase.removeChannel(channelRef.current);
        }
      };
    }
  }, [user?.id, fetchBalance]);

  return { balance, isLoading, error, refreshBalance: fetchBalance };
}
