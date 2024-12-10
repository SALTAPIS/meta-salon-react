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
  Button,
  useToast,
  Textarea,
  Avatar,
  HStack,
  IconButton,
  useColorModeValue,
} from '@chakra-ui/react';
import { FiUpload, FiTrash2 } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';

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

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAvatarFile(e.target.files[0]);
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarFile(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);

      // Upload avatar if changed
      let avatar_url = user.avatar_url;
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `avatars/${user.id}/${Math.random()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from('public')
          .upload(filePath, avatarFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('public')
          .getPublicUrl(filePath);

        avatar_url = publicUrl;
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

      if (error) throw error;

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

              <FormControl isRequired>
                <FormLabel>Username</FormLabel>
                <Input
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="username"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Display Name</FormLabel>
                <Input
                  value={formData.display_name}
                  onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  placeholder="Display Name"
                />
              </FormControl>

              <FormControl>
                <FormLabel>Bio</FormLabel>
                <Textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Tell us about yourself"
                  rows={4}
                />
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
    </Container>
  );
} 