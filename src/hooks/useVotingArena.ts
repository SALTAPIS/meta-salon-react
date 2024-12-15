import { useState, useEffect, useCallback } from 'react';
import { useAuth } from './useAuth';
import { useTokens } from './token/useTokens';
import { VoteService } from '../services/VoteService';
import { ArtworkService } from '../services/ArtworkService';
import type { Artwork } from '../types/database.types';

interface ArtworkPair {
  left: Artwork;
  right: Artwork;
}

export function useVotingArena() {
  const { user } = useAuth();
  const { votePacks } = useTokens();
  const [currentPair, setCurrentPair] = useState<ArtworkPair | null>(null);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [remainingArtworks, setRemainingArtworks] = useState<Artwork[]>([]);
  const [remainingCount, setRemainingCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial artworks
  useEffect(() => {
    const loadArtworks = async () => {
      if (!user) return;

      try {
        console.log('[useVotingArena] Starting to load artworks');
        setIsLoading(true);
        setError(null);

        // Load all artworks first
        const allArtworks = await ArtworkService.getAllArtworks();
        console.log('[useVotingArena] Loaded all artworks:', allArtworks.length);
        setArtworks(allArtworks);

        // Get next pair from the database
        console.log('[useVotingArena] Getting next pair for user:', user.id);
        const pair = await VoteService.getNextArtworkPair();
        console.log('[useVotingArena] Got pair:', pair);
        setRemainingCount(pair?.remaining_count ?? 0);

        if (!pair?.artwork_id_1 || !pair?.artwork_id_2) {
          console.log('[useVotingArena] No valid pair returned');
          setCurrentPair(null);
          setRemainingArtworks(allArtworks);
          if (pair?.remaining_count === 1) {
            setError('Only one artwork remaining. We need at least two artworks for comparison.');
          } else {
            setError(null);
          }
          return;
        }

        // Get artwork details for the pair
        console.log('[useVotingArena] Loading artwork details for pair');
        const [artwork1, artwork2] = await Promise.all([
          ArtworkService.getArtwork(pair.artwork_id_1),
          ArtworkService.getArtwork(pair.artwork_id_2)
        ]);

        if (!artwork1 || !artwork2) {
          console.error('[useVotingArena] Failed to load artwork details:', { artwork1, artwork2 });
          throw new Error('Failed to load artwork pair');
        }

        console.log('[useVotingArena] Successfully loaded pair:', {
          left: artwork1.title,
          right: artwork2.title
        });

        setCurrentPair({
          left: artwork1,
          right: artwork2
        });

        setRemainingArtworks(allArtworks.filter(a => 
          a.id !== artwork1.id && a.id !== artwork2.id
        ));
      } catch (err) {
        console.error('[useVotingArena] Error loading artworks:', err);
        setError(err instanceof Error ? err.message : 'Failed to load artworks');
      } finally {
        setIsLoading(false);
      }
    };

    loadArtworks();
  }, [user]);

  // Cast vote and get next pair
  const castVote = useCallback(async (winningArtworkId: string) => {
    if (!user || !currentPair || !votePacks || votePacks.length === 0) {
      throw new Error('Cannot vote: missing user, artwork pair, or vote packs');
    }

    // Find the other artwork ID
    const otherArtworkId = winningArtworkId === currentPair.left.id 
      ? currentPair.right.id 
      : currentPair.left.id;

    // Use the first available vote pack
    const activePack = votePacks.find(pack => 
      pack.votes_remaining > 0 && 
      (!pack.expires_at || new Date(pack.expires_at) > new Date())
    );

    if (!activePack) {
      throw new Error('No active vote packs available');
    }

    try {
      // Cast vote with both artwork IDs
      await VoteService.castVote(
        winningArtworkId,
        otherArtworkId,
        activePack.id,
        1
      );

      // Get next pair
      const pair = await VoteService.getNextArtworkPair();
      setRemainingCount(pair?.remaining_count ?? 0);

      if (!pair?.artwork_id_1 || !pair?.artwork_id_2) {
        setCurrentPair(null);
        if (pair?.remaining_count === 1) {
          setError('Only one artwork remaining. We need at least two artworks for comparison.');
        } else {
          setError(null);
        }
        return;
      }

      // Get artwork details for the next pair
      const [artwork1, artwork2] = await Promise.all([
        ArtworkService.getArtwork(pair.artwork_id_1),
        ArtworkService.getArtwork(pair.artwork_id_2)
      ]);

      if (!artwork1 || !artwork2) {
        throw new Error('Failed to load next artwork pair');
      }

      // Update current pair and remaining artworks
      setCurrentPair({
        left: artwork1,
        right: artwork2
      });

      setRemainingArtworks(prev => 
        prev.filter(a => a.id !== artwork1.id && a.id !== artwork2.id)
      );
    } catch (err) {
      console.error('Error casting vote:', err);
      throw err;
    }
  }, [user, currentPair, votePacks]);

  return {
    currentPair,
    isLoading,
    error,
    castVote,
    hasVotePacks: votePacks && votePacks.length > 0,
    artworks,
    remainingArtworks,
    remainingCount
  };
} 