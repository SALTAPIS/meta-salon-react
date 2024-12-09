import { supabase } from '../../lib/supabase';
import type { VotePack } from '../../types/database.types';

export class TokenService {
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
        p_votes: votes
      });

    if (error) throw error;
    return data;
  }
} 