import { supabase } from '../lib/supabaseClient';
import { handleError } from '../utils/errors';

export interface ArtistPayout {
  id: string;
  artwork_id: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  processed_at?: string;
  transaction_id?: string;
}

export interface PayoutSummary {
  artwork_id: string;
  title: string;
  available_amount: number;
  total_paid: number;
  pending_amount: number;
}

export class ArtistService {
  /**
   * Get available payout amount for an artwork
   */
  static async getAvailablePayout(artworkId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .rpc('calculate_artist_payout', {
          p_artwork_id: artworkId
        });

      if (error) {
        console.error('[ArtistService] Failed to calculate payout:', {
          error,
          artwork_id: artworkId
        });
        throw error;
      }

      return data || 0;
    } catch (error) {
      throw handleError(error, 'Failed to calculate available payout');
    }
  }

  /**
   * Request a payout for an artwork
   */
  static async requestPayout(artworkId: string, amount: number): Promise<string> {
    try {
      const { data, error } = await supabase
        .rpc('request_artist_payout', {
          p_artwork_id: artworkId,
          p_amount: amount
        });

      if (error) {
        console.error('[ArtistService] Failed to request payout:', {
          error,
          artwork_id: artworkId,
          amount
        });
        throw error;
      }

      return data;
    } catch (error) {
      throw handleError(error, 'Failed to request payout');
    }
  }

  /**
   * Get payout history for the current artist
   */
  static async getPayoutHistory(): Promise<ArtistPayout[]> {
    try {
      const { data, error } = await supabase
        .from('artist_payouts')
        .select(`
          id,
          artwork_id,
          amount,
          status,
          created_at,
          processed_at,
          transaction_id
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[ArtistService] Failed to get payout history:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      throw handleError(error, 'Failed to get payout history');
    }
  }

  /**
   * Get payout summary for all artworks of the current artist
   */
  static async getPayoutSummary(): Promise<PayoutSummary[]> {
    try {
      // Get all artworks with their vault values
      const { data: artworks, error: artworksError } = await supabase
        .from('artworks')
        .select(`
          id,
          title,
          vault_value
        `);

      if (artworksError) throw artworksError;

      // Get all payouts for these artworks
      const { data: payouts, error: payoutsError } = await supabase
        .from('artist_payouts')
        .select(`
          artwork_id,
          amount,
          status
        `);

      if (payoutsError) throw payoutsError;

      // Calculate summaries
      const summaries = artworks?.map(artwork => {
        const artworkPayouts = payouts?.filter(p => p.artwork_id === artwork.id) || [];
        const totalPaid = artworkPayouts
          .filter(p => p.status === 'completed')
          .reduce((sum, p) => sum + p.amount, 0);
        const pendingAmount = artworkPayouts
          .filter(p => p.status === 'pending' || p.status === 'processing')
          .reduce((sum, p) => sum + p.amount, 0);

        return {
          artwork_id: artwork.id,
          title: artwork.title,
          available_amount: (artwork.vault_value || 0) - totalPaid - pendingAmount,
          total_paid: totalPaid,
          pending_amount: pendingAmount
        };
      }) || [];

      return summaries;
    } catch (error) {
      throw handleError(error, 'Failed to get payout summary');
    }
  }

  /**
   * Process a payout (admin only)
   */
  static async processPayout(
    payoutId: string,
    status: 'processing' | 'completed' | 'failed',
    transactionId?: string
  ): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .rpc('process_artist_payout', {
          p_payout_id: payoutId,
          p_status: status,
          p_transaction_id: transactionId
        });

      if (error) {
        console.error('[ArtistService] Failed to process payout:', {
          error,
          payout_id: payoutId,
          status
        });
        throw error;
      }

      return data;
    } catch (error) {
      throw handleError(error, 'Failed to process payout');
    }
  }
} 