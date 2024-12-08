import { useEffect, useState } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { TokenService } from '../../services/token/tokenService';
import type { Database } from '../../types/supabase';

type VotePack = Database['public']['Tables']['vote_packs']['Row'];

export function VotePacks() {
  const { user } = useAuth();
  const [packs, setPacks] = useState<VotePack[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const tokenService = TokenService.getInstance();

  useEffect(() => {
    if (!user) {
      setPacks([]);
      setIsLoading(false);
      return;
    }

    async function loadPacks() {
      try {
        const userPacks = await tokenService.getUserVotePacks(user.id);
        console.log('VotePacks: Loaded packs:', userPacks);
        setPacks(userPacks);
      } catch (error) {
        console.error('VotePacks: Error loading packs:', error);
      } finally {
        setIsLoading(false);
      }
    }

    loadPacks();
  }, [user]);

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Your Vote Packs</h3>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (packs.length === 0) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">Your Vote Packs</h3>
        <p className="text-gray-500">No active vote packs</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Your Vote Packs</h3>
      <div className="space-y-4">
        {packs.map((pack) => (
          <div
            key={pack.id}
            className="p-3 border border-gray-200 rounded-md hover:border-blue-500 transition-colors"
          >
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium capitalize">{pack.type} Pack</h4>
                <p className="text-sm text-gray-600">
                  {pack.votes_remaining} votes remaining
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500">
                  Expires: {new Date(pack.expires_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 