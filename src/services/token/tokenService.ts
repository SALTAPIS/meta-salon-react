import { supabase } from '../../lib/supabase';
import type { Database } from '../../types/supabase';

type TransactionType = Database['public']['Tables']['transactions']['Row']['type'];
type VotePackType = Database['public']['Tables']['vote_packs']['Row']['type'];

type BalanceUpdateCallback = (newBalance: number) => void;

export class TokenService {
  private static instance: TokenService;
  private balanceUpdateCallbacks: BalanceUpdateCallback[] = [];

  private constructor() {}

  public static getInstance(): TokenService {
    if (!TokenService.instance) {
      TokenService.instance = new TokenService();
    }
    return TokenService.instance;
  }

  onBalanceUpdate(callback: BalanceUpdateCallback) {
    this.balanceUpdateCallbacks.push(callback);
    return () => {
      this.balanceUpdateCallbacks = this.balanceUpdateCallbacks.filter(cb => cb !== callback);
    };
  }

  private notifyBalanceUpdate(newBalance: number) {
    this.balanceUpdateCallbacks.forEach(callback => callback(newBalance));
  }

  async getBalance(userId: string): Promise<number> {
    try {
      console.log('Fetching balance for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching balance:', error);
        throw error;
      }

      const balance = data?.balance ?? 0;
      console.log('Balance fetched:', balance);
      this.notifyBalanceUpdate(balance);
      return balance;
    } catch (error) {
      console.error('Unexpected error fetching balance:', error);
      throw error;
    }
  }

  async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  }

  async getUserBalance(userId: string): Promise<number> {
    try {
      console.log('Fetching balance for user:', userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching balance:', error);
        throw error;
      }

      const balance = data?.balance ?? 0;
      console.log('Balance fetched:', balance);
      this.notifyBalanceUpdate(balance);
      return balance;
    } catch (error) {
      console.error('Unexpected error fetching balance:', error);
      throw error;
    }
  }

  async processTransaction(
    userId: string,
    type: TransactionType,
    amount: number,
    description?: string,
    referenceId?: string
  ): Promise<string> {
    const { data, error } = await supabase.rpc('process_transaction', {
      p_user_id: userId,
      p_type: type,
      p_amount: amount,
      p_description: description,
      p_reference_id: referenceId,
    });

    if (error) throw error;
    
    // Update balance after transaction
    await this.getBalance(userId);
    
    return data;
  }

  async purchaseVotePack(
    userId: string,
    type: VotePackType,
    amount: number
  ): Promise<string> {
    try {
      console.log('TokenService: Starting vote pack purchase:', {
        userId,
        type,
        amount,
        timestamp: new Date().toISOString()
      });

      const { data, error } = await supabase.rpc('purchase_vote_pack', {
        p_user_id: userId,
        p_type: type,
        p_amount: amount,
      });

      if (error) {
        console.error('TokenService: Error purchasing vote pack:', {
          error,
          userId,
          type,
          amount,
          errorCode: error.code,
          errorMessage: error.message,
          timestamp: new Date().toISOString()
        });
        throw error;
      }

      console.log('TokenService: Vote pack purchased successfully:', {
        userId,
        type,
        amount,
        transactionId: data,
        timestamp: new Date().toISOString()
      });

      // Update balance after purchase
      await this.getBalance(userId);

      return data;
    } catch (error) {
      console.error('TokenService: Unexpected error purchasing vote pack:', {
        error,
        userId,
        type,
        amount,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
      throw error;
    }
  }

  async getUserTransactions(userId: string, limit = 10): Promise<Database['public']['Tables']['transactions']['Row'][]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  async getUserVotePacks(userId: string): Promise<Database['public']['Tables']['vote_packs']['Row'][]> {
    const { data, error } = await supabase
      .from('vote_packs')
      .select('*')
      .eq('user_id', userId)
      .gt('votes_remaining', 0)
      .order('expires_at', { ascending: true });

    if (error) throw error;
    return data;
  }

  async getActiveVotePack(userId: string): Promise<Database['public']['Tables']['vote_packs']['Row'] | null> {
    const { data, error } = await supabase
      .from('vote_packs')
      .select('*')
      .eq('user_id', userId)
      .gt('votes_remaining', 0)
      .order('expires_at', { ascending: true })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }
} 