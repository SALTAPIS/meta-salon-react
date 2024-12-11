import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { VoteService } from '../services/VoteService';
import type { Vote, VaultState } from '../types/database.types';
import type { Epoch } from '../services/VoteService';

export function useVoting(artworkId: string) {
  const { user } = useAuth();
  const [votes, setVotes] = useState<Vote[]>([]);
  const [currentEpochVotes, setCurrentEpochVotes] = useState<Vote[]>([]);
  const [vaultState, setVaultState] = useState<VaultState | null>(null);
  const [currentEpoch, setCurrentEpoch] = useState<Epoch | null>(null);
  const [hasVoted, setHasVoted] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load votes, vault state, and epoch data
  useEffect(() => {
    if (!artworkId) return;

    const loadData = async () => {
      try {
        setIsLoading(true);
        const [votesData, vaultData, epochData, epochVotes, votedStatus] = await Promise.all([
          VoteService.getArtworkVotes(artworkId),
          VoteService.getVaultState(artworkId),
          VoteService.getCurrentEpoch(),
          VoteService.getCurrentEpochVotes(artworkId),
          VoteService.hasVotedInCurrentEpoch(artworkId)
        ]);
        setVotes(votesData);
        setVaultState(vaultData);
        setCurrentEpoch(epochData);
        setCurrentEpochVotes(epochVotes);
        setHasVoted(votedStatus);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load voting data');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [artworkId]);

  // Cast a vote
  const castVote = async (packId: string, value: number) => {
    if (!user) {
      setError('Must be logged in to vote');
      return;
    }

    if (hasVoted) {
      setError('You have already voted for this artwork in the current epoch');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Check available votes
      const availableVotes = await VoteService.getAvailableVotes(packId);
      if (availableVotes < value) {
        throw new Error(`Insufficient votes. Available: ${availableVotes}`);
      }

      // Cast vote
      await VoteService.castVote(artworkId, packId, value);

      // Refresh data
      const [votesData, vaultData, epochVotes, votedStatus] = await Promise.all([
        VoteService.getArtworkVotes(artworkId),
        VoteService.getVaultState(artworkId),
        VoteService.getCurrentEpochVotes(artworkId),
        VoteService.hasVotedInCurrentEpoch(artworkId)
      ]);
      setVotes(votesData);
      setVaultState(vaultData);
      setCurrentEpochVotes(epochVotes);
      setHasVoted(votedStatus);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cast vote');
    } finally {
      setIsLoading(false);
    }
  };

  // Get user's votes for this artwork
  const userVotes = votes.filter(vote => vote.user_id === user?.id);
  const totalVotes = votes.reduce((sum, vote) => sum + vote.value, 0);
  const userTotalVotes = userVotes.reduce((sum, vote) => sum + vote.value, 0);
  const currentEpochTotalVotes = currentEpochVotes.reduce((sum, vote) => sum + vote.value, 0);

  return {
    votes,
    currentEpochVotes,
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
  };
} 