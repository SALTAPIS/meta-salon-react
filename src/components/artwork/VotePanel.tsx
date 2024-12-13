import {
  Box,
  VStack,
  HStack,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Divider,
} from '@chakra-ui/react';
import { useVoting } from '../../hooks/useVoting';
import type { Vote } from '../../types/database.types';

interface VotePanelProps {
  artworkId: string;
  artwork: {
    vault_value: number;
    vote_count: number;
  };
}

export function VotePanel({ artworkId, artwork }: VotePanelProps) {
  const {
    votes,
    userVotes,
  } = useVoting(artworkId);

  // Calculate actual vote count from raw votes
  const actualVoteCount = votes.reduce((total, vote) => total + (vote.value || 0), 0);

  return (
    <Box p={4} borderWidth={1} borderRadius="lg" bg="white">
      <VStack spacing={4} align="stretch">
        {/* Key Stats */}
        <HStack justify="space-between">
          <Stat>
            <StatLabel>Vault Value</StatLabel>
            <StatNumber color="green.500">{artwork.vault_value || 0} SLN</StatNumber>
            <StatHelpText>Total earned value</StatHelpText>
          </Stat>
          <Stat>
            <StatLabel>Total Votes</StatLabel>
            <StatNumber>{actualVoteCount}</StatNumber>
            <StatHelpText>From all voters</StatHelpText>
          </Stat>
        </HStack>

        <Divider />

        {/* Vote History */}
        {votes.length > 0 && (
          <Box>
            <Text fontWeight="bold" mb={2}>Recent Votes</Text>
            <VStack spacing={2} align="stretch">
              {votes.slice(0, 5).map((vote: Vote) => (
                <HStack key={vote.id} justify="space-between" p={2} bg="gray.50" borderRadius="md">
                  <Text fontSize="sm">
                    {vote.user_id === userVotes[0]?.user_id ? 'You' : 'Someone'} voted
                  </Text>
                  <Text fontWeight="bold">{vote.value} votes</Text>
                </HStack>
              ))}
            </VStack>
          </Box>
        )}
      </VStack>
    </Box>
  );
} 