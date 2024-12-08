import { useEffect, useState, useRef, useCallback } from 'react';
import { TokenService } from '../../services/token/tokenService';
import { useAuth } from '../auth/useAuth';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../types/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Transaction = Database['public']['Tables']['transactions']['Row'];
type VotePack = Database['public']['Tables']['vote_packs']['Row'];

const CHANNEL_NAME = 'token-updates';
const MAX_RETRY_COUNT = 5;
const INITIAL_RETRY_DELAY = 1000;
const MAX_RETRY_DELAY = 16000;

// Helper to manage balance persistence
const getStoredBalance = (userId: string): number | null => {
  const stored = localStorage.getItem(`balance_${userId}`);
  return stored ? parseInt(stored, 10) : null;
};

const setStoredBalance = (userId: string, balance: number) => {
  localStorage.setItem(`balance_${userId}`, balance.toString());
};

export function useTokens() {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number>(() => {
    return user?.id ? (getStoredBalance(user.id) ?? user?.balance ?? 0) : 0;
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [votePacks, setVotePacks] = useState<VotePack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [realtimeStatus, setRealtimeStatus] = useState('disconnected');
  const channelRef = useRef<RealtimeChannel | null>(null);
  const lastFetchRef = useRef<number>(0);
  const mountedRef = useRef(true);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Update balance with persistence
  const updateBalance = useCallback((newBalance: number) => {
    if (!user?.id || !mountedRef.current) return;
    console.log('Setting new balance:', newBalance);
    setBalance(newBalance);
    setStoredBalance(user.id, newBalance);
  }, [user?.id]);

  // Fetch data function with debouncing
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

      if (mountedRef.current) {
        if (userProfile?.balance !== undefined) {
          updateBalance(userProfile.balance);
        }
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
  }, [user?.id, updateBalance]);

  // Set up real-time subscription with exponential backoff
  useEffect(() => {
    if (!user?.id) return;

    mountedRef.current = true;
    let subscriptionActive = true;

    const setupChannel = () => {
      if (!subscriptionActive || !mountedRef.current) return;

      // Clear any existing retry timeout
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }

      // Clean up existing channel if any
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }

      console.log('Setting up real-time subscription for user:', user.id);

      const channel = supabase.channel(CHANNEL_NAME, {
        config: {
          broadcast: { self: true },
          presence: { key: user.id },
        },
      });

      // Add all listeners before subscribing
      channel
        .on('presence', { event: 'sync' }, () => {
          console.log('Presence state synchronized');
        })
        .on('presence', { event: 'join' }, ({ key }) => {
          console.log('User joined:', key);
        })
        .on('presence', { event: 'leave' }, ({ key }) => {
          console.log('User left:', key);
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
                updateBalance(newProfile.balance);
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

      // Subscribe to the channel with exponential backoff retry
      channel.subscribe(async (status) => {
        if (!subscriptionActive || !mountedRef.current) return;
        console.log('Subscription status:', status);

        if (status === 'SUBSCRIBED') {
          retryCountRef.current = 0;
          setRealtimeStatus('connected');
          // Track presence
          const presenceTrackStatus = await channel.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
          });
          console.log('Presence track status:', presenceTrackStatus);
          await fetchData();
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          setRealtimeStatus('disconnected');
          
          // Only attempt to reconnect if we're still mounted, active, and haven't exceeded max retries
          if (subscriptionActive && mountedRef.current && retryCountRef.current < MAX_RETRY_COUNT) {
            console.log(`Attempting to reconnect (attempt ${retryCountRef.current + 1}/${MAX_RETRY_COUNT})...`);
            
            // Calculate delay with exponential backoff
            const delay = Math.min(
              INITIAL_RETRY_DELAY * Math.pow(2, retryCountRef.current),
              MAX_RETRY_DELAY
            );
            
            retryCountRef.current++;
            retryTimeoutRef.current = setTimeout(setupChannel, delay);
          } else if (retryCountRef.current >= MAX_RETRY_COUNT) {
            console.log('Max retry attempts reached. Stopping reconnection attempts.');
            setRealtimeStatus('max_retries_reached');
          }
        } else {
          setRealtimeStatus(status.toLowerCase());
        }
      });

      channelRef.current = channel;
    };

    setupChannel();

    // Cleanup function
    return () => {
      console.log('Cleaning up subscription effect');
      subscriptionActive = false;
      mountedRef.current = false;

      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }

      if (channelRef.current) {
        console.log('Removing channel');
        channelRef.current.untrack();
        channelRef.current.unsubscribe();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id, fetchData, updateBalance]);

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
