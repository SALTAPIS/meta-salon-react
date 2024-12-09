import { useState, useEffect } from 'react';
import { useToast } from '@chakra-ui/react';
import { ArtworkService } from '../services/ArtworkService';
import { VoteService } from '../services/VoteService';
import { useTokens } from './token/useTokens';
import { useAuth } from './useAuth';
import type { Artwork, VotePack } from '../types/database.types';

interface VotingPair {
  left: Artwork;
  right: Artwork;
}

export function useVotingArena() {
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [remainingArtworks, setRemainingArtworks] = useState<Artwork[]>([]);
  const [currentPair, setCurrentPair] = useState<VotingPair | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { votePacks, refreshBalance } = useTokens();
  const { user } = useAuth();
  const toast = useToast();

  // Load artworks
  useEffect(() => {
    const loadArtworks = async () => {
      try {
        setIsLoading(true);
        const data = await ArtworkService.getAllArtworks();
        setArtworks(data);
        setRemainingArtworks(data);
        if (data.length >= 2) {
          // Initialize with random pair
          const randomIndices = getRandomPairIndices(data.length);
          setCurrentPair({
            left: data[randomIndices[0]],
            right: data[randomIndices[1]]
          });
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load artworks';
        setError(message);
        toast({
          title: 'Error loading artworks',
          description: message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadArtworks();
  }, [toast]);

  // Cast vote and get next pair
  const castVote = async (winningArtworkId: string) => {
    if (!user) {
      const message = 'You must be logged in to vote';
      setError(message);
      toast({
        title: 'Authentication required',
        description: message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (!currentPair || !votePacks || votePacks.length === 0) {
      const message = 'No vote packs available. Please purchase vote packs to continue.';
      setError(message);
      toast({
        title: 'No vote packs',
        description: message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    // Use the first available vote pack
    const activePack = votePacks.find((pack: VotePack) => 
      pack.votes_remaining > 0 && 
      (!pack.expires_at || new Date(pack.expires_at) > new Date())
    );

    if (!activePack) {
      const message = 'No active vote packs available.';
      setError(message);
      toast({
        title: 'No active packs',
        description: message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Cast vote
      await VoteService.castVote(winningArtworkId, activePack.id, 1);

      // Refresh token balance
      await refreshBalance();

      toast({
        title: 'Vote recorded',
        description: 'Your vote has been cast successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to cast vote';
      console.error('Vote casting error:', err);
      setError(message);
      toast({
        title: 'Failed to cast vote',
        description: message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }

    // Always update to next pair, regardless of vote success/failure
    try {
      // Update remaining artworks
      const newRemainingArtworks = remainingArtworks.filter(artwork => 
        artwork.id !== currentPair.left.id && 
        artwork.id !== currentPair.right.id
      );
      setRemainingArtworks(newRemainingArtworks);

      if (newRemainingArtworks.length >= 2) {
        // Get random pair from remaining artworks
        const randomIndices = getRandomPairIndices(newRemainingArtworks.length);
        setCurrentPair({
          left: newRemainingArtworks[randomIndices[0]],
          right: newRemainingArtworks[randomIndices[1]]
        });
      } else if (artworks.length >= 2) {
        // If we've gone through all pairs, reset with full artwork list
        setRemainingArtworks(artworks);
        const randomIndices = getRandomPairIndices(artworks.length);
        setCurrentPair({
          left: artworks[randomIndices[0]],
          right: artworks[randomIndices[1]]
        });
      } else {
        // No more pairs available
        setCurrentPair(null);
        toast({
          title: 'Voting complete',
          description: 'You have voted on all available artwork pairs',
          status: 'info',
          duration: 5000,
          isClosable: true,
        });
      }
    } catch (err) {
      console.error('Error updating artwork pair:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get random pair indices
  const getRandomPairIndices = (max: number): [number, number] => {
    const first = Math.floor(Math.random() * max);
    let second;
    do {
      second = Math.floor(Math.random() * max);
    } while (second === first);
    return [first, second];
  };

  return {
    currentPair,
    isLoading,
    error,
    castVote,
    hasVotePacks: votePacks && votePacks.length > 0,
    artworks,
    remainingArtworks
  };
} 