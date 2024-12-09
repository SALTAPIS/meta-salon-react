import { useState } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
  Progress,
  useToast,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Select,
  Alert,
  AlertIcon,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Divider,
} from '@chakra-ui/react';
import { useVoting } from '../../hooks/useVoting';
import { useTokens } from '../../hooks/token/useTokens';
import type { VotePack } from '../../types/database.types';

interface VotePanelProps {
  artworkId: string;
}

export function VotePanel({ artworkId }: VotePanelProps) {
  const toast = useToast();
  const { votePacks } = useTokens();
  const {
    votes,
    vaultState,
    isLoading,
    error,
    castVote,
    userVotes,
    totalVotes,
    userTotalVotes
  } = useVoting(artworkId);

  const [selectedPackId, setSelectedPackId] = useState<string>('');
  const [voteAmount, setVoteAmount] = useState<number>(1);

  const handleVote = async () => {
    try {
      await castVote(selectedPackId, voteAmount);
      toast({
        title: 'Vote cast successfully',
        description: `You cast ${voteAmount} votes`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'Failed to cast vote',
        description: err instanceof Error ? err.message : 'Unknown error',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const activePacks = votePacks.filter((pack: VotePack) => pack.status === 'active');

  return (
    <Box p={4} borderWidth={1} borderRadius="lg" bg="white">
      <VStack spacing={4} align="stretch">
        {/* Vault Stats */}
        <HStack justify="space-between">
          <Stat>
            <StatLabel>Total Votes</StatLabel>
            <StatNumber>{totalVotes}</StatNumber>
            <StatHelpText>Accumulated Value: {vaultState?.accumulated_value || 0}</StatHelpText>
          </Stat>
          <Stat>
            <StatLabel>Your Votes</StatLabel>
            <StatNumber>{userTotalVotes}</StatNumber>
            <StatHelpText>From {userVotes.length} vote(s)</StatHelpText>
          </Stat>
        </HStack>

        <Divider />

        {/* Vote Input */}
        <VStack spacing={3}>
          <Select
            placeholder="Select vote pack"
            value={selectedPackId}
            onChange={(e) => setSelectedPackId(e.target.value)}
          >
            {activePacks.map((pack: VotePack) => (
              <option key={pack.id} value={pack.id}>
                Vote Pack ({pack.votes} votes)
              </option>
            ))}
          </Select>

          <NumberInput
            min={1}
            max={100}
            value={voteAmount}
            onChange={(_, value) => setVoteAmount(value)}
          >
            <NumberInputField />
            <NumberInputStepper>
              <NumberIncrementStepper />
              <NumberDecrementStepper />
            </NumberInputStepper>
          </NumberInput>

          <Button
            colorScheme="blue"
            isLoading={isLoading}
            onClick={handleVote}
            isDisabled={!selectedPackId || voteAmount < 1}
            width="full"
          >
            Cast Vote
          </Button>
        </VStack>

        {/* Error Display */}
        {error && (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        )}

        {/* Vote History */}
        {votes.length > 0 && (
          <Box>
            <Text fontWeight="bold" mb={2}>Recent Votes</Text>
            <VStack spacing={2} align="stretch">
              {votes.slice(0, 5).map((vote) => (
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