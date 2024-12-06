import { supabase } from '../../lib/supabase';
import type { ImageMetadata } from '../../types/storage.types';

export class StorageService {
  private static instance: StorageService;
  private readonly AVATAR_BUCKET = 'avatars';
  private readonly ALBUM_BUCKET = 'album-images';
  private readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private readonly ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  private constructor() {}

  static getInstance(): StorageService {
    if (!StorageService.instance) {
      StorageService.instance = new StorageService();
    }
    return StorageService.instance;
  }

  private validateFile(file: File): void {
    if (file.size > this.MAX_FILE_SIZE) {
      throw new Error(`File size must be less than ${this.MAX_FILE_SIZE / 1024 / 1024}MB`);
    }
    if (!this.ALLOWED_IMAGE_TYPES.includes(file.type)) {
      throw new Error('File type not supported. Please upload a JPEG, PNG, or WebP image.');
    }
  }

  async uploadAvatar(userId: string, file: File): Promise<string> {
    try {
      this.validateFile(file);
      const filePath = `${userId}/avatar.${file.name.split('.').pop()}`;

      const { error: uploadError } = await supabase.storage
        .from(this.AVATAR_BUCKET)
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(this.AVATAR_BUCKET)
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading avatar:', error);
      throw error;
    }
  }

  async uploadAlbumImage(
    userId: string, 
    albumId: string, 
    file: File, 
    metadata?: ImageMetadata
  ): Promise<string> {
    try {
      this.validateFile(file);
      const filePath = `${userId}/${albumId}/${file.name}`;

      const { error: uploadError } = await supabase.storage
        .from(this.ALBUM_BUCKET)
        .upload(filePath, file, {
          upsert: true,
          metadata: metadata ? { ...metadata } : undefined
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(this.ALBUM_BUCKET)
        .getPublicUrl(filePath);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading album image:', error);
      throw error;
    }
  }

  async deleteAvatar(userId: string): Promise<void> {
    try {
      const { data: files, error: listError } = await supabase.storage
        .from(this.AVATAR_BUCKET)
        .list(userId);

      if (listError) throw listError;

      if (files && files.length > 0) {
        const { error: deleteError } = await supabase.storage
          .from(this.AVATAR_BUCKET)
          .remove(files.map(file => `${userId}/${file.name}`));

        if (deleteError) throw deleteError;
      }
    } catch (error) {
      console.error('Error deleting avatar:', error);
      throw error;
    }
  }

  async deleteAlbumImage(userId: string, albumId: string, fileName: string): Promise<void> {
    try {
      const { error: deleteError } = await supabase.storage
        .from(this.ALBUM_BUCKET)
        .remove([`${userId}/${albumId}/${fileName}`]);

      if (deleteError) throw deleteError;
    } catch (error) {
      console.error('Error deleting album image:', error);
      throw error;
    }
  }

  async deleteAlbumImages(userId: string, albumId: string): Promise<void> {
    try {
      const { data: files, error: listError } = await supabase.storage
        .from(this.ALBUM_BUCKET)
        .list(`${userId}/${albumId}`);

      if (listError) throw listError;

      if (files && files.length > 0) {
        const { error: deleteError } = await supabase.storage
          .from(this.ALBUM_BUCKET)
          .remove(files.map(file => `${userId}/${albumId}/${file.name}`));

        if (deleteError) throw deleteError;
      }
    } catch (error) {
      console.error('Error deleting album images:', error);
      throw error;
    }
  }
} 