import { useEffect, useState, useRef } from 'react';
import { TokenService } from '../../services/token/tokenService';
import { useAuth } from '../auth/useAuth';
import { supabase } from '../../lib/supabase';
import type { Database } from '../../types/supabase';
import { RealtimePostgresChangesPayload } from '@supabase/supabase-js';

type Transaction = Database['public']['Tables']['transactions']['Row'];
type VotePack = Database['public']['Tables']['vote_packs']['Row'];
type Profile = Database['public']['Tables']['profiles']['Row'];

export function useTokens() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [votePacks, setVotePacks] = useState<VotePack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [realtimeStatus, setRealtimeStatus] = useState('disconnected');
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const lastFetchRef = useRef<number>(0);

  const fetchData = async () => {
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
  };

  useEffect(() => {
    if (!user?.id) return;

    // Only set up subscription if we don't already have one
    if (channelRef.current) {
      return;
    }

    console.log('🔌 Setting up realtime subscription:', {
      userId: user.id,
      currentStatus: realtimeStatus
    });

    // Create new subscription
    const channel = supabase
      .channel(`token-updates-${user.id}`)
      .on<Profile>(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload: RealtimePostgresChangesPayload<Profile>) => {
          console.log('👤 Profile change detected:', {
            event: payload.eventType,
            oldBalance: balance,
            newBalance: (payload.new as Profile)?.balance,
            timestamp: new Date().toISOString()
          });
          
          const newProfile = payload.new as Profile;
          if (newProfile?.balance !== undefined) {
            const newBalance = newProfile.balance;
            console.log('💰 Setting balance from realtime:', {
              oldBalance: balance,
              newBalance,
              source: 'realtime'
            });
            setBalance(newBalance);
          }
        }
      );

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
        setRealtimeStatus('disconnected');
      } else {
        setRealtimeStatus(status.toLowerCase());
      }
    });

    // Initial data fetch
    fetchData();

    // Cleanup function
    return () => {
      if (channelRef.current) {
        console.log('🔌 Cleaning up subscription:', { userId: user.id });
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
        setRealtimeStatus('disconnected');
      }
    };
  }, [user?.id]); // Only depend on user ID changes

  return {
    balance,
    transactions,
    votePacks,
    isLoading,
    realtimeStatus,
  };
}
