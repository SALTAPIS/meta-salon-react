import { useState, useEffect } from 'react';
import { useToast } from '@chakra-ui/react';
import { ArtworkService } from '../services/ArtworkService';
import { VoteService } from '../services/VoteService';
import { useTokens } from './token/useTokens';
import { useAuth } from './useAuth';
import { supabase } from '../lib/supabaseClient';
import type { Artwork, VotePack } from '../types/database.types';

interface VotingPair {
  left: Artwork;
  right: Artwork;
}

interface VoteError extends Error {
  details?: Record<string, unknown>;
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

  // Load artworks and filter out already viewed ones
  useEffect(() => {
    const loadArtworks = async () => {
      try {
        setIsLoading(true);
        const data = await ArtworkService.getAllArtworks();

        if (user) {
          try {
            // Get artworks already viewed by the user
            const { data: viewedArtworks, error: viewError } = await supabase
              .from('artwork_views')
              .select('artwork_id')
              .eq('user_id', user.id);

            if (viewError) {
              // If table doesn't exist yet, just show all artworks
              if (viewError.code === '42P01') {
                setArtworks(data);
                setRemainingArtworks(data);
                if (data.length >= 2) {
                  const randomIndices = getRandomPairIndices(data.length);
                  await updateArtworkPair(data[randomIndices[0]], data[randomIndices[1]]);
                }
                return;
              }
              console.error('Error loading viewed artworks:', viewError);
              throw viewError;
            }

            // Filter out already viewed artworks
            const viewedIds = new Set(viewedArtworks?.map(v => v.artwork_id) || []);
            const unviewedArtworks = data.filter(artwork => !viewedIds.has(artwork.id));

            // If all artworks have been viewed, show message and don't set current pair
            if (unviewedArtworks.length === 0) {
              toast({
                title: 'All artworks viewed',
                description: 'You have already voted on all available artworks',
                status: 'info',
                duration: 5000,
                isClosable: true,
              });
              setArtworks([]);
              setRemainingArtworks([]);
              setCurrentPair(null);
              setIsLoading(false);
              return;
            }

            setArtworks(unviewedArtworks);
            setRemainingArtworks(unviewedArtworks);

            if (unviewedArtworks.length >= 2) {
              const randomIndices = getRandomPairIndices(unviewedArtworks.length);
              await updateArtworkPair(unviewedArtworks[randomIndices[0]], unviewedArtworks[randomIndices[1]]);
            } else if (unviewedArtworks.length === 1) {
              // Only one artwork left
              toast({
                title: 'Almost done',
                description: 'Only one artwork remaining - need at least two for voting',
                status: 'info',
                duration: 5000,
                isClosable: true,
              });
              setCurrentPair(null);
            }
          } catch (err) {
            console.error('Error loading viewed artworks:', err);
            throw err;
          }
        } else {
          // For non-logged in users, show all artworks
          setArtworks(data);
          setRemainingArtworks(data);
          if (data.length >= 2) {
            const randomIndices = getRandomPairIndices(data.length);
            await updateArtworkPair(data[randomIndices[0]], data[randomIndices[1]]);
          }
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
    }

    loadArtworks();
  }, [user, toast]);

  // Helper function to update artwork pair and set current_pair_id
  const updateArtworkPair = async (leftArtwork: Artwork, rightArtwork: Artwork) => {
    try {
      // Update current_pair_id for both artworks
      await supabase
        .from('artworks')
        .update({ current_pair_id: rightArtwork.id })
        .eq('id', leftArtwork.id);

      await supabase
        .from('artworks')
        .update({ current_pair_id: leftArtwork.id })
        .eq('id', rightArtwork.id);

      setCurrentPair({
        left: leftArtwork,
        right: rightArtwork
      });
    } catch (err) {
      console.error('Error updating artwork pair:', err);
      // Still set the current pair even if the update fails
      setCurrentPair({
        left: leftArtwork,
        right: rightArtwork
      });
    }
  };

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
      // Cast vote directly - artwork views are recorded in the cast_vote function
      await VoteService.castVote(winningArtworkId, activePack.id, 1);

      // Refresh token balance
      await refreshBalance();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to cast vote';
      console.error('Vote casting error:', {
        error: err,
        message,
        artwork_id: winningArtworkId,
        pack_id: activePack.id,
        details: err instanceof Error ? (err as VoteError).details : undefined
      });
      setError(message);
      toast({
        title: 'Failed to cast vote',
        description: message,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return; // Don't proceed to next pair if vote failed
    }

    // Always update to next pair, regardless of vote success/failure
    try {
      // Update remaining artworks
      const newRemainingArtworks = remainingArtworks.filter((artwork: Artwork) => 
        artwork.id !== currentPair.left.id && 
        artwork.id !== currentPair.right.id
      );
      setRemainingArtworks(newRemainingArtworks);

      if (newRemainingArtworks.length >= 2) {
        // Get random pair from remaining artworks
        const randomIndices = getRandomPairIndices(newRemainingArtworks.length);
        await updateArtworkPair(
          newRemainingArtworks[randomIndices[0]],
          newRemainingArtworks[randomIndices[1]]
        );
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