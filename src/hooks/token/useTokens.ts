import { useEffect, useState } from 'react';
import { TokenService } from '../../services/token/tokenService';
import { useAuth } from '../auth/useAuth';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../types/supabase';

type Transaction = Database['public']['Tables']['transactions']['Row'];
type VotePack = Database['public']['Tables']['vote_packs']['Row'];

export function useTokens() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [votePacks, setVotePacks] = useState<VotePack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [realtimeStatus, setRealtimeStatus] = useState('disconnected');

  const fetchData = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const tokenService = TokenService.getInstance();
      const [userProfile, userTransactions, userVotePacks] = await Promise.all([
        tokenService.getUserProfile(user.id),
        tokenService.getUserTransactions(user.id),
        tokenService.getUserVotePacks(user.id),
      ]);

      console.log('Fetched user data:', {
        balance: userProfile?.balance,
        transactionCount: userTransactions.length,
        votePackCount: userVotePacks.length
      });

      setBalance(userProfile?.balance || 0);
      setTransactions(userTransactions);
      setVotePacks(userVotePacks);
    } catch (error) {
      console.error('Error fetching token data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    // Set up realtime subscription
    const channel = supabase
      .channel('token-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user?.id}`,
        },
        (payload) => {
          console.log('Profile changed:', payload);
          if (payload.new && 'balance' in payload.new) {
            console.log('Updating balance:', payload.new.balance);
            setBalance(payload.new.balance);
          }
          fetchData(); // Fetch all data to ensure consistency
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user?.id}`,
        },
        (payload) => {
          console.log('Transaction changed:', payload);
          fetchData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vote_packs',
          filter: `user_id=eq.${user?.id}`,
        },
        (payload) => {
          console.log('Vote packs changed:', payload);
          fetchData();
        }
      );

    // Subscribe and handle connection status
    channel.subscribe(async (status) => {
      console.log('Realtime subscription status:', status);
      if (status === 'SUBSCRIBED') {
        setRealtimeStatus('connected');
        await fetchData(); // Fetch initial data when connected
      } else {
        setRealtimeStatus(status.toLowerCase());
      }
    });

    return () => {
      console.log('Cleaning up realtime subscription');
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return {
    balance,
    transactions,
    votePacks,
    isLoading,
    realtimeStatus,
  };
}
