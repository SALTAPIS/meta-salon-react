import { supabase } from '../lib/supabaseClient';
import type { Vote, VaultState } from '../types/database.types';
import { handleError } from '../utils/errors';
import { getSession } from '../utils/session';
import { VotePackService } from './VotePackService';

interface ErrorDetails {
  code?: string;
  hint?: string;
  details?: string;
  message?: string;
  error?: string;
  raw?: string;
  type?: string;
}

interface VoteError extends Error {
  details?: ErrorDetails;
}

interface VoteResponse {
  success: boolean;
  vote_id?: string;
  total_value?: number;
  votes_remaining?: number;
  error?: string;
  details?: ErrorDetails;
}

interface EdgeFunctionError {
  success: false;
  error: string;
  details?: string | Record<string, unknown>;
  code?: string;
  request_id: string;
}

interface EdgeFunctionSuccess {
  success: true;
  data: unknown;
  request_id: string;
}

type EdgeFunctionResponse = EdgeFunctionError | EdgeFunctionSuccess;

export class VoteService {
  /**
   * Cast votes for an artwork using a specific vote pack
   */
  static async castVote(artworkId: string, packId: string, value: number): Promise<void> {
    try {
      // Get session for auth token
      const session = await getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Log request
      console.log('[VoteService] Casting vote:', {
        artwork_id: artworkId,
        pack_id: packId,
        value: value,
        user_id: session.user.id
      });

      // Call database function directly
      const { data, error } = await supabase.rpc('cast_vote', {
        p_artwork_id: artworkId,
        p_pack_id: packId,
        p_value: value
      });

      // Handle database error
      if (error) {
        console.error('[VoteService] Database error:', {
          error,
          message: error.message,
          details: error.details,
          hint: error.hint,
          request: {
            artwork_id: artworkId,
            pack_id: packId,
            value: value
          }
        });
        throw error;
      }

      // Log success
      console.log('[VoteService] Vote success:', {
        data,
        artwork_id: artworkId,
        pack_id: packId,
        value: value
      });

      // Refresh vote packs
      await VotePackService.refreshVotePacks();
    } catch (error) {
      console.error('[VoteService] Error:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        artwork_id: artworkId,
        pack_id: packId,
        value: value
      });
      throw handleError(error, 'Failed to cast vote');
    }
  }

  /**
   * Get votes for a specific artwork
   */
  static async getArtworkVotes(artworkId: string): Promise<Vote[]> {
    try {
      const { data, error } = await supabase
        .from('votes')
        .select('*')
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
   * Get user's votes
   */
  static async getUserVotes(userId: string): Promise<Vote[]> {
    try {
      const { data, error } = await supabase
        .from('votes')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw handleError(error, 'Failed to get user votes');
    }
  }

  /**
   * Get available votes in a pack
   */
  static async getAvailableVotes(packId: string): Promise<number> {
    try {
      // Get total votes in pack
      const { data: pack, error: packError } = await supabase
        .from('vote_packs')
        .select('votes_remaining')
        .eq('id', packId)
        .single();

      if (packError) throw packError;

      if (!pack) {
        throw new Error('Vote pack not found');
      }

      return pack.votes_remaining;
    } catch (error) {
      throw handleError(error, 'Failed to get available votes');
    }
  }

  /**
   * Get unconsumed votes for an artwork
   */
  static async getUnconsumedVotes(artworkId: string): Promise<Vote[]> {
    try {
      const { data, error } = await supabase
        .from('votes')
        .select('*')
        .eq('artwork_id', artworkId)
        .eq('consumed', false)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw handleError(error, 'Failed to get unconsumed votes');
    }
  }

  /**
   * Get vote consumption stats for an artwork
   */
  static async getVoteConsumptionStats(artworkId: string): Promise<{
    totalVotes: number;
    consumedVotes: number;
    unconsumedVotes: number;
    vaultValue: number;
  }> {
    try {
      // Get all votes
      const { data: votes, error: votesError } = await supabase
        .from('votes')
        .select('value, consumed')
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
      const consumedVotes = votes?.filter(v => v.consumed).reduce((sum, vote) => sum + vote.value, 0) || 0;
      const unconsumedVotes = totalVotes - consumedVotes;

      return {
        totalVotes,
        consumedVotes,
        unconsumedVotes,
        vaultValue: artwork.vault_value
      };
    } catch (error) {
      throw handleError(error, 'Failed to get vote consumption stats');
    }
  }

  /**
   * Trigger manual vote consumption for an artwork
   * Note: This is mainly for testing/admin purposes
   */
  static async triggerVoteConsumption(artworkId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .rpc('consume_votes', {
          p_artwork_id: artworkId,
          p_max_votes: 100
        });

      if (error) throw error;
      return data;
    } catch (error) {
      throw handleError(error, 'Failed to trigger vote consumption');
    }
  }
} 