import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  useToast,
  FormErrorMessage,
  Textarea,
  Switch,
  useColorModeValue,
  HStack,
  Avatar,
  IconButton,
} from '@chakra-ui/react';
import { useState } from 'react';
import { useAuth } from '../../hooks/auth/useAuth';
import { supabase } from '../../lib/supabase';
import { DeleteIcon } from '@chakra-ui/icons';

export function ProfileSettings() {
  const { user } = useAuth();
  const toast = useToast();
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [username, setUsername] = useState(user?.username || '');
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [emailNotifications, setEmailNotifications] = useState(user?.email_notifications ?? true);
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url || '');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    
    try {
      if (!user?.id) throw new Error('User not found');
      const newAvatarUrl = await uploadAvatar(user.id, file);
      setAvatarUrl(newAvatarUrl);
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload avatar. Please try again.',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const handleRemoveAvatar = async () => {
    try {
      if (!user?.id) throw new Error('User not found');
      setAvatarUrl('');
      setAvatarFile(null);
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', user.id);

      if (updateError) throw updateError;

      toast({
        title: 'Avatar removed',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error removing avatar:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove avatar. Please try again.',
        status: 'error',
        duration: 5000,
      });
    }
  };

  const uploadAvatar = async (userId: string, file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const filePath = `${userId}/avatar.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      setError('User not found');
      return;
    }
    
    setError(null);
    setIsLoading(true);

    try {
      // Validate display name
      if (displayName && (displayName.length < 1 || displayName.length > 50)) {
        throw new Error('Display name must be between 1 and 50 characters');
      }

      // Validate username
      if (username && (username.length < 3 || username.length > 30 || !/^[a-zA-Z0-9_-]+$/.test(username))) {
        throw new Error('Username must be between 3 and 30 characters and contain only letters, numbers, underscores, and hyphens');
      }

      // Validate bio
      if (bio && bio.length > 500) {
        throw new Error('Bio must not exceed 500 characters');
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          username,
          display_name: displayName,
          bio,
          avatar_url: avatarUrl,
          email_notifications: emailNotifications,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        if (updateError.code === 'P0001') {
          throw new Error(updateError.message);
        }
        throw updateError;
      }

      toast({
        title: 'Profile updated',
        description: 'Your profile has been updated successfully',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred while updating your profile';
      setError(errorMessage);
      
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      p={6}
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="lg"
      shadow="sm"
    >
      <form onSubmit={handleSubmit}>
        <VStack spacing={6} align="stretch">
          {/* Avatar Upload */}
          <FormControl>
            <FormLabel>Profile Picture</FormLabel>
            <HStack spacing={4}>
              <Avatar
                size="xl"
                src={avatarUrl}
                name={displayName || username || user?.email}
              />
              <VStack>
                <Button
                  as="label"
                  htmlFor="avatar-upload"
                  colorScheme="blue"
                  cursor="pointer"
                >
                  Upload New Picture
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    style={{ display: 'none' }}
                  />
                </Button>
                {avatarUrl && (
                  <IconButton
                    aria-label="Remove avatar"
                    icon={<DeleteIcon />}
                    onClick={handleRemoveAvatar}
                    variant="ghost"
                    colorScheme="red"
                  />
                )}
              </VStack>
            </HStack>
          </FormControl>

          {/* Username */}
          <FormControl isInvalid={!!error}>
            <FormLabel>Username</FormLabel>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
            />
          </FormControl>

          {/* Display Name */}
          <FormControl>
            <FormLabel>Display Name</FormLabel>
            <Input
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter display name"
            />
          </FormControl>

          {/* Bio */}
          <FormControl>
            <FormLabel>Bio</FormLabel>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself"
              rows={4}
            />
          </FormControl>

          {/* Email Notifications */}
          <FormControl display="flex" alignItems="center">
            <FormLabel mb="0">
              Email Notifications
            </FormLabel>
            <Switch
              isChecked={emailNotifications}
              onChange={(e) => setEmailNotifications(e.target.checked)}
            />
          </FormControl>

          {error && <FormErrorMessage>{error}</FormErrorMessage>}

          <Button
            type="submit"
            colorScheme="blue"
            isLoading={isLoading}
            loadingText="Saving..."
          >
            Save Changes
          </Button>
        </VStack>
      </form>
    </Box>
  );
} 