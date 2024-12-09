import { useQuery } from '@tanstack/react-query';
import { TokenService } from '../../services/token/tokenService';

export function useTokenQueries(userId: string) {
  const balanceQuery = useQuery({
    queryKey: ['userBalance', userId],
    queryFn: () => TokenService.getBalance(userId),
    enabled: !!userId,
  });

  const transactionsQuery = useQuery({
    queryKey: ['userTransactions', userId],
    queryFn: () => TokenService.getUserTransactions(userId),
    enabled: !!userId,
  });

  const votePacksQuery = useQuery({
    queryKey: ['userVotePacks', userId],
    queryFn: () => TokenService.getVotePacks(userId),
    enabled: !!userId,
  });

  return {
    balance: balanceQuery.data,
    transactions: transactionsQuery.data,
    votePacks: votePacksQuery.data,
    isLoading: balanceQuery.isLoading || transactionsQuery.isLoading || votePacksQuery.isLoading,
    error: balanceQuery.error || transactionsQuery.error || votePacksQuery.error,
  };
} 