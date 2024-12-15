import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  VStack,
  Heading,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Button,
  useToast,
  useColorModeValue,
  Avatar,
  HStack,
  IconButton,
  FormErrorMessage,
} from '@chakra-ui/react';
import { FiUpload, FiTrash2 } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';

interface FormErrors {
  username?: string;
  display_name?: string;
  bio?: string;
}

export function UserSettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const [loading, setLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    display_name: user?.display_name || '',
    bio: user?.bio || '',
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Username validation
    if (!formData.username) {
      newErrors.username = 'Username is required';
    } else if (!/^[a-zA-Z0-9_]{3,30}$/.test(formData.username)) {
      newErrors.username = 'Username must be 3-30 characters and can only contain letters, numbers, and underscores';
    }

    // Display name validation
    if (!formData.display_name) {
      newErrors.display_name = 'Display name is required';
    } else if (formData.display_name.length < 1 || formData.display_name.length > 50) {
      newErrors.display_name = 'Display name must be between 1 and 50 characters';
    }

    // Bio validation
    if (formData.bio && formData.bio.length > 500) {
      newErrors.bio = 'Bio must not exceed 500 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: 'Error',
          description: 'Image must be less than 2MB',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Error',
          description: 'Please upload an image file',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      setAvatarFile(file);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate form
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // Upload avatar if changed
      let avatar_url = user.avatar_url;
      if (avatarFile) {
        try {
          const fileExt = avatarFile.name.split('.').pop();
          const filePath = `${user.id}/${Math.random()}.${fileExt}`;

          const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, avatarFile, {
              upsert: true
            });

          if (uploadError) {
            throw uploadError;
          }

          const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

          avatar_url = publicUrl;
        } catch (error) {
          console.error('Avatar upload error:', error);
          throw new Error('Failed to upload avatar. Please try again.');
        }
      }

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({
          ...formData,
          avatar_url,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) {
        if (error.message.includes('display_name_length')) {
          setErrors({ ...errors, display_name: 'Display name must be between 1 and 50 characters' });
          throw new Error('Display name must be between 1 and 50 characters');
        }
        throw error;
      }

      toast({
        title: 'Profile updated',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      navigate(`/${formData.username}`);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update profile',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={8} align="stretch">
        <Box p={6} bg={bgColor} borderRadius="lg" borderWidth={1} borderColor={borderColor}>
          <VStack spacing={8} align="stretch">
            <Heading size="lg">Profile Settings</Heading>

            <form onSubmit={handleSubmit}>
              <VStack spacing={6}>
                {/* Avatar Upload */}
                <FormControl>
                  <FormLabel>Profile Picture</FormLabel>
                  <HStack spacing={4}>
                    <Avatar
                      size="xl"
                      src={avatarFile ? URL.createObjectURL(avatarFile) : (user?.avatar_url ?? '')}
                      name={formData.display_name || formData.username}
                    />
                    <VStack>
                      <Button
                        as="label"
                        htmlFor="avatar-upload"
                        leftIcon={<FiUpload />}
                        cursor="pointer"
                      >
                        Upload Image
                        <input
                          id="avatar-upload"
                          type="file"
                          accept="image/*"
                          onChange={handleAvatarChange}
                          style={{ display: 'none' }}
                        />
                      </Button>
                      {(avatarFile || user?.avatar_url) && (
                        <IconButton
                          aria-label="Remove avatar"
                          icon={<FiTrash2 />}
                          onClick={handleRemoveAvatar}
                          variant="ghost"
                          colorScheme="red"
                        />
                      )}
                    </VStack>
                  </HStack>
                </FormControl>

                <FormControl isRequired isInvalid={!!errors.username}>
                  <FormLabel>Username</FormLabel>
                  <Input
                    value={formData.username}
                    onChange={(e) => {
                      setFormData({ ...formData, username: e.target.value });
                      setErrors({ ...errors, username: undefined });
                    }}
                    placeholder="username"
                  />
                  <FormErrorMessage>{errors.username}</FormErrorMessage>
                </FormControl>

                <FormControl isRequired isInvalid={!!errors.display_name}>
                  <FormLabel>Display Name</FormLabel>
                  <Input
                    value={formData.display_name}
                    onChange={(e) => {
                      setFormData({ ...formData, display_name: e.target.value });
                      setErrors({ ...errors, display_name: undefined });
                    }}
                    placeholder="Display Name"
                  />
                  <FormErrorMessage>{errors.display_name}</FormErrorMessage>
                </FormControl>

                <FormControl isInvalid={!!errors.bio}>
                  <FormLabel>Bio</FormLabel>
                  <Textarea
                    value={formData.bio}
                    onChange={(e) => {
                      setFormData({ ...formData, bio: e.target.value });
                      setErrors({ ...errors, bio: undefined });
                    }}
                    placeholder="Tell us about yourself"
                    rows={4}
                  />
                  <FormErrorMessage>{errors.bio}</FormErrorMessage>
                </FormControl>

                <Button
                  type="submit"
                  colorScheme="blue"
                  size="lg"
                  width="full"
                  isLoading={loading}
                >
                  Save Changes
                </Button>
              </VStack>
            </form>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
} 