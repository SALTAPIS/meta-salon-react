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
  const [balance, setBalance] = useState(user?.balance || 0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [votePacks, setVotePacks] = useState<VotePack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [realtimeStatus, setRealtimeStatus] = useState('disconnected');
  const channelRef = useRef<RealtimeChannel | null>(null);
  const lastFetchRef = useRef<number>(0);
  const mountedRef = useRef(true);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch data function with retry logic
  const fetchData = useCallback(async (retryCount = 0) => {
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

      if (mountedRef.current) {
        if (userProfile?.balance !== undefined) {
          console.log('Setting new balance:', userProfile.balance);
          setBalance(userProfile.balance);
        }
        setTransactions(userTransactions);
        setVotePacks(userVotePacks);
      }
    } catch (error) {
      console.error('Error fetching token data:', error);
      if (retryCount < 3 && mountedRef.current) {
        const delay = Math.pow(2, retryCount) * 1000;
        setTimeout(() => fetchData(retryCount + 1), delay);
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [user?.id]);

  // Set up real-time subscription with reconnection logic
  useEffect(() => {
    if (!user?.id) return;
    
    mountedRef.current = true;
    let subscriptionActive = true;

    const setupSubscription = () => {
      if (!subscriptionActive || !mountedRef.current) return;

      // Clear any existing reconnection timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      // Clean up existing subscription if any
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      console.log('Setting up real-time subscription for user:', user.id);

      const channel = supabase.channel(`profile-changes-${user.id}`, {
        config: {
          broadcast: { self: true },
          presence: { key: user.id },
        },
      })
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
            }
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user.id}`,
        },
        async () => {
          console.log('Transaction change detected');
          if (!subscriptionActive || !mountedRef.current) return;
          await fetchData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'vote_packs',
          filter: `user_id=eq.${user.id}`,
        },
        async () => {
          console.log('Vote pack change detected');
          if (!subscriptionActive || !mountedRef.current) return;
          await fetchData();
        }
      );

      channel.subscribe(async (status) => {
        if (!subscriptionActive || !mountedRef.current) return;
        console.log('Subscription status:', status);
        
        if (status === 'SUBSCRIBED') {
          setRealtimeStatus('connected');
          await fetchData();
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setRealtimeStatus('disconnected');
          // Only attempt reconnection if we're still mounted and active
          if (subscriptionActive && mountedRef.current && !reconnectTimeoutRef.current) {
            reconnectTimeoutRef.current = setTimeout(() => {
              if (subscriptionActive && mountedRef.current) {
                setupSubscription();
              }
            }, 5000); // Fixed 5-second delay for reconnection
          }
        } else {
          setRealtimeStatus(status.toLowerCase());
        }
      });

      channelRef.current = channel;
    };

    setupSubscription();

    // Cleanup function
    return () => {
      console.log('Cleaning up subscription effect');
      subscriptionActive = false;
      mountedRef.current = false;
      
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      
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
  };
}
