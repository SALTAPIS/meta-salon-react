import { supabase } from '../lib/supabase';
import type { Album, Artwork } from '../types/database.types';
import { TokenService } from './token/tokenService';

interface UploadResult {
  url: string;
  metadata: {
    size: number;
    format: string;
  };
}

export class ArtworkService {
  static async getUserAlbums(userId: string): Promise<Album[]> {
    const { data, error } = await supabase
      .from('albums')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async uploadArtwork(userId: string, file: File): Promise<UploadResult> {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('artworks')
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('artworks')
      .getPublicUrl(fileName);

    return {
      url: publicUrl,
      metadata: {
        size: file.size,
        format: file.type
      }
    };
  }

  static async createArtwork(
    userId: string,
    albumId: string,
    title: string,
    description: string,
    imageUrl: string,
    metadata: any
  ): Promise<Artwork> {
    const { data, error } = await supabase
      .from('artworks')
      .insert([
        {
          user_id: userId,
          album_id: albumId,
          title,
          description,
          image_url: imageUrl,
          metadata,
          status: 'draft'
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async submitToChallenge(artworkId: string, challengeId: string, submissionFee: number): Promise<void> {
    const { error } = await supabase
      .rpc('submit_artwork_to_challenge', {
        p_artwork_id: artworkId,
        p_challenge_id: challengeId,
        p_submission_fee: submissionFee
      });

    if (error) throw error;
  }

  static async getDraftArtworks(userId: string): Promise<Artwork[]> {
    const { data, error } = await supabase
      .from('artworks')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'draft')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getActiveChallenges() {
    const { data, error } = await supabase
      .from('challenges')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }
} 