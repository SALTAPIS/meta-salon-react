import { supabase } from '../lib/supabaseClient';
import type { Database, ArtworkMetadata, Album, Artwork, Profile } from '../types/database.types';

export class ArtworkService {
  private static readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private static readonly ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

  static async getDefaultAlbum(userId: string): Promise<Album | null> {
    const { data, error } = await supabase
      .from('albums')
      .select()
      .eq('user_id', userId)
      .eq('is_default', true)
      .single();

    if (error) throw error;
    return data;
  }

  static async uploadArtwork(userId: string, file: File): Promise<{ url: string; metadata: ArtworkMetadata }> {
    // Validate file
    if (file.size > ArtworkService.MAX_FILE_SIZE) {
      throw new Error('File size exceeds 10MB limit');
    }
    if (!ArtworkService.ALLOWED_MIME_TYPES.includes(file.type)) {
      throw new Error('Invalid file type. Only JPG, PNG, and GIF are allowed');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('artworks')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('artworks')
      .getPublicUrl(filePath);

    // Create metadata
    const metadata: ArtworkMetadata = {
      fileSize: file.size,
      mimeType: file.type,
      tags: []
    };

    return { url: publicUrl, metadata };
  }

  static async createArtwork(
    userId: string,
    albumId: string,
    title: string,
    description: string | null,
    imageUrl: string,
    metadata: ArtworkMetadata
  ): Promise<Artwork> {
    // Validate title
    if (!title.trim()) {
      throw new Error('Title is required');
    }

    const { data, error } = await supabase
      .from('artworks')
      .insert({
        user_id: userId,
        album_id: albumId,
        title: title.trim(),
        description: description?.trim() || null,
        image_url: imageUrl,
        status: 'draft',
        metadata
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async submitToChallenge(
    artworkId: string,
    challengeId: string,
    submissionFee: number
  ): Promise<Artwork> {
    const user = await supabase.auth.getUser();
    if (!user.data.user?.id) {
      throw new Error('User not authenticated');
    }

    // First check if user has enough balance
    const { data: profile, error: balanceError } = await supabase
      .from('profiles')
      .select('balance')
      .eq('id', user.data.user.id)
      .single();

    if (balanceError) throw balanceError;
    if (!profile || typeof profile.balance !== 'number' || profile.balance < submissionFee) {
      throw new Error('Insufficient balance for submission');
    }

    // Start transaction
    const { data: artwork, error: submissionError } = await supabase
      .from('artworks')
      .update({
        status: 'submitted',
        challenge_id: challengeId,
        submission_fee: submissionFee
      })
      .eq('id', artworkId)
      .select()
      .single();

    if (submissionError) throw submissionError;

    // Deduct submission fee
    const { error: feeError } = await supabase
      .from('profiles')
      .update({
        balance: profile.balance - submissionFee
      })
      .eq('id', artwork.user_id);

    if (feeError) throw feeError;

    // Record transaction
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: artwork.user_id,
        type: 'submission',
        amount: -submissionFee,
        description: `Artwork submission fee for ${artwork.title}`,
        reference_id: artwork.id
      });

    if (transactionError) throw transactionError;

    return artwork;
  }

  static async getUserArtworks(userId: string): Promise<Artwork[]> {
    const { data, error } = await supabase
      .from('artworks')
      .select()
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getAlbumArtworks(albumId: string): Promise<Artwork[]> {
    const { data, error } = await supabase
      .from('artworks')
      .select()
      .eq('album_id', albumId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async getUserAlbums(userId: string): Promise<Album[]> {
    const { data, error } = await supabase
      .from('albums')
      .select()
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  static async createAlbum(
    userId: string,
    name: string,
    description: string | null = null
  ): Promise<Album> {
    // Validate name
    if (!name.trim()) {
      throw new Error('Album name is required');
    }

    const { data, error } = await supabase
      .from('albums')
      .insert({
        user_id: userId,
        name: name.trim(),
        description: description?.trim() || null,
        is_default: false
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
} 