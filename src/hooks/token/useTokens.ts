import { useEffect, useState, useRef, useCallback } from 'react';
import { TokenService } from '../../services/token/tokenService';
import { useAuth } from '../auth/useAuth';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../types/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Transaction = Database['public']['Tables']['transactions']['Row'];
type VotePack = Database['public']['Tables']['vote_packs']['Row'];
type ChannelState = 'SUBSCRIBED' | 'TIMED_OUT' | 'CLOSED' | 'CHANNEL_ERROR' | 'JOINED' | 'JOINING';

export function useTokens() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [votePacks, setVotePacks] = useState<VotePack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [realtimeStatus, setRealtimeStatus] = useState('disconnected');
  const channelRef = useRef<RealtimeChannel | null>(null);
  const lastFetchRef = useRef<number>(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const mountedRef = useRef(true);
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000;

  // Clean up function for channel
  const cleanupChannel = useCallback(async () => {
    const currentChannel = channelRef.current;
    if (!currentChannel) return;

    console.log('Cleaning up channel subscription');
    
    // Clear any pending reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    try {
      // Unsubscribe first
      await currentChannel.unsubscribe();
      
      // Then remove the channel
      await supabase.removeChannel(currentChannel);
    } catch (error) {
      console.error('Error during channel cleanup:', error);
    } finally {
      channelRef.current = null;
      retryCountRef.current = 0;
      if (mountedRef.current) {
        setRealtimeStatus('disconnected');
      }
    }
  }, []);

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
    
    const setupChannel = async () => {
      if (!subscriptionActive) return;
      
      // Clean up any existing subscription
      await cleanupChannel();
      
      if (!subscriptionActive) return;

      console.log('Setting up real-time subscription for user:', user.id);

      // Create new subscription
      const channel = supabase
        .channel(`token-updates-${user.id}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        }, (payload) => {
          if (!subscriptionActive || !mountedRef.current) return;
          
          console.log('Received real-time update:', payload);
          const newProfile = payload.new as Profile;
          if (newProfile?.balance !== undefined) {
            console.log('Updating balance to:', newProfile.balance);
            setBalance(newProfile.balance);
            fetchData();
          }
        });

      channelRef.current = channel;

      const handleSubscription = async () => {
        try {
          const result = await channel.subscribe();
          const channelState = (result.state as unknown) as ChannelState;
          
          if (!subscriptionActive || !mountedRef.current) {
            await cleanupChannel();
            return;
          }

          console.log('Initial subscription status:', channelState);
          
          switch (channelState) {
            case 'SUBSCRIBED':
              setRealtimeStatus('connected');
              retryCountRef.current = 0;
              await fetchData();
              break;
            case 'JOINING':
              setRealtimeStatus('connecting');
              break;
            case 'JOINED':
              setRealtimeStatus('connected');
              retryCountRef.current = 0;
              await fetchData();
              break;
            case 'CLOSED':
            case 'CHANNEL_ERROR':
            case 'TIMED_OUT':
              console.warn(`Subscription ${channelState}, attempt ${retryCountRef.current + 1}/${MAX_RETRIES}`);
              if (retryCountRef.current < MAX_RETRIES && subscriptionActive) {
                retryCountRef.current++;
                setRealtimeStatus('reconnecting');
                // Schedule retry
                reconnectTimeoutRef.current = setTimeout(() => {
                  if (subscriptionActive && mountedRef.current) {
                    handleSubscription();
                  }
                }, RETRY_DELAY);
              } else {
                setRealtimeStatus('error');
                console.error('Max retries reached or subscription inactive');
              }
              break;
            default:
              setRealtimeStatus('unknown');
          }
        } catch (error) {
          console.error('Error during channel setup:', error);
          if (subscriptionActive && mountedRef.current) {
            setRealtimeStatus('error');
          }
        }
      };

      await handleSubscription();
    };

    setupChannel();

    // Cleanup function
    return () => {
      console.log('Cleaning up subscription effect');
      subscriptionActive = false;
      mountedRef.current = false;
      cleanupChannel();
    };
  }, [user?.id, cleanupChannel, fetchData]);

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
