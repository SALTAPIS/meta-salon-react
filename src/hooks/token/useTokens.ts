import { useState, useEffect } from 'react';
import { useAuth } from '../useAuth';
import { TokenService } from '../../services/token/tokenService';
import type { VotePack } from '../../types/database.types';

export function useTokens() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [votePacks, setVotePacks] = useState<VotePack[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const refreshBalance = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);
      const [newBalance, packs] = await Promise.all([
        TokenService.getBalance(user.id),
        TokenService.getVotePacks(user.id)
      ]);
      setBalance(newBalance);
      setVotePacks(packs);
    } catch (err) {
      console.error('Failed to refresh token data:', err);
      setError(err instanceof Error ? err : new Error('Failed to refresh token data'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshBalance();
  }, [user]);

  return {
    balance,
    votePacks,
    isLoading,
    error,
    refreshBalance
  };
}
