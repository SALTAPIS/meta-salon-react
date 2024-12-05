import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { TokenService } from '../../services/token/tokenService';
import { useAuth } from '../auth/useAuth';
import { supabase } from '../../lib/supabase';
import { useToast } from '@chakra-ui/react';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import type { Database } from '../../types/supabase';

type Profile = Database['public']['Tables']['profiles']['Row'];

export function useTokens() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const tokenService = TokenService.getInstance();
  const toast = useToast();
  const [realtimeStatus, setRealtimeStatus] = useState<string>('initializing');

  // Debug info toast
  useEffect(() => {
    if (user?.id) {
      toast({
        title: 'Debug Info',
        description: `User ID: ${user.id.slice(0, 8)}..., RT Status: ${realtimeStatus}`,
        status: 'info',
        duration: 5000,
        isClosable: true,
        position: 'bottom-right',
      });
    }
  }, [user?.id, realtimeStatus]);

  const { data: balance = 0, isLoading: isBalanceLoading } = useQuery({
    queryKey: ['balance', user?.id],
    queryFn: async () => {
      if (!user?.id) return 0;
      try {
        const result = await tokenService.getUserBalance(user.id);
        toast({
          title: 'Balance Fetched',
          description: `Current balance: ${result}`,
          status: 'info',
          duration: 3000,
          isClosable: true,
          position: 'bottom-left',
        });
        return result;
      } catch (error) {
        toast({
          title: 'Error Fetching Balance',
          description: error instanceof Error ? error.message : 'Unknown error',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        throw error;
      }
    },
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (!user?.id) return;

    setRealtimeStatus('connecting');
    toast({
      title: 'WebSocket Connection',
      description: 'Initializing real-time connection...',
      status: 'info',
      duration: 3000,
      isClosable: true,
      position: 'top-right',
    });

    // Create channel with debug logging
    const channel = supabase.channel('profile-changes', {
      config: {
        broadcast: { self: true },
        presence: { key: user.id },
      },
    });

    // Add channel state change handler
    channel.on('system', { event: '*' }, (payload) => {
      toast({
        title: 'WebSocket System Event',
        description: `Event: ${payload.event}, Timestamp: ${new Date().toISOString()}`,
        status: 'info',
        duration: 3000,
        isClosable: true,
        position: 'bottom-right',
      });
    });

    // Subscribe to real-time changes
    const subscription = channel
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload: RealtimePostgresChangesPayload<Profile>) => {
          setRealtimeStatus('update-received');
          const newBalance = (payload.new as Profile)?.balance;
          
          toast({
            title: 'Real-time Event Received',
            description: `Type: ${payload.eventType}, Table: ${payload.table}`,
            status: 'info',
            duration: 3000,
            isClosable: true,
            position: 'top-right',
          });
          
          // Show toast for balance change
          if (newBalance !== undefined && newBalance !== balance) {
            const difference = newBalance - balance;
            toast({
              title: 'Balance Updated',
              description: `${difference > 0 ? '+' : ''}${difference} tokens (RT)`,
              status: difference > 0 ? 'success' : 'info',
              duration: 5000,
              isClosable: true,
              position: 'top-right',
            });
          }
          
          // Invalidate the balance query to trigger a refresh
          queryClient.invalidateQueries({ queryKey: ['balance', user.id] });
        }
      )
      .subscribe((status) => {
        setRealtimeStatus(status);
        toast({
          title: 'WebSocket Status',
          description: `Connection status: ${status}`,
          status: status === 'SUBSCRIBED' ? 'success' : 'info',
          duration: 3000,
          isClosable: true,
          position: 'bottom-right',
        });
      });

    return () => {
      setRealtimeStatus('disconnecting');
      subscription.unsubscribe();
      toast({
        title: 'WebSocket Cleanup',
        description: 'Cleaning up real-time connection',
        status: 'info',
        duration: 3000,
        isClosable: true,
        position: 'bottom-right',
      });
    };
  }, [user?.id, queryClient, balance, toast]);

  const { data: transactions = [], isLoading: isTransactionsLoading } = useQuery({
    queryKey: ['transactions', user?.id],
    queryFn: () => user?.id ? tokenService.getUserTransactions(user.id) : Promise.resolve([]),
    enabled: !!user?.id,
  });

  const { data: votePacks = [], isLoading: isVotePacksLoading } = useQuery({
    queryKey: ['votePacks', user?.id],
    queryFn: () => user?.id ? tokenService.getUserVotePacks(user.id) : Promise.resolve([]),
    enabled: !!user?.id,
  });

  return {
    balance,
    transactions,
    votePacks,
    isLoading: isBalanceLoading || isTransactionsLoading || isVotePacksLoading,
    realtimeStatus,
  };
} 