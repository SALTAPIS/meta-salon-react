import { supabase } from '../lib/supabase';
import type { Vote, VaultState } from '../types/database.types';
import { handleError } from '../utils/errors';

export class VoteService {
  /**
   * Cast votes for an artwork using a specific vote pack
   */
  static async castVote(artworkId: string, packId: string, value: number): Promise<string> {
    try {
      const { data, error } = await supabase
        .rpc('cast_vote', {
          p_artwork_id: artworkId,
          p_pack_id: packId,
          p_value: value
        });

      if (error) throw error;
      return data;
    } catch (error) {
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
        .select('votes')
        .eq('id', packId)
        .single();

      if (packError) throw packError;

      // Get used votes
      const { data: votes, error: votesError } = await supabase
        .from('votes')
        .select('value')
        .eq('pack_id', packId);

      if (votesError) throw votesError;

      const totalVotes = pack.votes;
      const usedVotes = votes?.reduce((sum, vote) => sum + vote.value, 0) || 0;

      return totalVotes - usedVotes;
    } catch (error) {
      throw handleError(error, 'Failed to get available votes');
    }
  }
} 