import { useState } from 'react';
import { StorageService } from '../../services/storage/storageService';
import { useAuth } from '../auth/useAuth';
import type { ImageMetadata, StorageError } from '../../types/storage.types';

interface UseStorageReturn {
  uploadAvatar: (file: File) => Promise<string>;
  uploadAlbumImage: (albumId: string, file: File, metadata?: ImageMetadata) => Promise<string>;
  deleteAvatar: () => Promise<void>;
  deleteAlbumImage: (albumId: string, fileName: string) => Promise<void>;
  deleteAlbumImages: (albumId: string) => Promise<void>;
  isUploading: boolean;
  error: StorageError | null;
}

export function useStorage(): UseStorageReturn {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<StorageError | null>(null);
  const storageService = StorageService.getInstance();

  const handleError = (error: unknown) => {
    const storageError: StorageError = {
      message: error instanceof Error ? error.message : 'An unknown error occurred',
      code: error instanceof Error ? error.name : undefined,
      details: error instanceof Error ? error.stack : undefined,
    };
    setError(storageError);
    throw error;
  };

  const uploadAvatar = async (file: File): Promise<string> => {
    if (!user?.id) throw new Error('User not authenticated');
    setIsUploading(true);
    setError(null);

    try {
      const url = await storageService.uploadAvatar(user.id, file);
      return url;
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const uploadAlbumImage = async (
    albumId: string,
    file: File,
    metadata?: ImageMetadata
  ): Promise<string> => {
    if (!user?.id) throw new Error('User not authenticated');
    setIsUploading(true);
    setError(null);

    try {
      const url = await storageService.uploadAlbumImage(user.id, albumId, file, metadata);
      return url;
    } catch (error) {
      handleError(error);
      throw error;
    } finally {
      setIsUploading(false);
    }
  };

  const deleteAvatar = async (): Promise<void> => {
    if (!user?.id) throw new Error('User not authenticated');
    setError(null);

    try {
      await storageService.deleteAvatar(user.id);
    } catch (error) {
      handleError(error);
      throw error;
    }
  };

  const deleteAlbumImage = async (albumId: string, fileName: string): Promise<void> => {
    if (!user?.id) throw new Error('User not authenticated');
    setError(null);

    try {
      await storageService.deleteAlbumImage(user.id, albumId, fileName);
    } catch (error) {
      handleError(error);
      throw error;
    }
  };

  const deleteAlbumImages = async (albumId: string): Promise<void> => {
    if (!user?.id) throw new Error('User not authenticated');
    setError(null);

    try {
      await storageService.deleteAlbumImages(user.id, albumId);
    } catch (error) {
      handleError(error);
      throw error;
    }
  };

  return {
    uploadAvatar,
    uploadAlbumImage,
    deleteAvatar,
    deleteAlbumImage,
    deleteAlbumImages,
    isUploading,
    error,
  };
} 