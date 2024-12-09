import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { VoteService } from '../services/VoteService';
import type { Vote, VaultState } from '../types/database.types';

export function useVoting(artworkId: string) {
  const { user } = useAuth();
  const [votes, setVotes] = useState<Vote[]>([]);
  const [vaultState, setVaultState] = useState<VaultState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load votes and vault state
  useEffect(() => {
    if (!artworkId) return;

    const loadData = async () => {
      try {
        setIsLoading(true);
        const [votesData, vaultData] = await Promise.all([
          VoteService.getArtworkVotes(artworkId),
          VoteService.getVaultState(artworkId)
        ]);
        setVotes(votesData);
        setVaultState(vaultData);
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
      const [votesData, vaultData] = await Promise.all([
        VoteService.getArtworkVotes(artworkId),
        VoteService.getVaultState(artworkId)
      ]);
      setVotes(votesData);
      setVaultState(vaultData);
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

  return {
    votes,
    vaultState,
    isLoading,
    error,
    castVote,
    userVotes,
    totalVotes,
    userTotalVotes
  };
} 