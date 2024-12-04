import {
  SimpleGrid,
  Box,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useColorModeValue,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { TokenService } from '../../services/token/tokenService';
import type { Database } from '../../types/supabase';

interface UserStatsProps {
  userId: string;
}

type VotePack = Database['public']['Tables']['vote_packs']['Row'];

export function UserStats({ userId }: UserStatsProps) {
  const bgColor = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const { data: balance } = useQuery({
    queryKey: ['userBalance', userId],
    queryFn: () => TokenService.getInstance().getUserBalance(userId),
  });

  const { data: transactions } = useQuery({
    queryKey: ['userTransactions', userId],
    queryFn: () => TokenService.getInstance().getUserTransactions(userId),
  });

  const { data: votePacks } = useQuery({
    queryKey: ['userVotePacks', userId],
    queryFn: () => TokenService.getInstance().getUserVotePacks(userId),
  });

  const totalVotes = votePacks?.reduce((sum: number, pack: VotePack) => sum + pack.votes_remaining, 0) || 0;
  const totalTransactions = transactions?.length || 0;

  return (
    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} w="full">
      <Box p={4} bg={bgColor} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
        <Stat>
          <StatLabel>Balance</StatLabel>
          <StatNumber>{balance || 0}</StatNumber>
          <StatHelpText>Available tokens</StatHelpText>
        </Stat>
      </Box>

      <Box p={4} bg={bgColor} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
        <Stat>
          <StatLabel>Votes</StatLabel>
          <StatNumber>{totalVotes}</StatNumber>
          <StatHelpText>Available votes</StatHelpText>
        </Stat>
      </Box>

      <Box p={4} bg={bgColor} borderRadius="lg" borderWidth="1px" borderColor={borderColor}>
        <Stat>
          <StatLabel>Transactions</StatLabel>
          <StatNumber>{totalTransactions}</StatNumber>
          <StatHelpText>Total transactions</StatHelpText>
        </Stat>
      </Box>
    </SimpleGrid>
  );
} 