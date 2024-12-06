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
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clean up function for channel
  const cleanupChannel = useCallback(() => {
    const currentChannel = channelRef.current;
    if (!currentChannel) return;

    // Clear the ref immediately to prevent recursive cleanup
    channelRef.current = null;

    // Clear any pending reconnect timeout
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Remove the channel
    supabase.removeChannel(currentChannel).catch(console.error);
    setRealtimeStatus('disconnected');
  }, []);

  // Fetch data function
  const fetchData = useCallback(async () => {
    if (!user?.id) return;
    
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

      if (userProfile?.balance !== undefined) {
        setBalance(userProfile.balance);
      }
      setTransactions(userTransactions);
      setVotePacks(userVotePacks);
    } catch (error) {
      console.error('Error fetching token data:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Set up real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    // Clean up any existing subscription
    cleanupChannel();

    // Create new subscription
    const channel = supabase
      .channel(`token-updates-${user.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'profiles',
        filter: `id=eq.${user.id}`,
      }, (payload) => {
        const newProfile = payload.new as Profile;
        if (newProfile?.balance !== undefined) {
          setBalance(newProfile.balance);
          fetchData(); // Refresh related data when balance changes
        }
      });

    // Store channel reference
    channelRef.current = channel;

    // Subscribe and handle connection status
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        setRealtimeStatus('connected');
        fetchData(); // Initial data fetch on subscription
      } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
        setRealtimeStatus('disconnected');
        
        // Attempt to reconnect after a brief delay
        if (!reconnectTimeoutRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            setRealtimeStatus('reconnecting');
          }, 1000);
        }
      } else {
        setRealtimeStatus(status.toLowerCase());
      }
    });

    // Cleanup function
    return cleanupChannel;
  }, [user?.id, cleanupChannel, fetchData]);

  // Initial data fetch
  useEffect(() => {
    if (!user?.id) return;
    fetchData();
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
