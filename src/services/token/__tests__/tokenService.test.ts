import { describe, it, expect, beforeEach, vi } from 'vitest';
import { supabase } from '../../../lib/supabase';
import { TokenService } from '../tokenService';

describe('TokenService', () => {
  let tokenService: TokenService;

  beforeEach(() => {
    tokenService = new TokenService();
    vi.clearAllMocks();
  });

  describe('processTransaction', () => {
    it('should process a valid transaction', async () => {
      const mockTransaction = {
        user_id: 'test-user',
        type: 'grant',
        amount: 100,
        description: 'Test grant'
      };

      vi.spyOn(supabase.rpc, 'process_transaction').mockResolvedValueOnce({
        data: 'transaction-id',
        error: null
      });

      const result = await tokenService.processTransaction(
        mockTransaction.user_id,
        mockTransaction.type as any,
        mockTransaction.amount,
        mockTransaction.description
      );

      expect(result).toBe('transaction-id');
      expect(supabase.rpc.process_transaction).toHaveBeenCalledWith({
        p_user_id: mockTransaction.user_id,
        p_type: mockTransaction.type,
        p_amount: mockTransaction.amount,
        p_description: mockTransaction.description
      });
    });

    it('should throw error for invalid transaction', async () => {
      vi.spyOn(supabase.rpc, 'process_transaction').mockResolvedValueOnce({
        data: null,
        error: new Error('Invalid transaction')
      });

      await expect(
        tokenService.processTransaction('user-id', 'grant', -100)
      ).rejects.toThrow('Invalid transaction');
    });
  });

  describe('purchaseVotePack', () => {
    it('should purchase a vote pack successfully', async () => {
      const mockPurchase = {
        user_id: 'test-user',
        type: 'basic',
        amount: 10
      };

      vi.spyOn(supabase.rpc, 'purchase_vote_pack').mockResolvedValueOnce({
        data: 'vote-pack-id',
        error: null
      });

      const result = await tokenService.purchaseVotePack(
        mockPurchase.user_id,
        mockPurchase.type as any,
        mockPurchase.amount
      );

      expect(result).toBe('vote-pack-id');
      expect(supabase.rpc.purchase_vote_pack).toHaveBeenCalledWith({
        p_user_id: mockPurchase.user_id,
        p_type: mockPurchase.type,
        p_amount: mockPurchase.amount
      });
    });

    it('should throw error for invalid purchase', async () => {
      vi.spyOn(supabase.rpc, 'purchase_vote_pack').mockResolvedValueOnce({
        data: null,
        error: new Error('Insufficient balance')
      });

      await expect(
        tokenService.purchaseVotePack('user-id', 'basic', 1000)
      ).rejects.toThrow('Insufficient balance');
    });
  });
}); 