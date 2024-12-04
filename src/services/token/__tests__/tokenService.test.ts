import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TokenService } from '../tokenService';
import { supabase } from '../../../lib/supabase';

// Mock the Supabase client
vi.mock('../../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockReturnThis(),
    })),
    rpc: vi.fn(),
  },
}));

describe('TokenService', () => {
  let tokenService: TokenService;

  beforeEach(() => {
    vi.clearAllMocks();
    tokenService = TokenService.getInstance();
  });

  describe('processTransaction', () => {
    it('should process a transaction successfully', async () => {
      const mockTransactionId = 'transaction-id';
      const mockRpc = vi.fn().mockResolvedValueOnce({
        data: mockTransactionId,
        error: null,
      });
      (supabase.rpc as any) = mockRpc;

      const result = await tokenService.processTransaction(
        'user-id',
        'grant',
        100,
        'Test transaction'
      );

      expect(result).toBe(mockTransactionId);
      expect(mockRpc).toHaveBeenCalledWith('process_transaction', {
        p_user_id: 'user-id',
        p_type: 'grant',
        p_amount: 100,
        p_description: 'Test transaction',
        p_reference_id: undefined,
      });
    });

    it('should throw an error when transaction fails', async () => {
      const mockError = new Error('Invalid transaction');
      const mockRpc = vi.fn().mockResolvedValueOnce({
        data: null,
        error: mockError,
      });
      (supabase.rpc as any) = mockRpc;

      await expect(
        tokenService.processTransaction('user-id', 'grant', 100)
      ).rejects.toThrow(mockError);
    });
  });

  describe('purchaseVotePack', () => {
    it('should purchase a vote pack successfully', async () => {
      const mockVotePackId = 'vote-pack-id';
      const mockRpc = vi.fn().mockResolvedValueOnce({
        data: mockVotePackId,
        error: null,
      });
      (supabase.rpc as any) = mockRpc;

      const result = await tokenService.purchaseVotePack(
        'user-id',
        'basic',
        100
      );

      expect(result).toBe(mockVotePackId);
      expect(mockRpc).toHaveBeenCalledWith('purchase_vote_pack', {
        p_user_id: 'user-id',
        p_type: 'basic',
        p_amount: 100,
      });
    });

    it('should throw an error when purchase fails', async () => {
      const mockError = new Error('Insufficient balance');
      const mockRpc = vi.fn().mockResolvedValueOnce({
        data: null,
        error: mockError,
      });
      (supabase.rpc as any) = mockRpc;

      await expect(
        tokenService.purchaseVotePack('user-id', 'basic', 100)
      ).rejects.toThrow(mockError);
    });
  });
}); 