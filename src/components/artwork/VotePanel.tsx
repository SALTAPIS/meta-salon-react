import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Button,
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
  Tooltip,
  CircularProgress,
  CircularProgressLabel,
} from '@chakra-ui/react';
import { useVoting } from '../../hooks/useVoting';
import { useTokens } from '../../hooks/token/useTokens';
import { VoteService } from '../../services/VoteService';
import type { VotePack, Vote } from '../../types/database.types';

interface VotePanelProps {
  artworkId: string;
}

interface ConsumptionStats {
  totalVotes: number;
  consumedVotes: number;
  unconsumedVotes: number;
  vaultValue: number;
}

interface VoteError extends Error {
  details?: Record<string, unknown>;
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
  const [consumptionStats, setConsumptionStats] = useState<ConsumptionStats | null>(null);

  // Load consumption stats
  useEffect(() => {
    let mounted = true;

    const loadStats = async () => {
      try {
        const stats = await VoteService.getVoteConsumptionStats(artworkId);
        if (mounted) {
          setConsumptionStats(stats);
        }
      } catch (err) {
        console.error('Failed to load consumption stats:', err);
      }
    };

    loadStats();
    return () => { mounted = false; };
  }, [artworkId, votes]);

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
      console.error('Vote casting error:', {
        error: err,
        message: err instanceof Error ? err.message : 'Unknown error',
        artwork_id: artworkId,
        pack_id: selectedPackId,
        vote_amount: voteAmount,
        details: err instanceof Error ? (err as VoteError).details : undefined
      });
      toast({
        title: 'Failed to cast vote',
        description: err instanceof Error ? err.message : 'Unknown error',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const activePacks = (votePacks || []).filter((pack: VotePack) => 
    pack.votes_remaining > 0 && (!pack.expires_at || new Date(pack.expires_at) > new Date())
  );

  const consumptionProgress = consumptionStats 
    ? (consumptionStats.consumedVotes / consumptionStats.totalVotes) * 100 
    : 0;

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

        {/* Consumption Stats */}
        {consumptionStats && (
          <Box>
            <Text fontWeight="bold" mb={2}>Vote Consumption</Text>
            <HStack spacing={4} align="center">
              <CircularProgress 
                value={consumptionProgress} 
                color="green.400"
                size="80px"
              >
                <CircularProgressLabel>
                  {Math.round(consumptionProgress)}%
                </CircularProgressLabel>
              </CircularProgress>
              <VStack align="start" flex={1}>
                <Tooltip label="Votes that have been converted to vault value">
                  <Text fontSize="sm">
                    Consumed: {consumptionStats.consumedVotes} votes
                  </Text>
                </Tooltip>
                <Tooltip label="Votes waiting to be consumed">
                  <Text fontSize="sm">
                    Pending: {consumptionStats.unconsumedVotes} votes
                  </Text>
                </Tooltip>
                <Tooltip label="Current vault value from consumed votes">
                  <Text fontSize="sm" fontWeight="bold">
                    Vault Value: {consumptionStats.vaultValue}
                  </Text>
                </Tooltip>
              </VStack>
            </HStack>
          </Box>
        )}

        <Divider />

        {/* Vote Input */}
        <VStack spacing={3}>
          <Select
            placeholder="Select vote pack"
            value={selectedPackId}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedPackId(e.target.value)}
          >
            {activePacks.map((pack: VotePack) => (
              <option key={pack.id} value={pack.id}>
                {pack.type.charAt(0).toUpperCase() + pack.type.slice(1)} Pack ({pack.votes_remaining} votes)
                {pack.vote_power > 1 && ` - ${pack.vote_power}x Power`}
              </option>
            ))}
          </Select>

          <NumberInput
            min={1}
            max={100}
            value={voteAmount}
            onChange={(_: string, valueNumber: number) => setVoteAmount(valueNumber)}
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
              {votes.slice(0, 5).map((vote: Vote) => (
                <HStack key={vote.id} justify="space-between" p={2} bg="gray.50" borderRadius="md">
                  <Text fontSize="sm">
                    {vote.user_id === userVotes[0]?.user_id ? 'You' : 'Someone'} voted
                  </Text>
                  <HStack spacing={2}>
                    <Text fontWeight="bold">{vote.value} votes</Text>
                    {vote.consumed && (
                      <Tooltip label="This vote has been consumed and added to the vault value">
                        <Text fontSize="xs" color="green.500">✓ Consumed</Text>
                      </Tooltip>
                    )}
                  </HStack>
                </HStack>
              ))}
            </VStack>
          </Box>
        )}
      </VStack>
    </Box>
  );
} 