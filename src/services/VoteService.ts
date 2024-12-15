import { supabase } from '../lib/supabaseClient';
import { handleError } from '../utils/errors';
import { getSession } from '../utils/session';
import { VotePackService } from './VotePackService';
import type { Vote, VaultState, ArtworkMatch } from '../types/database.types';

interface NextArtworkPair {
  artwork_id_1: string | null;
  artwork_id_2: string | null;
  remaining_count: number;
}

export class VoteService {
  /**
   * Cast a vote for an artwork using a vote pack
   */
  static async castVote(
    winningArtworkId: string,
    otherArtworkId: string,
    packId: string,
    value: number
  ): Promise<void> {
    try {
      // Get session for auth token
      const session = await getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Log request
      console.log('[VoteService] Casting vote:', {
        winning_artwork_id: winningArtworkId,
        other_artwork_id: otherArtworkId,
        pack_id: packId,
        value: value,
        user_id: session.user.id
      });

      // Call database function directly
      const { data, error } = await supabase.rpc('cast_vote', {
        p_artwork_id: winningArtworkId,
        p_other_artwork_id: otherArtworkId,
        p_pack_id: packId,
        p_value: value
      });

      // Handle database error
      if (error) {
        console.error('[VoteService] Database error:', {
          error,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint,
          request: {
            winning_artwork_id: winningArtworkId,
            other_artwork_id: otherArtworkId,
            pack_id: packId,
            value: value
          }
        });
        throw error;
      }

      // Log success
      console.log('[VoteService] Vote success:', {
        data,
        winning_artwork_id: winningArtworkId,
        other_artwork_id: otherArtworkId,
        pack_id: packId,
        value: value
      });

      // Refresh vote packs
      await VotePackService.refreshVotePacks();
    } catch (error) {
      console.error('[VoteService] Error:', {
        error,
        code: error instanceof Error ? (error as any).code : undefined,
        message: error instanceof Error ? error.message : 'Unknown error',
        details: error instanceof Error ? (error as any).details : undefined,
        hint: error instanceof Error ? (error as any).hint : undefined,
        winning_artwork_id: winningArtworkId,
        other_artwork_id: otherArtworkId,
        pack_id: packId,
        value: value
      });
      throw handleError(error, 'Failed to cast vote');
    }
  }

  /**
   * Get next artwork pair for voting
   */
  static async getNextArtworkPair(): Promise<NextArtworkPair> {
    try {
      const session = await getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const { data, error } = await supabase.rpc('get_next_artwork_pair');

      if (error) {
        console.error('[VoteService] Error getting next pair:', {
          error,
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }
      
      // Handle array response
      const pair = Array.isArray(data) ? data[0] : data;
      console.log('[VoteService] Raw pair data:', data);
      console.log('[VoteService] Processed pair:', pair);
      
      return pair || { artwork_id_1: null, artwork_id_2: null, remaining_count: 0 };
    } catch (error) {
      throw handleError(error, 'Failed to get next artwork pair');
    }
  }

  /**
   * Get matches for a specific artwork
   */
  static async getArtworkMatches(artworkId: string): Promise<ArtworkMatch[]> {
    try {
      const { data, error } = await supabase
        .from('artwork_matches')
        .select('*')
        .or(`artwork_id_1.eq.${artworkId},artwork_id_2.eq.${artworkId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw handleError(error, 'Failed to get artwork matches');
    }
  }

  /**
   * Get votes for a specific artwork
   */
  static async getArtworkVotes(artworkId: string): Promise<Vote[]> {
    try {
      const { data, error } = await supabase
        .from('votes')
        .select(`
          id,
          user_id,
          artwork_id,
          pack_id,
          value,
          vote_power,
          total_value,
          sln_value,
          created_at,
          updated_at
        `)
        .eq('artwork_id', artworkId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw handleError(error, 'Failed to get artwork votes');
    }
  }

  /**
   * Get vault state for a specific artwork
   */
  static async getVaultState(artworkId: string): Promise<VaultState | null> {
    try {
      const { data, error } = await supabase
        .from('vault_states')
        .select('*')
        .eq('artwork_id', artworkId)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "not found"
      return data;
    } catch (error) {
      throw handleError(error, 'Failed to get vault state');
    }
  }

  /**
   * Get available votes in a pack
   */
  static async getAvailableVotes(packId: string): Promise<number> {
    try {
      const { data: pack, error: packError } = await supabase
        .from('vote_packs')
        .select('votes_remaining')
        .eq('id', packId)
        .single();

      if (packError) throw packError;
      if (!pack) throw new Error('Vote pack not found');

      return pack.votes_remaining;
    } catch (error) {
      throw handleError(error, 'Failed to get available votes');
    }
  }

  /**
   * Get vote stats for an artwork
   */
  static async getVoteConsumptionStats(artworkId: string): Promise<{
    totalVotes: number;
    vaultValue: number;
  }> {
    try {
      // Get all votes
      const { data: votes, error: votesError } = await supabase
        .from('votes')
        .select('value')
        .eq('artwork_id', artworkId);

      if (votesError) throw votesError;

      // Get artwork vault value
      const { data: artwork, error: artworkError } = await supabase
        .from('artworks')
        .select('vault_value')
        .eq('id', artworkId)
        .single();

      if (artworkError) throw artworkError;

      const totalVotes = votes?.reduce((sum, vote) => sum + vote.value, 0) || 0;

      return {
        totalVotes,
        vaultValue: artwork.vault_value
      };
    } catch (error) {
      throw handleError(error, 'Failed to get vote stats');
    }
  }
} 