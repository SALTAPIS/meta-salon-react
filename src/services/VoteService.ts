import { supabase } from '../lib/supabaseClient';
import { handleError } from '../utils/errors';
import { getSession } from '../utils/session';
import { VotePackService } from './VotePackService';
import type { Vote, VaultState } from '../types/database.types';

export interface Epoch {
  id: number;
  start_time: string;
  end_time: string;
  tokens_per_epoch: number;
  status: 'active' | 'completed' | 'pending';
}

export class VoteService {
  /**
   * Cast a vote for an artwork using a vote pack
   */
  static async castVote(artworkId: string, packId: string, value: number): Promise<void> {
    try {
      // Get session for auth token
      const session = await getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Check if user has already voted for this artwork in current epoch
      const hasVoted = await this.hasVotedInCurrentEpoch(artworkId);
      if (hasVoted) {
        throw new Error('You have already voted for this artwork in the current epoch');
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
   * Get current epoch information
   */
  static async getCurrentEpoch(): Promise<Epoch | null> {
    try {
      const { data, error } = await supabase.rpc('get_current_epoch');
      
      if (error) throw error;
      return data;
    } catch (error) {
      throw handleError(error, 'Failed to get current epoch');
    }
  }

  /**
   * Check if user has voted for artwork in current epoch
   */
  static async hasVotedInCurrentEpoch(artworkId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('has_voted_in_current_epoch', {
        artwork_id_param: artworkId
      });

      if (error) throw error;
      return data || false;
    } catch (error) {
      throw handleError(error, 'Failed to check voting status');
    }
  }

  /**
   * Get votes for current epoch
   */
  static async getCurrentEpochVotes(artworkId: string): Promise<Vote[]> {
    try {
      const currentEpoch = await this.getCurrentEpoch();
      if (!currentEpoch) return [];

      const { data, error } = await supabase
        .from('votes')
        .select('*')
        .eq('artwork_id', artworkId)
        .eq('epoch_id', currentEpoch.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw handleError(error, 'Failed to get current epoch votes');
    }
  }
} 