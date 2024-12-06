import {
  SimpleGrid,
  Box,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useColorModeValue,
  Skeleton,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { TokenService } from '../../services/token/tokenService';
import type { Database } from '../../types/supabase';
import { Suspense } from 'react';

interface UserStatsProps {
  userId: string;
}

type VotePack = Database['public']['Tables']['vote_packs']['Row'];

function UserStatsContent({ userId }: UserStatsProps) {
  const bgColor = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const { data: balance, isLoading: balanceLoading, error: balanceError } = useQuery({
    queryKey: ['userBalance', userId],
    queryFn: () => TokenService.getInstance().getUserBalance(userId),
  });

  const { data: transactions, isLoading: transactionsLoading, error: transactionsError } = useQuery({
    queryKey: ['userTransactions', userId],
    queryFn: () => TokenService.getInstance().getUserTransactions(userId),
  });

  const { data: votePacks, isLoading: votePacksLoading, error: votePacksError } = useQuery({
    queryKey: ['userVotePacks', userId],
    queryFn: () => TokenService.getInstance().getUserVotePacks(userId),
  });

  const totalVotes = votePacks?.reduce((sum: number, pack: VotePack) => sum + pack.votes_remaining, 0) || 0;
  const totalTransactions = transactions?.length || 0;

  const isLoading = balanceLoading || transactionsLoading || votePacksLoading;
  const error = balanceError || transactionsError || votePacksError;

  if (error) {
    return (
      <Alert status="error" borderRadius="lg">
        <AlertIcon />
        <Box>
          <AlertTitle>Error loading stats</AlertTitle>
          <AlertDescription>
            {error instanceof Error ? error.message : 'An error occurred while loading your stats.'}
          </AlertDescription>
        </Box>
      </Alert>
    );
  }

  return (
    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} w="full">
      <Box p={4} bg={bgColor} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
        <Stat>
          <StatLabel>Balance</StatLabel>
          <Skeleton isLoaded={!balanceLoading}>
            <StatNumber>{balance || 0}</StatNumber>
          </Skeleton>
          <StatHelpText>Available tokens</StatHelpText>
        </Stat>
      </Box>

      <Box p={4} bg={bgColor} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
        <Stat>
          <StatLabel>Votes</StatLabel>
          <Skeleton isLoaded={!votePacksLoading}>
            <StatNumber>{totalVotes}</StatNumber>
          </Skeleton>
          <StatHelpText>Available votes</StatHelpText>
        </Stat>
      </Box>

      <Box p={4} bg={bgColor} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
        <Stat>
          <StatLabel>Transactions</StatLabel>
          <Skeleton isLoaded={!transactionsLoading}>
            <StatNumber>{totalTransactions}</StatNumber>
          </Skeleton>
          <StatHelpText>Total transactions</StatHelpText>
        </Stat>
      </Box>
    </SimpleGrid>
  );
}

export function UserStats(props: UserStatsProps) {
  return (
    <Suspense fallback={
      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} w="full">
        {[1, 2, 3].map((i) => (
          <Box key={i} p={4} bg="transparent" borderRadius="lg" borderWidth="1px">
            <Stat>
              <StatLabel><Skeleton height="20px" width="100px" /></StatLabel>
              <StatNumber><Skeleton height="24px" width="60px" /></StatNumber>
              <StatHelpText><Skeleton height="16px" width="120px" /></StatHelpText>
            </Stat>
          </Box>
        ))}
      </SimpleGrid>
    }>
      <UserStatsContent {...props} />
    </Suspense>
  );
} 