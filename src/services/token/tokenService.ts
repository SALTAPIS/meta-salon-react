import { supabase } from '../../lib/supabaseClient';
import { handleError } from '../../utils/errorHandling';
import { VOTE_PACK_DEFINITIONS, calculatePackPrice } from '../../config/votePackConfig';
import type { VotePack, Transaction } from '../../types/database.types';

export class TokenService {
  /**
   * Get user's token balance
   */
  static async getBalance(userId: string): Promise<number> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data?.balance || 0;
    } catch (error) {
      throw handleError(error, 'Failed to get balance');
    }
  }

  /**
   * Get user's vote packs
   */
  static async getVotePacks(userId: string): Promise<VotePack[]> {
    try {
      const { data, error } = await supabase
        .from('vote_packs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw handleError(error, 'Failed to get vote packs');
    }
  }

  /**
   * Purchase a vote pack
   */
  static async purchaseVotePack(packType: string): Promise<void> {
    try {
      const packDef = VOTE_PACK_DEFINITIONS.find(p => p.type === packType);
      if (!packDef) {
        throw new Error('Invalid pack type');
      }

      const price = calculatePackPrice(packDef.votes, packDef.votePower);

      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        throw new Error('Not authenticated');
      }

      const { error } = await supabase.rpc('purchase_vote_pack', {
        p_type: packType,
        p_amount: price
      });

      if (error) throw error;
    } catch (error) {
      throw handleError(error, 'Failed to purchase vote pack');
    }
  }

  /**
   * Get user's transaction history
   */
  static async getUserTransactions(userId: string, limit?: number): Promise<Transaction[]> {
    try {
      let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw handleError(error, 'Failed to get transaction history');
    }
  }

  /**
   * Get transaction history (alias for getUserTransactions)
   * @deprecated Use getUserTransactions instead
   */
  static async getTransactionHistory(userId: string): Promise<Transaction[]> {
    return this.getUserTransactions(userId);
  }
} 