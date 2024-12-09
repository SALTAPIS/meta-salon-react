import { supabase } from '../lib/supabase';
import type { Album, Artwork, Challenge } from '../types/database.types';
import { TokenService } from './token/tokenService';

interface ArtworkMetadata {
  size: number;
  type: string;
  lastModified: number;
}

const tokenService = TokenService.getInstance();

export class ArtworkService {
  static async getUserAlbums(userId: string): Promise<Album[]> {
    const { data: albums, error } = await supabase
      .from('albums')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return albums;
  }

  static async uploadArtwork(userId: string, file: File) {
    try {
      console.log('Starting file upload...', {
        userId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });

      // Sanitize file extension
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const safeFileName = `${Date.now()}.${fileExt}`;
      const filePath = `${userId}/${safeFileName}`;

      console.log('Uploading to path:', filePath);

      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('artworks')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        const errorDetails = {
          message: uploadError.message,
          name: uploadError.name,
          path: filePath,
          error: uploadError
        };
        console.error('Upload error:', errorDetails);
        throw new Error(`Failed to upload artwork: ${uploadError.message}`);
      }

      console.log('Upload successful:', uploadData);

      const { data: { publicUrl } } = supabase.storage
        .from('artworks')
        .getPublicUrl(filePath);

      console.log('Public URL generated:', publicUrl);

      // Get image metadata
      const metadata = {
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
      };

      return { url: publicUrl, metadata };
    } catch (error) {
      console.error('Error in uploadArtwork:', {
        error,
        errorType: error?.constructor?.name,
        errorMessage: error instanceof Error ? error.message : String(error),
        userId,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        stack: error instanceof Error ? error.stack : undefined
      });
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to upload artwork: Unknown error');
    }
  }

  static async createArtwork(
    userId: string,
    albumId: string,
    title: string,
    description: string | null,
    imageUrl: string,
    metadata: ArtworkMetadata
  ): Promise<Artwork> {
    const { data: artwork, error } = await supabase
      .from('artworks')
      .insert({
        user_id: userId,
        album_id: albumId,
        title,
        description,
        image_url: imageUrl,
        metadata,
        status: 'draft' // Always create as draft first
      })
      .select()
      .single();

    if (error) throw error;
    return artwork;
  }

  static async getActiveChallenges(): Promise<Challenge[]> {
    const { data: challenges, error } = await supabase
      .from('challenges')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return challenges;
  }

  static async submitToChallenge(
    artworkId: string,
    challengeId: string,
    submissionFee: number
  ): Promise<void> {
    try {
      // First, check if the user has enough tokens
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      const balance = await tokenService.getBalance(user.id);
      if (balance < submissionFee) {
        throw new Error(`Insufficient token balance: have ${balance} tokens, need ${submissionFee} tokens`);
      }

      // Start a transaction
      const { error: txError } = await supabase.rpc('submit_artwork_to_challenge', {
        p_artwork_id: artworkId,
        p_challenge_id: challengeId,
        p_submission_fee: submissionFee
      });

      if (txError) {
        console.error('Error submitting artwork:', {
          error: txError,
          message: txError.message,
          details: txError.details,
          hint: txError.hint,
          artworkId,
          challengeId,
          submissionFee
        });
        throw new Error(txError.message || 'Failed to submit artwork');
      }
    } catch (error) {
      console.error('Error in submitToChallenge:', {
        error,
        message: error instanceof Error ? error.message : String(error),
        artworkId,
        challengeId,
        submissionFee
      });
      throw error;
    }
  }

  static async getArtworksByChallenge(challengeId: string): Promise<Artwork[]> {
    const { data: artworks, error } = await supabase
      .from('artworks')
      .select(`
        *,
        user:profiles(username, avatar_url),
        album:albums(name)
      `)
      .eq('challenge_id', challengeId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return artworks;
  }

  static async getUserArtworks(userId: string): Promise<Artwork[]> {
    const { data: artworks, error } = await supabase
      .from('artworks')
      .select(`
        *,
        album:albums(title)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return artworks;
  }

  static async getDraftArtworks(userId: string): Promise<Artwork[]> {
    const { data: artworks, error } = await supabase
      .from('artworks')
      .select(`
        *,
        album:albums(title)
      `)
      .eq('user_id', userId)
      .eq('status', 'draft')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return artworks;
  }
} 