import { supabase } from '../lib/supabaseClient';
import { getSession } from '../utils/session';
import { handleError } from '../utils/errors';

export interface VotePack {
  id: string;
  user_id: string;
  votes_remaining: number;
  vote_power: number;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export class VotePackService {
  /**
   * Refresh the vote packs data for the current user
   */
  static async refreshVotePacks(): Promise<VotePack[]> {
    try {
      const session = await getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const { data: votePacks, error } = await supabase
        .from('vote_packs')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to refresh vote packs:', error);
        throw error;
      }

      console.log('Vote packs refreshed:', {
        count: votePacks?.length,
        user_id: session.user.id
      });

      return votePacks || [];
    } catch (err) {
      const error = err as Error;
      console.error('Error refreshing vote packs:', error);
      throw handleError(error, 'Failed to refresh vote packs');
    }
  }

  /**
   * Get active vote packs for the current user
   */
  static async getActiveVotePacks(): Promise<VotePack[]> {
    try {
      const session = await getSession();
      if (!session) {
        throw new Error('Not authenticated');
      }

      const { data: votePacks, error } = await supabase
        .from('vote_packs')
        .select('*')
        .eq('user_id', session.user.id)
        .gt('votes_remaining', 0)
        .or('expires_at.is.null,expires_at.gt.now()')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to get active vote packs:', error);
        throw error;
      }

      return votePacks || [];
    } catch (err) {
      const error = err as Error;
      console.error('Error getting active vote packs:', error);
      throw handleError(error, 'Failed to get active vote packs');
    }
  }
} 