import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  FormHelperText,
  Input,
  VStack,
  useToast,
  Textarea,
  Avatar,
  Center,
  IconButton,
  Text,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { FiUpload } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import { AuthService } from '../../services/auth/authService';

export function ProfileSettings() {
  const { user, refreshUser } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    display_name: user?.display_name || '',
    bio: user?.bio || '',
  });
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const toast = useToast();

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        display_name: user.display_name || '',
        bio: user.bio || '',
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null); // Clear error when user starts typing
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: 'Please upload an image file',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please upload an image smaller than 2MB',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const validateForm = () => {
    if (formData.username && (formData.username.length < 3 || formData.username.length > 30)) {
      setError('Username must be between 3 and 30 characters');
      return false;
    }

    if (formData.display_name && (formData.display_name.length < 1 || formData.display_name.length > 50)) {
      setError('Display name must be between 1 and 50 characters');
      return false;
    }

    if (formData.bio && formData.bio.length > 500) {
      setError('Bio must not exceed 500 characters');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) {
      return;
    }

    try {
      setIsLoading(true);

      // Upload avatar if changed
      let avatarUrl = user?.avatar_url;
      if (avatarFile) {
        const uploadResult = await AuthService.uploadAvatar(avatarFile);
        if (uploadResult.error) {
          throw uploadResult.error;
        }
        avatarUrl = uploadResult.url;
      }

      // Update profile
      const result = await AuthService.updateProfile({
        ...formData,
        avatar_url: avatarUrl,
      });

      if (result.error) {
        throw result.error;
      }

      // Refresh user data
      await refreshUser();

      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
      toast({
        title: 'Error updating profile',
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
        {/* Avatar Upload */}
        <FormControl>
          <Center>
            <Box position="relative">
              <Avatar
                size="2xl"
                src={avatarPreview || user?.avatar_url}
                name={formData.display_name || user?.email}
              />
              <IconButton
                aria-label="Upload avatar"
                icon={<FiUpload />}
                size="sm"
                colorScheme="blue"
                position="absolute"
                bottom="0"
                right="0"
                rounded="full"
                onClick={() => document.getElementById('avatar-upload')?.click()}
              />
              <Input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarChange}
                display="none"
              />
            </Box>
          </Center>
          <FormHelperText textAlign="center">
            Click the upload button to change your avatar (max 2MB)
          </FormHelperText>
        </FormControl>

        {/* Username */}
        <FormControl>
          <FormLabel>Username</FormLabel>
          <Input
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            placeholder="Choose a username"
          />
          <FormHelperText>
            3-30 characters, used for your profile URL
          </FormHelperText>
        </FormControl>

        {/* Display Name */}
        <FormControl>
          <FormLabel>Display Name</FormLabel>
          <Input
            name="display_name"
            value={formData.display_name}
            onChange={handleInputChange}
            placeholder="Enter your display name"
          />
          <FormHelperText>
            1-50 characters, shown on your profile
          </FormHelperText>
        </FormControl>

        {/* Bio */}
        <FormControl>
          <FormLabel>Bio</FormLabel>
          <Textarea
            name="bio"
            value={formData.bio}
            onChange={handleInputChange}
            placeholder="Tell us about yourself"
            resize="vertical"
            minH="100px"
          />
          <FormHelperText>
            Up to 500 characters
            {formData.bio && (
              <Text as="span" color={formData.bio.length > 500 ? 'red.500' : 'gray.500'}>
                {' '}({formData.bio.length}/500)
              </Text>
            )}
          </FormHelperText>
        </FormControl>

        {error && (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        )}

        <Button
          type="submit"
          colorScheme="blue"
          isLoading={isLoading}
          loadingText="Saving..."
        >
          Save Changes
        </Button>
      </VStack>
    </Box>
  );
} 