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
  useColorModeValue,
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
  
  const bgColor = useColorModeValue('white', 'gray.700');
  const statBgColor = useColorModeValue('gray.50', 'gray.600');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const vaultValueColor = useColorModeValue('green.500', 'green.300');
  
  // Only fetch votes data if user is admin
  const {
    votes,
    userVotes,
  } = isAdmin ? useVoting(artworkId) : { votes: [], userVotes: [] };

  return (
    <Box p={4} borderWidth={1} borderRadius="lg" bg={bgColor} borderColor={borderColor}>
      <VStack spacing={4} align="stretch">
        {/* Key Stats - Visible to everyone */}
        <HStack justify="space-between">
          <Stat>
            <StatLabel color={textColor}>Vault Value</StatLabel>
            <StatNumber color={vaultValueColor}>{artwork.vault_value || 0} SLN</StatNumber>
            <StatHelpText color={textColor}>Total earned value</StatHelpText>
          </Stat>
          <Stat>
            <StatLabel color={textColor}>Total Votes</StatLabel>
            <StatNumber color={textColor}>{artwork.vote_count || 0}</StatNumber>
            <StatHelpText color={textColor}>From all voters</StatHelpText>
          </Stat>
        </HStack>

        {/* Vote History - Only visible to admins */}
        {isAdmin && user && votes.length > 0 && (
          <>
            <Divider borderColor={borderColor} />
            <Box>
              <Text fontWeight="bold" mb={2} color={textColor}>Recent Votes</Text>
              <VStack spacing={2} align="stretch">
                {votes.slice(0, 10).map((vote: Vote) => (
                  <HStack key={vote.id} justify="space-between" p={2} bg={statBgColor} borderRadius="md">
                    <VStack align="start" spacing={0}>
                      <Text fontSize="sm" color={textColor}>
                        {vote.user_id === userVotes[0]?.user_id ? 'You' : 'Someone'} voted
                      </Text>
                      <Text fontSize="xs" color={textColor}>
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