import { useState, useEffect } from 'react';
import {
  Box,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { useProfile } from '../../hooks/profile/useProfile';
import { AvatarUpload } from './AvatarUpload';
import { ProfileForm } from './ProfileForm';
import type { ProfileFormData } from '../../types/profile.types';

export function ProfileSettings() {
  const {
    profile,
    isLoading,
    error,
    updateProfile,
    updateAvatar,
    removeAvatar,
    checkUsername,
    isUpdating,
  } = useProfile();

  const [formData, setFormData] = useState<ProfileFormData>({});
  const [usernameError, setUsernameError] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    if (profile) {
      setFormData({
        username: profile.username || '',
        display_name: profile.display_name || '',
        bio: profile.bio || '',
        website: profile.website || '',
        social_links: profile.social_links || {},
      });
    }
  }, [profile]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    if (name === 'username') {
      setUsernameError('');
    }
  };

  const handleUsernameBlur = async () => {
    if (!formData.username) return;
    if (formData.username === profile?.username) return;

    try {
      const isAvailable = await checkUsername(formData.username);
      if (!isAvailable) {
        setUsernameError('This username is already taken');
      }
    } catch (error) {
      setUsernameError('Error checking username availability');
    }
  };

  const handleAvatarSelect = (file: File) => {
    setAvatarFile(file);
  };

  const handleAvatarRemove = async () => {
    try {
      await removeAvatar();
      setAvatarFile(null);
    } catch (error) {
      console.error('Error removing avatar:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (usernameError) return;

    setIsSubmitting(true);
    try {
      if (avatarFile) {
        await updateAvatar(avatarFile);
      }

      await updateProfile(formData);
      setAvatarFile(null);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <Box>Loading...</Box>;
  }

  return (
    <Box
      p={6}
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="lg"
      shadow="sm"
    >
      {error && (
        <Alert status="error" mb={6}>
          <AlertIcon />
          <Box>
            <AlertTitle>Error updating profile</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Box>
        </Alert>
      )}

      <AvatarUpload
        currentAvatarUrl={profile?.avatar_url}
        displayName={profile?.display_name}
        username={profile?.username}
        email={profile?.email}
        onFileSelect={handleAvatarSelect}
        onRemove={handleAvatarRemove}
        selectedFile={avatarFile}
      />

      <Box mt={6}>
        <ProfileForm
          data={formData}
          usernameError={usernameError}
          isSubmitting={isSubmitting}
          isUpdating={isUpdating}
          onChange={handleInputChange}
          onUsernameBlur={handleUsernameBlur}
          onSubmit={handleSubmit}
        />
      </Box>
    </Box>
  );
} 