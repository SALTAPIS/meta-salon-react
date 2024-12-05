import { useEffect, useState, useRef, useCallback } from 'react';
import { TokenService } from '../../services/token/tokenService';
import { useAuth } from '../auth/useAuth';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../types/supabase';

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
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const lastFetchRef = useRef<number>(0);

  const fetchData = useCallback(async () => {
    if (!user?.id) return;

    // Debounce fetches to prevent hammering the API
    const now = Date.now();
    if (now - lastFetchRef.current < 1000) {
      return;
    }
    lastFetchRef.current = now;

    setIsLoading(true);
    try {
      const tokenService = TokenService.getInstance();
      const [userProfile, userTransactions, userVotePacks] = await Promise.all([
        tokenService.getUserProfile(user.id),
        tokenService.getUserTransactions(user.id),
        tokenService.getUserVotePacks(user.id),
      ]);

      console.log('💰 Balance update:', {
        oldBalance: balance,
        newBalance: userProfile?.balance,
        source: 'fetchData'
      });

      setBalance(userProfile?.balance || 0);
      setTransactions(userTransactions);
      setVotePacks(userVotePacks);
    } catch (error) {
      console.error('Error fetching token data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, balance]);

  // Function to manually update balance
  const updateBalance = useCallback((newBalance: number) => {
    console.log('💰 Manual balance update:', {
      oldBalance: balance,
      newBalance,
      source: 'manual'
    });
    setBalance(newBalance);
  }, [balance]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    // Clean up any existing subscription
    if (channelRef.current) {
      console.log('🔌 Cleaning up existing subscription:', {
        userId: user.id,
        currentStatus: realtimeStatus
      });
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    console.log('🔌 Setting up realtime subscription:', {
      userId: user.id,
      currentStatus: realtimeStatus
    });

    // Create new subscription
    const channel = supabase
      .channel(`token-updates-${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${user.id}`,
      }, (payload) => {
        console.log('👤 Profile change detected:', {
          event: payload.eventType,
          oldRecord: payload.old,
          newRecord: payload.new,
          oldBalance: balance,
          newBalance: (payload.new as Profile)?.balance,
          timestamp: new Date().toISOString()
        });
        
        const newProfile = payload.new as Profile;
        if (newProfile?.balance !== undefined && newProfile.balance !== balance) {
          console.log('💰 Setting balance from realtime:', {
            oldBalance: balance,
            newBalance: newProfile.balance,
            source: 'realtime',
            timestamp: new Date().toISOString()
          });
          setBalance(newProfile.balance);
          fetchData(); // Refresh related data
        }
      });

    // Store channel reference
    channelRef.current = channel;

    // Subscribe and handle connection status
    channel.subscribe(async (status) => {
      console.log('🔌 Realtime status change:', {
        oldStatus: realtimeStatus,
        newStatus: status,
        timestamp: new Date().toISOString()
      });

      if (status === 'SUBSCRIBED') {
        setRealtimeStatus('connected');
        await fetchData();
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        console.log('🔌 Channel closed or error:', {
          status,
          timestamp: new Date().toISOString()
        });
        setRealtimeStatus('disconnected');
        
        // Attempt to reconnect after a brief delay
        setTimeout(() => {
          if (channelRef.current === channel) {
            console.log('🔄 Attempting to reconnect...', {
              timestamp: new Date().toISOString()
            });
            channel.subscribe();
          }
        }, 1000);
      } else {
        setRealtimeStatus(status.toLowerCase());
      }
    });

    // Initial data fetch
    fetchData();

    // Cleanup function
    return () => {
      if (channelRef.current) {
        console.log('🔌 Cleaning up subscription:', {
          userId: user.id,
          timestamp: new Date().toISOString()
        });
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        setRealtimeStatus('disconnected');
      }
    };
  }, [user?.id, balance, fetchData]); // Add balance and fetchData to dependencies

  return {
    balance,
    transactions,
    votePacks,
    isLoading,
    realtimeStatus,
    updateBalance, // Expose the manual update function
    fetchData, // Expose the fetch function
  };
}
