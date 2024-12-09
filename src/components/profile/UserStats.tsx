import {
  Box,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Icon,
  Tooltip,
} from '@chakra-ui/react';
import { FaCoins, FaVoteYea, FaHistory } from 'react-icons/fa';
import { useTokens } from '../../hooks/token/useTokens';
import { useTokenQueries } from '../../hooks/token/useTokenQueries';
import type { VotePack } from '../../types/database.types';

interface UserStatsProps {
  userId: string;
}

export function UserStats({ userId }: UserStatsProps) {
  const { balance, votePacks } = useTokens();
  const { transactions } = useTokenQueries(userId);

  const totalVotes = votePacks?.reduce((sum: number, pack: VotePack) => 
    sum + (pack.votes_remaining || 0), 0) || 0;
  const totalTransactions = transactions?.length || 0;

  return (
    <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
      <Box p={4} borderWidth={1} borderRadius="lg" bg="white">
        <Stat>
          <StatLabel>
            <Icon as={FaCoins} mr={2} />
            Balance
          </StatLabel>
          <StatNumber>{balance}</StatNumber>
          <StatHelpText>Available SLN</StatHelpText>
        </Stat>
      </Box>

      <Box p={4} borderWidth={1} borderRadius="lg" bg="white">
        <Stat>
          <StatLabel>
            <Icon as={FaVoteYea} mr={2} />
            Votes
          </StatLabel>
          <StatNumber>{totalVotes}</StatNumber>
          <Tooltip label="Total votes available across all vote packs">
            <StatHelpText>Available votes</StatHelpText>
          </Tooltip>
        </Stat>
      </Box>

      <Box p={4} borderWidth={1} borderRadius="lg" bg="white">
        <Stat>
          <StatLabel>
            <Icon as={FaHistory} mr={2} />
            Transactions
          </StatLabel>
          <StatNumber>{totalTransactions}</StatNumber>
          <StatHelpText>Total transactions</StatHelpText>
        </Stat>
      </Box>
    </SimpleGrid>
  );
} 