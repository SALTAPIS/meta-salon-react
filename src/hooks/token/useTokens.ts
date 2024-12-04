import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth/useAuth';
import { TokenService } from '../../services/token/tokenService';
import type { Database } from '../../types/supabase';

type Transaction = Database['public']['Tables']['transactions']['Row'];
type VotePack = Database['public']['Tables']['vote_packs']['Row'];

interface UseTokensReturn {
  balance: number;
  isLoading: boolean;
  error: Error | null;
  transactions: Transaction[];
  votePacks: VotePack[];
  activeVotePack: VotePack | null;
  refreshBalance: () => Promise<void>;
  processTransaction: (
    type: Transaction['type'],
    amount: number,
    description?: string,
    referenceId?: string
  ) => Promise<void>;
  purchaseVotePack: (
    type: VotePack['type'],
    amount: number
  ) => Promise<void>;
}

export function useTokens(): UseTokensReturn {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [votePacks, setVotePacks] = useState<VotePack[]>([]);
  const [activeVotePack, setActiveVotePack] = useState<VotePack | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const tokenService = TokenService.getInstance();

  const refreshBalance = useCallback(async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);

      const [newBalance, newTransactions, newVotePacks, newActiveVotePack] = await Promise.all([
        tokenService.getUserBalance(user.id),
        tokenService.getUserTransactions(user.id),
        tokenService.getUserVotePacks(user.id),
        tokenService.getActiveVotePack(user.id),
      ]);

      setBalance(newBalance);
      setTransactions(newTransactions);
      setVotePacks(newVotePacks);
      setActiveVotePack(newActiveVotePack);
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refreshBalance();
  }, [refreshBalance]);

  const processTransaction = useCallback(async (
    type: Transaction['type'],
    amount: number,
    description?: string,
    referenceId?: string
  ) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setIsLoading(true);
      setError(null);
      await tokenService.processTransaction(
        user.id,
        type,
        amount,
        description,
        referenceId
      );
      await refreshBalance();
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user, refreshBalance]);

  const purchaseVotePack = useCallback(async (
    type: VotePack['type'],
    amount: number
  ) => {
    if (!user) throw new Error('User not authenticated');

    try {
      setIsLoading(true);
      setError(null);
      await tokenService.purchaseVotePack(
        user.id,
        type,
        amount
      );
      await refreshBalance();
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [user, refreshBalance]);

  return {
    balance,
    isLoading,
    error,
    transactions,
    votePacks,
    activeVotePack,
    refreshBalance,
    processTransaction,
    purchaseVotePack,
  };
} 