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
  raw?: string;
  type?: string;
}

interface VoteResponse {
  success: boolean;
  vote_id?: string;
  total_value?: number;
  votes_remaining?: number;
  error?: string;
  details?: ErrorDetails;
}

export class VoteService {
  /**
   * Cast votes for an artwork using a specific vote pack
   */
  static async castVote(artworkId: string, packId: string, value: number): Promise<string> {
    let timeoutId: NodeJS.Timeout | undefined;

    try {
      const session = await getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Validate inputs
      if (!artworkId || !packId || typeof value !== 'number' || value <= 0) {
        throw new Error('Invalid vote parameters');
      }

      // Check artwork exists and is active
      const { data: artwork, error: artworkError } = await supabase
        .from('artworks')
        .select('vault_status')
        .eq('id', artworkId)
        .single();

      if (artworkError) {
        console.error('Failed to verify artwork:', artworkError);
        throw new Error('Failed to verify artwork');
      }

      if (!artwork || artwork.vault_status !== 'active') {
        throw new Error('Artwork is not active');
      }

      console.log('Artwork check:', {
        exists: !!artwork,
        vault_status: artwork?.vault_status
      });

      // Check vote pack
      const { data: pack, error: packError } = await supabase
        .from('vote_packs')
        .select('*')
        .eq('id', packId)
        .eq('user_id', session.user.id)
        .single();

      if (packError) {
        console.error('Failed to verify vote pack:', packError);
        throw new Error('Failed to verify vote pack');
      }

      if (!pack || pack.votes_remaining < value) {
        throw new Error('Insufficient votes in pack');
      }

      console.log('Vote pack check:', {
        exists: !!pack,
        votes_remaining: pack?.votes_remaining,
        expires_at: pack?.expires_at
      });

      // Set up timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error('Vote operation timed out. Please try again.'));
        }, 10000); // 10 second timeout
      });

      // Call Edge Function with race against timeout
      const functionPromise = supabase.functions.invoke<VoteResponse>('cast-vote', {
        body: {
          artwork_id: artworkId,
          pack_id: packId,
          value: value
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      const { data, error } = await Promise.race([functionPromise, timeoutPromise]);

      if (error) {
        console.error('Edge Function error:', {
          message: error.message,
          name: error.name,
          cause: error.cause,
          details: error
        });

        // Try to extract error details from the error response
        let errorMessage = error.message;
        try {
          const errorData = JSON.parse(error.message);
          errorMessage = errorData.error || errorData.message || error.message;
        } catch {
          // If parsing fails, use the original error message
        }

        throw new Error(errorMessage);
      }

      if (!data || !data.success) {
        console.error('Vote casting failed:', {
          error: data?.error,
          details: data?.details
        });
        throw new Error(data?.error || 'Failed to cast vote');
      }

      if (!data.vote_id) {
        console.error('Invalid response from server:', data);
        throw new Error('Invalid response from server');
      }

      console.log('Vote cast successfully:', {
        vote_id: data.vote_id,
        total_value: data.total_value,
        votes_remaining: data.votes_remaining,
        artwork_id: artworkId,
        pack_id: packId
      });

      // Update local vote pack state
      await VotePackService.refreshVotePacks();

      return data.vote_id;
    } catch (err) {
      const error = err as Error;
      console.error('Vote casting error:', {
        error,
        artwork_id: artworkId,
        pack_id: packId,
        value: value,
        message: error.message,
        stack: error.stack
      });

      // Try to extract a user-friendly error message
      let userMessage = 'Failed to cast vote';
      if (error.message.includes('not active')) {
        userMessage = 'This artwork is not currently accepting votes';
      } else if (error.message.includes('Insufficient')) {
        userMessage = 'Not enough votes available in the selected pack';
      } else if (error.message.includes('expired')) {
        userMessage = 'The selected vote pack has expired';
      }

      throw handleError(error, userMessage);
    } finally {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
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