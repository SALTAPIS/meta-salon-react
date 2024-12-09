import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabaseClient';
import type { Challenge } from '../types/database.types';

async function fetchChallenges(): Promise<Challenge[]> {
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export function useChallenges() {
  const { data: challenges, isLoading, error } = useQuery({
    queryKey: ['challenges'],
    queryFn: fetchChallenges,
  });

  return {
    challenges,
    isLoading,
    error,
  };
} 