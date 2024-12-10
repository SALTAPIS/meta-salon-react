import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Tabs,
  TabList,
  TabPanels,
  TabPanel,
  Tab,
  Button,
  useToast,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  SimpleGrid,
  useColorModeValue,
} from '@chakra-ui/react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import type { Database } from '../../types/database.types';
import type { Album } from '../../types/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'] & {
  bio?: string | null;
  premium_until?: string | null;
};

export function UserDashboardPage() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    display_name: '',
    bio: '',
  });
  const toast = useToast();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    loadProfile();
    loadAlbums();
  }, [username]);

  const loadProfile = async () => {
    try {
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();

      if (profileError) throw profileError;
      setProfile(profiles);
      setFormData({
        username: profiles.username || '',
        display_name: profiles.display_name || '',
        bio: profiles.bio || '',
      });
    } catch (error) {
      toast({
        title: 'Error loading profile',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const loadAlbums = async () => {
    try {
      const { data: albumsData, error: albumsError } = await supabase
        .from('albums')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (albumsError) throw albumsError;
      setAlbums(albumsData || []);
    } catch (error) {
      toast({
        title: 'Error loading albums',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);

      // Upload avatar if changed
      let avatar_url = profile?.avatar_url;

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

      loadProfile();
    } catch (error) {
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

  const handleCreateAlbum = async () => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('albums')
        .insert({
          user_id: user.id,
          title: 'New Album',
          description: '',
        });

      if (error) throw error;

      toast({
        title: 'Album created',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      loadAlbums();
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create album',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Container maxW="container.xl" py={8}>
      {/* Balance Display */}
      <Box
        mb={8}
        p={4}
        bg={bgColor}
        borderRadius="lg"
        borderWidth={1}
        borderColor={borderColor}
        textAlign="center"
      >
        <Text fontSize="sm" color="gray.500">Balance</Text>
        <Text fontSize="3xl" fontWeight="bold">
          {profile?.balance?.toLocaleString()} SLN
        </Text>
      </Box>

      <Tabs variant="enclosed">
        <TabList>
          <Tab>Profile</Tab>
          <Tab>Albums</Tab>
          <Tab>Vote Packs</Tab>
          <Tab>Transactions</Tab>
        </TabList>

        <TabPanels>
          {/* Profile Tab */}
          <TabPanel>
            <Box
              p={6}
              bg={bgColor}
              borderRadius="lg"
              borderWidth={1}
              borderColor={borderColor}
            >
              <form onSubmit={handleProfileUpdate}>
                <VStack spacing={6}>
                  <FormControl>
                    <FormLabel>Username</FormLabel>
                    <Input
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Display Name</FormLabel>
                    <Input
                      value={formData.display_name}
                      onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                    />
                  </FormControl>

                  <FormControl>
                    <FormLabel>Bio</FormLabel>
                    <Textarea
                      value={formData.bio}
                      onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    />
                  </FormControl>

                  <Button type="submit" colorScheme="blue" isLoading={loading}>
                    Save Changes
                  </Button>
                </VStack>
              </form>
            </Box>
          </TabPanel>

          {/* Albums Tab */}
          <TabPanel>
            <VStack spacing={6} align="stretch">
              <HStack justify="space-between">
                <Heading size="md">Your Albums</Heading>
                <Button colorScheme="blue" onClick={handleCreateAlbum}>
                  Create Album
                </Button>
              </HStack>

              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                {albums.map((album) => (
                  <Box
                    key={album.id}
                    p={5}
                    bg={bgColor}
                    borderRadius="lg"
                    borderWidth={1}
                    borderColor={borderColor}
                  >
                    <Heading size="md" mb={2}>
                      {album.title}
                    </Heading>
                    {album.description && (
                      <Text color="gray.600">{album.description}</Text>
                    )}
                  </Box>
                ))}
              </SimpleGrid>
            </VStack>
          </TabPanel>

          {/* Vote Packs Tab */}
          <TabPanel>
            <Text>Vote packs content coming soon...</Text>
          </TabPanel>

          {/* Transactions Tab */}
          <TabPanel>
            <Text>Transaction history coming soon...</Text>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Container>
  );
} 