import {
  SimpleGrid,
  Box,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useColorModeValue,
  Spinner,
  Center,
  Text,
} from '@chakra-ui/react';
import { useTokenQueries } from '../../hooks/token/useTokenQueries';
import type { Database } from '../../types/database.types';

interface UserStatsProps {
  userId: string;
}

type VotePack = Database['public']['Tables']['vote_packs']['Row'];

export function UserStats({ userId }: UserStatsProps) {
  const bgColor = useColorModeValue('gray.50', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');

  const { balance, votePacks, transactions, isLoading, error } = useTokenQueries(userId);

  if (isLoading) {
    return (
      <Center py={8}>
        <Spinner />
      </Center>
    );
  }

  if (error) {
    return (
      <Center py={8}>
        <Text color="red.500">Error loading stats</Text>
      </Center>
    );
  }

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