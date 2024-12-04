import { useEffect } from 'react';
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

  const { data: balance = 0, isLoading: isBalanceLoading } = useQuery({
    queryKey: ['balance', user?.id],
    queryFn: () => user?.id ? tokenService.getUserBalance(user.id) : Promise.resolve(0),
    enabled: !!user?.id,
  });

  useEffect(() => {
    if (!user?.id) return;

    console.log('Setting up real-time subscription for user:', user.id);
    toast({
      title: 'Real-time Updates',
      description: 'Setting up balance tracking...',
      status: 'info',
      duration: 3000,
      isClosable: true,
    });

    // Subscribe to real-time changes
    const subscription = supabase
      .channel('profile-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`,
        },
        (payload: RealtimePostgresChangesPayload<Profile>) => {
          console.log('Real-time update received:', payload);
          console.log('Previous balance:', balance);
          const newBalance = (payload.new as Profile)?.balance;
          console.log('New balance:', newBalance);
          
          // Show toast for balance change
          if (newBalance !== undefined && newBalance !== balance) {
            const difference = newBalance - balance;
            toast({
              title: 'Balance Updated',
              description: `${difference > 0 ? '+' : ''}${difference} tokens`,
              status: difference > 0 ? 'success' : 'info',
              duration: 5000,
              isClosable: true,
            });
          }
          
          // Invalidate the balance query to trigger a refresh
          queryClient.invalidateQueries({ queryKey: ['balance', user.id] });
        }
      )
      .subscribe((status) => {
        console.log('Subscription status:', status);
        if (status === 'SUBSCRIBED') {
          toast({
            title: 'Real-time Ready',
            description: 'Balance tracking is now active',
            status: 'success',
            duration: 3000,
            isClosable: true,
          });
        }
      });

    // Test the subscription
    console.log('Subscription object:', subscription);

    return () => {
      console.log('Cleaning up real-time subscription');
      subscription.unsubscribe();
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
  };
} 