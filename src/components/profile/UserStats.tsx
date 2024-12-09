import { Box, SimpleGrid, Stat, StatLabel, StatNumber, StatHelpText } from '@chakra-ui/react';
import { useTokens } from '../../hooks/token/useTokens';
import type { VotePack } from '../../types/database.types';

export function UserStats() {
  const { balance, votePacks } = useTokens();

  const totalVotes = votePacks?.reduce((sum: number, pack: VotePack) => 
    sum + (pack.votes || 0), 0) || 0;

  return (
    <Box p={4}>
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        <Stat>
          <StatLabel>Token Balance</StatLabel>
          <StatNumber>{balance || 0}</StatNumber>
          <StatHelpText>Available SLN tokens</StatHelpText>
        </Stat>
        <Stat>
          <StatLabel>Vote Packs</StatLabel>
          <StatNumber>{totalVotes}</StatNumber>
          <StatHelpText>Available votes</StatHelpText>
        </Stat>
      </SimpleGrid>
    </Box>
  );
} 