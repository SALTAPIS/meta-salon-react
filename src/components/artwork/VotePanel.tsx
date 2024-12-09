import { useState, useEffect } from 'react';
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
import type { VotePack } from '../../types/database.types';

interface VotePanelProps {
  artworkId: string;
}

interface ConsumptionStats {
  totalVotes: number;
  consumedVotes: number;
  unconsumedVotes: number;
  vaultValue: number;
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
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Load consumption stats
  useEffect(() => {
    const loadStats = async () => {
      try {
        setIsLoadingStats(true);
        const stats = await VoteService.getVoteConsumptionStats(artworkId);
        setConsumptionStats(stats);
      } catch (err) {
        console.error('Failed to load consumption stats:', err);
      } finally {
        setIsLoadingStats(false);
      }
    };

    loadStats();
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
      toast({
        title: 'Failed to cast vote',
        description: err instanceof Error ? err.message : 'Unknown error',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const activePacks = (votePacks || []).filter((pack: VotePack) => pack.status === 'active');
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
                Vote Pack ({pack.votes} votes)
              </option>
            ))}
          </Select>

          <NumberInput
            min={1}
            max={100}
            value={voteAmount}
            onChange={(valueString: string, valueNumber: number) => setVoteAmount(valueNumber)}
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