import { supabase } from '../lib/supabaseClient';
import { handleError } from '../utils/errorHandling';
import type { Artwork } from '../types/database.types';

export class ArtworkService {
  /**
   * Get all artworks
   */
  static async getAllArtworks(): Promise<Artwork[]> {
    try {
      const { data, error } = await supabase
        .from('artworks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw handleError(error, 'Failed to get artworks');
    }
  }

  /**
   * Get artwork by ID
   */
  static async getArtwork(id: string): Promise<Artwork | null> {
    try {
      const { data, error } = await supabase
        .from('artworks')
        .select(`
          *,
          user:user_id (
            id,
            username,
            display_name
          )
        `)
        .eq('id', id)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      throw handleError(error, 'Failed to get artwork');
    }
  }

  /**
   * Step 1: Create artwork in draft state
   */
  static async createDraftArtwork(
    title: string,
    description: string,
    imageFile: File
  ): Promise<string> {
    try {
      // Get current user
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        throw new Error('Not authenticated');
      }

      // Get user's default album
      const { data: album, error: albumError } = await supabase
        .from('albums')
        .select('id')
        .eq('user_id', session.data.session.user.id)
        .eq('is_default', true)
        .single();

      if (albumError) throw albumError;
      if (!album) throw new Error('No default album found');

      // Upload image
      const fileName = `${Date.now()}-${imageFile.name}`;
      const { error: uploadError } = await supabase.storage
        .from('artworks')
        .upload(fileName, imageFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('artworks')
        .getPublicUrl(fileName);

      // Create artwork in draft state
      const { data, error } = await supabase
        .from('artworks')
        .insert({
          title,
          description,
          image_url: publicUrl,
          status: 'draft',
          user_id: session.data.session.user.id,
          album_id: album.id
        })
        .select()
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      throw handleError(error, 'Failed to create draft artwork');
    }
  }

  /**
   * Step 2: Submit artwork to challenge
   */
  static async submitArtworkToChallenge(
    artworkId: string,
    challengeId: string,
    submissionFee: number
  ): Promise<void> {
    try {
      const { error } = await supabase.rpc('submit_artwork_to_challenge', {
        p_artwork_id: artworkId,
        p_challenge_id: challengeId,
        p_submission_fee: submissionFee
      });

      if (error) throw error;
    } catch (error) {
      throw handleError(error, 'Failed to submit artwork to challenge');
    }
  }

  /**
   * Get artworks by challenge ID
   */
  static async getChallengeArtworks(challengeId: string): Promise<Artwork[]> {
    try {
      const { data, error } = await supabase
        .from('artworks')
        .select('*')
        .eq('challenge_id', challengeId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      throw handleError(error, 'Failed to get challenge artworks');
    }
  }
} 