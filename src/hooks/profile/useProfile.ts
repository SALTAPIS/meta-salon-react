import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ProfileService } from '../../services/profile/profileService';
import { useStorage } from '../storage/useStorage';
import { useAuth } from '../auth/useAuth';
import type { Profile, ProfileError } from '../../types/profile.types';

interface UseProfileReturn {
  profile: Profile | null;
  isLoading: boolean;
  error: ProfileError | null;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  updateAvatar: (file: File) => Promise<void>;
  removeAvatar: () => Promise<void>;
  checkUsername: (username: string) => Promise<boolean>;
  isUpdating: boolean;
}

export function useProfile(): UseProfileReturn {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const profileService = ProfileService.getInstance();
  const { uploadAvatar, deleteAvatar } = useStorage();
  const [error, setError] = useState<ProfileError | null>(null);

  const { data: profile = null, isLoading } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => profileService.getProfile(user?.id as string),
    enabled: !!user?.id,
  });

  const { mutateAsync: mutateProfile, isPending: isUpdating } = useMutation({
    mutationFn: async (updates: Partial<Profile>) => {
      if (!user?.id) throw new Error('User not authenticated');

      // If username is being updated, validate it first
      if (updates.username) {
        const isValid = await profileService.validateUsername(updates.username);
        if (!isValid) {
          throw new Error('Invalid username format');
        }

        const isAvailable = await profileService.checkUsernameAvailability(
          updates.username,
          user.id
        );
        if (!isAvailable) {
          throw new Error('Username is already taken');
        }
      }

      return profileService.updateProfile(user.id, updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', user?.id] });
    },
    onError: (error: Error) => {
      setError({
        message: error.message,
        code: error.name,
        details: error.stack,
      });
    },
  });

  const updateProfile = async (updates: Partial<Profile>): Promise<void> => {
    await mutateProfile(updates);
  };

  const handleAvatarUpdate = async (file: File): Promise<void> => {
    if (!user?.id) throw new Error('User not authenticated');

    try {
      const avatarUrl = await uploadAvatar(file);
      await updateProfile({ avatar_url: avatarUrl });
    } catch (error) {
      if (error instanceof Error) {
        setError({
          message: error.message,
          code: error.name,
          details: error.stack,
        });
      }
      throw error;
    }
  };

  const handleAvatarRemoval = async (): Promise<void> => {
    if (!user?.id) throw new Error('User not authenticated');

    try {
      await deleteAvatar();
      await updateProfile({ avatar_url: null });
    } catch (error) {
      if (error instanceof Error) {
        setError({
          message: error.message,
          code: error.name,
          details: error.stack,
        });
      }
      throw error;
    }
  };

  const checkUsername = async (username: string): Promise<boolean> => {
    try {
      const isValid = await profileService.validateUsername(username);
      if (!isValid) return false;

      return profileService.checkUsernameAvailability(username, user?.id);
    } catch (error) {
      if (error instanceof Error) {
        setError({
          message: error.message,
          code: error.name,
          details: error.stack,
        });
      }
      throw error;
    }
  };

  return {
    profile,
    isLoading,
    error,
    updateProfile,
    updateAvatar: handleAvatarUpdate,
    removeAvatar: handleAvatarRemoval,
    checkUsername,
    isUpdating,
  };
} 