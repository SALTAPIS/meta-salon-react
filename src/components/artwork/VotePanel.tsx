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
  Badge,
} from '@chakra-ui/react';
import { useVoting } from '../../hooks/useVoting';
import { useAuth } from '../../hooks/useAuth';
import type { Vote } from '../../types/database.types';

interface VotePanelProps {
  artworkId: string;
  artwork: {
    vault_value: number;
    vote_count: number;
  };
}

export function VotePanel({ artworkId, artwork }: VotePanelProps) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin' || user?.user_metadata?.role === 'admin';
  
  // Only fetch votes data if user is admin
  const {
    votes,
    userVotes,
  } = isAdmin ? useVoting(artworkId) : { votes: [], userVotes: [] };

  return (
    <Box p={4} borderWidth={1} borderRadius="lg" bg="white">
      <VStack spacing={4} align="stretch">
        {/* Key Stats - Visible to everyone */}
        <HStack justify="space-between">
          <Stat>
            <StatLabel>Vault Value</StatLabel>
            <StatNumber color="green.500">{artwork.vault_value || 0} SLN</StatNumber>
            <StatHelpText>Total earned value</StatHelpText>
          </Stat>
          <Stat>
            <StatLabel>Total Votes</StatLabel>
            <StatNumber>{artwork.vote_count || 0}</StatNumber>
            <StatHelpText>From all voters</StatHelpText>
          </Stat>
        </HStack>

        {/* Vote History - Only visible to admins */}
        {isAdmin && user && votes.length > 0 && (
          <>
            <Divider />
            <Box>
              <Text fontWeight="bold" mb={2}>Recent Votes</Text>
              <VStack spacing={2} align="stretch">
                {votes.slice(0, 10).map((vote: Vote) => (
                  <HStack key={vote.id} justify="space-between" p={2} bg="gray.50" borderRadius="md">
                    <VStack align="start" spacing={0}>
                      <Text fontSize="sm">
                        {vote.user_id === userVotes[0]?.user_id ? 'You' : 'Someone'} voted
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {new Date(vote.created_at).toLocaleString()}
                      </Text>
                    </VStack>
                    <Badge colorScheme="purple">{vote.vote_power}x</Badge>
                  </HStack>
                ))}
              </VStack>
            </Box>
          </>
        )}
      </VStack>
    </Box>
  );
} 