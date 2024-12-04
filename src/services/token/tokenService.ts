import { supabase } from '../../lib/supabase';
import type { Database } from '../../types/supabase';

type TransactionType = Database['public']['Tables']['transactions']['Row']['type'];
type VotePackType = Database['public']['Tables']['vote_packs']['Row']['type'];

export class TokenService {
  private static instance: TokenService;

  protected constructor() {}

  public static getInstance(): TokenService {
    if (!TokenService.instance) {
      TokenService.instance = new TokenService();
    }
    return TokenService.instance;
  }

  async getUserBalance(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from('profiles')
      .select('balance')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data?.balance ?? 0;
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
    return data;
  }

  async purchaseVotePack(
    userId: string,
    type: VotePackType,
    amount: number
  ): Promise<string> {
    const { data, error } = await supabase.rpc('purchase_vote_pack', {
      p_user_id: userId,
      p_type: type,
      p_amount: amount,
    });

    if (error) throw error;
    return data;
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