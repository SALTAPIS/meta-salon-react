import { supabase } from '../lib/supabaseClient';
import { handleError } from '../utils/errorHandling';
import type { Artwork } from '../types/database.types';

export class ArtworkService {
  /**
   * Get all artworks
   */
  static async getAllArtworks(): Promise<Artwork[]> {
    try {
      // Get all artworks first
      const { data: artworks, error: artworksError } = await supabase
        .from('artworks')
        .select('*')
        .order('created_at', { ascending: false });

      if (artworksError) throw artworksError;
      if (!artworks || artworks.length === 0) return [];

      // Get all unique user IDs
      const userIds = [...new Set(artworks.map(a => a.user_id))];

      // Get all profiles for these users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, display_name')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Create a map of user_id to profile
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      // Combine artwork data with profile data
      return artworks.map(artwork => ({
        ...artwork,
        profiles: profileMap.get(artwork.user_id)
      }));
    } catch (error) {
      throw handleError(error, 'Failed to get artworks');
    }
  }

  /**
   * Get artwork by ID
   */
  static async getArtwork(id: string): Promise<Artwork | null> {
    try {
      // First get the artwork
      const { data: artwork, error: artworkError } = await supabase
        .from('artworks')
        .select('*')
        .eq('id', id)
        .single();

      if (artworkError) throw artworkError;
      if (!artwork) return null;

      // Then get the profile data
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, username, display_name')
        .eq('id', artwork.user_id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') throw profileError;

      // Combine the data
      return {
        ...artwork,
        profiles: profile || undefined
      };
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

  /**
   * Record a view for an artwork
   */
  static async recordView(artworkId: string): Promise<void> {
    try {
      const session = await supabase.auth.getSession();
      if (!session.data.session) {
        // Don't record views for non-authenticated users
        return;
      }

      const { error } = await supabase
        .from('artwork_views')
        .insert({
          artwork_id: artworkId,
          user_id: session.data.session.user.id
        })
        .select()
        .single();

      // Ignore unique constraint violations (user has already viewed this artwork)
      if (error && error.code !== '23505') {
        throw error;
      }
    } catch (error) {
      throw handleError(error, 'Failed to record artwork view');
    }
  }
} 