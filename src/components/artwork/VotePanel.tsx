import React, { useState } from 'react';
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
  StatGroup,
  Badge,
  Progress,
  Tooltip,
  Divider,
} from '@chakra-ui/react';
import { useVoting } from '../../hooks/useVoting';
import { useTokens } from '../../hooks/token/useTokens';
import type { VotePack } from '../../types/database.types';
import type { Epoch } from '../../services/VoteService';

interface VotePanelProps {
  artworkId: string;
}

interface VoteError extends Error {
  details?: Record<string, unknown>;
}

export function VotePanel({
  artworkId,
}: VotePanelProps) {
  const toast = useToast();
  const { votePacks } = useTokens();
  const {
    vaultState,
    currentEpoch,
    hasVoted,
    isLoading,
    error,
    castVote,
    userVotes,
    totalVotes,
    userTotalVotes,
    currentEpochTotalVotes
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

  // Calculate time remaining in epoch
  const getTimeRemaining = (epoch: Epoch) => {
    const now = new Date();
    const end = new Date(epoch.end_time);
    const diff = end.getTime() - now.getTime();
    
    if (diff <= 0) return 'Epoch ended';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m remaining`;
  };

  // Calculate epoch progress
  const getEpochProgress = (epoch: Epoch) => {
    const start = new Date(epoch.start_time).getTime();
    const end = new Date(epoch.end_time).getTime();
    const now = new Date().getTime();
    const total = end - start;
    const elapsed = now - start;
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  };

  return (
    <Box p={4} borderWidth={1} borderRadius="lg" bg="white">
      <VStack spacing={4} align="stretch">
        {/* Epoch Info */}
        {currentEpoch && (
          <Box>
            <HStack justify="space-between" mb={2}>
              <Text fontWeight="bold">Current Epoch</Text>
              <Badge colorScheme={currentEpoch.status === 'active' ? 'green' : 'gray'}>
                {currentEpoch.status.toUpperCase()}
              </Badge>
            </HStack>
            <Progress 
              value={getEpochProgress(currentEpoch)} 
              size="sm" 
              colorScheme="blue" 
              mb={2} 
            />
            <HStack justify="space-between" fontSize="sm">
              <Text>{getTimeRemaining(currentEpoch)}</Text>
              <Tooltip label="Tokens available for distribution in this epoch">
                <Badge colorScheme="green">{currentEpoch.tokens_per_epoch} tokens</Badge>
              </Tooltip>
            </HStack>
          </Box>
        )}

        {/* Vote Stats */}
        <StatGroup>
          <Stat>
            <StatLabel>Total Votes</StatLabel>
            <StatNumber>{totalVotes}</StatNumber>
            <StatHelpText>This Epoch: {currentEpochTotalVotes}</StatHelpText>
          </Stat>
          <Stat>
            <StatLabel>Your Votes</StatLabel>
            <StatNumber>{userTotalVotes}</StatNumber>
            <StatHelpText>From {userVotes.length} vote(s)</StatHelpText>
          </Stat>
          <Stat>
            <StatLabel>Vault Value</StatLabel>
            <StatNumber>{vaultState?.accumulated_value || 0}</StatNumber>
            <StatHelpText>Accumulated SLN</StatHelpText>
          </Stat>
        </StatGroup>

        <Divider />

        {/* Error Alert */}
        {error && (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        )}

        {/* Already Voted Alert */}
        {hasVoted && (
          <Alert status="info">
            <AlertIcon />
            You have already voted in this epoch
          </Alert>
        )}

        {/* No Active Epoch Alert */}
        {!currentEpoch && (
          <Alert status="warning">
            <AlertIcon />
            No active voting epoch at the moment
          </Alert>
        )}

        {/* Vote Input */}
        <VStack spacing={3}>
          <Select
            placeholder="Select vote pack"
            value={selectedPackId}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setSelectedPackId(e.target.value)}
            isDisabled={hasVoted || !currentEpoch || currentEpoch.status !== 'active'}
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
            isDisabled={hasVoted || !currentEpoch || currentEpoch.status !== 'active'}
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
            isDisabled={
              !selectedPackId || 
              voteAmount < 1 || 
              hasVoted || 
              !currentEpoch || 
              currentEpoch.status !== 'active'
            }
            width="full"
          >
            {!currentEpoch ? 'No Active Epoch' :
             hasVoted ? 'Already Voted' :
             currentEpoch.status !== 'active' ? 'Epoch Not Active' :
             'Cast Vote'}
          </Button>
        </VStack>
      </VStack>
    </Box>
  );
}