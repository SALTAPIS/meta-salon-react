import { supabase } from '../../lib/supabase';
import type { VotePack } from '../../types/database.types';

export class TokenService {
  private static instance: TokenService;

  private constructor() {}

  public static getInstance(): TokenService {
    if (!TokenService.instance) {
      TokenService.instance = new TokenService();
    }
    return TokenService.instance;
  }

  static async getBalance(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from('profiles')
      .select('balance')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data?.balance || 0;
  }

  static async getVotePacks(userId: string): Promise<VotePack[]> {
    const { data, error } = await supabase
      .from('vote_packs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async purchaseVotePack(userId: string, votes: number): Promise<VotePack> {
    const { data, error } = await supabase
      .rpc('purchase_vote_pack', {
        p_user_id: userId,
        p_votes: votes
      });

    if (error) throw error;
    return data;
  }

  static async getActiveVotePack(userId: string): Promise<VotePack | null> {
    const { data, error } = await supabase
      .from('vote_packs')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  }

  static async getUserTransactions(userId: string, limit = 10) {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data || [];
  }
} 