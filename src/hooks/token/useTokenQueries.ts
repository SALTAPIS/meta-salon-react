import { useQuery } from '@tanstack/react-query';
import { TokenService } from '../../services/token/tokenService';

export function useTokenQueries(userId: string) {
  const tokenService = TokenService.getInstance();

  const balanceQuery = useQuery({
    queryKey: ['userBalance', userId],
    queryFn: () => tokenService.getUserBalance(userId),
    enabled: !!userId,
  });

  const transactionsQuery = useQuery({
    queryKey: ['userTransactions', userId],
    queryFn: () => tokenService.getUserTransactions(userId),
    enabled: !!userId,
  });

  const votePacksQuery = useQuery({
    queryKey: ['userVotePacks', userId],
    queryFn: () => tokenService.getUserVotePacks(userId),
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