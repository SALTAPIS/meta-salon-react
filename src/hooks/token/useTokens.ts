import { useEffect, useState, useRef, useCallback } from 'react';
import { TokenService } from '../../services/token/tokenService';
import { useAuth } from '../auth/useAuth';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../types/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Transaction = Database['public']['Tables']['transactions']['Row'];
type VotePack = Database['public']['Tables']['vote_packs']['Row'];

export function useTokens() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [votePacks, setVotePacks] = useState<VotePack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [realtimeStatus, setRealtimeStatus] = useState('disconnected');
  const channelRef = useRef<RealtimeChannel | null>(null);
  const lastFetchRef = useRef<number>(0);
  const mountedRef = useRef(true);

  // Fetch data function
  const fetchData = useCallback(async () => {
    if (!user?.id || !mountedRef.current) return;
    
    const now = Date.now();
    if (now - lastFetchRef.current < 1000) return;
    lastFetchRef.current = now;

    setIsLoading(true);
    try {
      const tokenService = TokenService.getInstance();
      const [userProfile, userTransactions, userVotePacks] = await Promise.all([
        tokenService.getUserProfile(user.id),
        tokenService.getUserTransactions(user.id),
        tokenService.getUserVotePacks(user.id),
      ]);

      if (userProfile?.balance !== undefined && mountedRef.current) {
        setBalance(userProfile.balance);
      }
      if (mountedRef.current) {
        setTransactions(userTransactions);
        setVotePacks(userVotePacks);
      }
    } catch (error) {
      console.error('Error fetching token data:', error);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [user?.id]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user?.id) return;
    
    mountedRef.current = true;
    let subscriptionActive = true;

    console.log('Setting up real-time subscription for user:', user.id);

    // Create new subscription
    const channel = supabase.channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        async (payload) => {
          console.log('Profile change received:', payload);
          if (!subscriptionActive || !mountedRef.current) return;

          if (payload.eventType === 'UPDATE') {
            const newProfile = payload.new as Profile;
            if (newProfile?.balance !== undefined) {
              console.log('Updating balance to:', newProfile.balance);
              setBalance(newProfile.balance);
              await fetchData();
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user.id}`,
        },
        async () => {
          console.log('New transaction detected');
          if (!subscriptionActive || !mountedRef.current) return;
          await fetchData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'vote_packs',
          filter: `user_id=eq.${user.id}`,
        },
        async () => {
          console.log('New vote pack detected');
          if (!subscriptionActive || !mountedRef.current) return;
          await fetchData();
        }
      )
      .subscribe((status) => {
        if (!subscriptionActive || !mountedRef.current) return;
        console.log('Subscription status:', status);
        
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus('connected');
          fetchData();
        } else {
          setRealtimeStatus(status.toLowerCase());
        }
      });

    channelRef.current = channel;

    // Cleanup function
    return () => {
      console.log('Cleaning up subscription effect');
      subscriptionActive = false;
      mountedRef.current = false;
      
      if (channelRef.current) {
        console.log('Removing channel');
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id, fetchData]);

  // Initial data fetch
  useEffect(() => {
    if (!user?.id) return;
    fetchData();
    return () => {
      mountedRef.current = false;
    };
  }, [user?.id, fetchData]);

  return {
    balance,
    transactions,
    votePacks,
    isLoading,
    realtimeStatus,
    fetchData,
    setBalance,
  };
}
