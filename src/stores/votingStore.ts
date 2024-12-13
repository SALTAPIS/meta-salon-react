import { create } from 'zustand';
import { ArtworkService } from '../services/ArtworkService';

interface VotingStore {
  artworks: Array<{ id: string; image_url: string }>;
  isLoading: boolean;
  error: Error | null;
  fetchArtworks: () => Promise<void>;
}

export const useVotingStore = create<VotingStore>()((set) => ({
  artworks: [],
  isLoading: false,
  error: null,
  fetchArtworks: async () => {
    set({ isLoading: true });
    try {
      const artworks = await ArtworkService.getAllArtworks();
      set({ artworks, isLoading: false });
    } catch (error) {
      set({ error: error as Error, isLoading: false });
    }
  },
})); 