import { create } from 'zustand';
import { ArtworkService } from '../services/ArtworkService';

interface VotingState {
  artworks: Array<{ id: string; image_url: string }>;
  isLoading: boolean;
  error: Error | null;
  fetchArtworks: () => Promise<void>;
}

export const useVotingStore = create<VotingState>()((set) => ({
  artworks: [],
  isLoading: false,
  error: null,
  fetchArtworks: async () => {
    set((state) => ({ ...state, isLoading: true }));
    try {
      const artworks = await ArtworkService.getAllArtworks();
      set((state) => ({ ...state, artworks, isLoading: false }));
    } catch (error) {
      set((state) => ({ ...state, error: error as Error, isLoading: false }));
    }
  },
})); 