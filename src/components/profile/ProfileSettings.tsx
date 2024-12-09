import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  useToast,
  Avatar,
  FormErrorMessage,
  Textarea,
  Switch,
} from '@chakra-ui/react';
import { useAuth } from '../../hooks/useAuth';
import { AuthService } from '../../services/auth/authService';

interface FormData {
  username: string;
  display_name: string;
  bio: string;
  email_notifications: boolean;
}

export function ProfileSettings() {
  const { user } = useAuth();
  const [formData, setFormData] = useState<FormData>({
    username: '',
    display_name: '',
    bio: '',
    email_notifications: true,
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const authService = AuthService.getInstance();

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        display_name: user.display_name || '',
        bio: user.bio || '',
        email_notifications: user.email_notifications,
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError('Image must be less than 2MB');
        return;
      }

      setAvatarFile(file);
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!user) {
        throw new Error('Not authenticated');
      }

      let avatarUrl = user?.avatar_url;
      if (avatarFile) {
        const uploadResult = await authService.uploadAvatar(avatarFile);
        if (uploadResult.error) {
          throw uploadResult.error;
        }
        avatarUrl = uploadResult.data?.url || null;
      }

      // Update profile
      const result = await authService.updateProfile(user.id, {
        ...formData,
        avatar_url: avatarUrl,
      });

      if (result.error) {
        throw result.error;
      }

      toast({
        title: 'Profile updated',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update profile',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box as="form" onSubmit={handleSubmit}>
      <VStack spacing={6} align="stretch">
        <FormControl>
          <FormLabel>Avatar</FormLabel>
          <Input
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            display="none"
            id="avatar-upload"
          />
          <Box position="relative" width="fit-content">
            <Avatar
              size="xl"
              src={user?.avatar_url || undefined}
              name={user?.display_name || user?.username || undefined}
              cursor="pointer"
              onClick={() => document.getElementById('avatar-upload')?.click()}
            />
          </Box>
        </FormControl>

        <FormControl isInvalid={!!error}>
          <FormLabel>Username</FormLabel>
          <Input
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            placeholder="Enter username"
          />
        </FormControl>

        <FormControl>
          <FormLabel>Display Name</FormLabel>
          <Input
            name="display_name"
            value={formData.display_name}
            onChange={handleInputChange}
            placeholder="Enter display name"
          />
        </FormControl>

        <FormControl>
          <FormLabel>Bio</FormLabel>
          <Textarea
            name="bio"
            value={formData.bio}
            onChange={handleInputChange}
            placeholder="Tell us about yourself"
            resize="vertical"
          />
        </FormControl>

        <FormControl display="flex" alignItems="center">
          <FormLabel htmlFor="email-notifications" mb="0">
            Email Notifications
          </FormLabel>
          <Switch
            id="email-notifications"
            name="email_notifications"
            isChecked={formData.email_notifications}
            onChange={(e) => setFormData(prev => ({
              ...prev,
              email_notifications: e.target.checked
            }))}
          />
        </FormControl>

        {error && <FormErrorMessage>{error}</FormErrorMessage>}

        <Button
          type="submit"
          colorScheme="blue"
          isLoading={isLoading}
          loadingText="Updating..."
        >
          Update Profile
        </Button>
      </VStack>
    </Box>
  );
} 