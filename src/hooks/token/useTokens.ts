import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../components/auth/AuthProvider';
import type { Database } from '../../types/supabase';

type Transaction = Database['public']['Tables']['transactions']['Row'];
type VotePack = Database['public']['Tables']['vote_packs']['Row'];

export function useTokens() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [votePacks, setVotePacks] = useState<VotePack[]>([]);

  useEffect(() => {
    if (!user) return;

    // Load transactions
    const loadTransactions = async () => {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error loading transactions:', error);
        return;
      }

      setTransactions(data);
    };

    // Load vote packs
    const loadVotePacks = async () => {
      const { data, error } = await supabase
        .from('vote_packs')
        .select('*')
        .eq('user_id', user.id)
        .gt('votes_remaining', 0)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading vote packs:', error);
        return;
      }

      setVotePacks(data);
    };

    loadTransactions();
    loadVotePacks();

    // Subscribe to transaction changes
    const transactionSubscription = supabase
      .channel('transactions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadTransactions();
        }
      )
      .subscribe();

    // Subscribe to vote pack changes
    const votePackSubscription = supabase
      .channel('vote_packs')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vote_packs',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          loadVotePacks();
        }
      )
      .subscribe();

    return () => {
      transactionSubscription.unsubscribe();
      votePackSubscription.unsubscribe();
    };
  }, [user]);

  const purchaseVotePack = async (type: string, amount: number) => {
    if (!user) throw new Error('User not authenticated');

    const { error } = await supabase.rpc('purchase_vote_pack', {
      p_user_id: user.id,
      p_type: type,
      p_amount: amount,
    });

    if (error) throw error;
  };

  return {
    transactions,
    votePacks,
    purchaseVotePack,
  };
} 