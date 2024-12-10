import { useEffect, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Avatar,
  Button,
  Grid,
  GridItem,
  Image,
  Badge,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  TabPanel,
  Tab,
  useColorModeValue,
  Divider,
} from '@chakra-ui/react';
import { FiMoreVertical, FiEdit2, FiUpload, FiPlus } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import type { User, Album, Artwork } from '../../types/database.types';

export function UserProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<User | null>(null);
  const [defaultAlbum, setDefaultAlbum] = useState<Album | null>(null);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    loadProfile();
  }, [username]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load user profile
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('username', username)
        .single();

      if (profileError) throw profileError;
      if (!profiles) throw new Error('Profile not found');

      setProfile(profiles);

      // Load default album
      const { data: albums, error: albumError } = await supabase
        .from('albums')
        .select('*')
        .eq('user_id', profiles.id)
        .eq('is_default', true)
        .single();

      if (albumError) throw albumError;
      setDefaultAlbum(albums);

      // Load artworks from default album
      if (albums) {
        const { data: artworks, error: artworksError } = await supabase
          .from('artworks')
          .select('*')
          .eq('album_id', albums.id)
          .order('created_at', { ascending: false });

        if (artworksError) throw artworksError;
        setArtworks(artworks || []);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      setError(error instanceof Error ? error.message : 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitArtwork = async (artworkId: string) => {
    try {
      const { error } = await supabase
        .from('artworks')
        .update({ status: 'submitted' })
        .eq('id', artworkId);

      if (error) throw error;

      toast({
        title: 'Artwork submitted',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      // Refresh artworks
      loadProfile();
    } catch (error) {
      console.error('Error submitting artwork:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit artwork',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const isOwnProfile = currentUser?.id === profile?.id;

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        {/* Profile Header */}
        <Box p={6} bg={bgColor} borderRadius="lg" borderWidth={1} borderColor={borderColor}>
          <HStack spacing={6} align="start">
            <Avatar 
              size="2xl" 
              name={profile?.display_name || profile?.username} 
              src={profile?.avatar_url || undefined}
            />
            <VStack align="start" flex={1} spacing={3}>
              <HStack justify="space-between" w="full">
                <VStack align="start" spacing={1}>
                  <Heading size="lg">{profile?.display_name || profile?.username}</Heading>
                  <Text color="gray.500">@{profile?.username}</Text>
                </VStack>
                {isOwnProfile && (
                  <Button
                    as={RouterLink}
                    to={`/${username}/settings`}
                    leftIcon={<FiEdit2 />}
                    variant="outline"
                  >
                    Edit Profile
                  </Button>
                )}
              </HStack>
              <Text>{profile?.bio}</Text>
              <HStack spacing={4}>
                <Badge colorScheme="blue">{profile?.role}</Badge>
                {profile?.premium_until && new Date(profile.premium_until) > new Date() && (
                  <Badge colorScheme="purple">Premium</Badge>
                )}
              </HStack>
            </VStack>
          </HStack>
        </Box>

        {/* Tabs */}
        <Tabs variant="enclosed">
          <TabList>
            <Tab>Artworks</Tab>
            <Tab>Albums</Tab>
            {isOwnProfile && <Tab>Transactions</Tab>}
          </TabList>

          <TabPanels>
            {/* Artworks Tab */}
            <TabPanel p={0} pt={4}>
              <VStack spacing={4} align="stretch">
                {isOwnProfile && (
                  <HStack justify="flex-end">
                    <Button
                      leftIcon={<FiUpload />}
                      colorScheme="blue"
                      as={RouterLink}
                      to="/submit"
                    >
                      Upload Artwork
                    </Button>
                  </HStack>
                )}

                <Grid templateColumns="repeat(auto-fill, minmax(250px, 1fr))" gap={6}>
                  {artworks.map((artwork) => (
                    <GridItem key={artwork.id}>
                      <Box
                        borderRadius="lg"
                        overflow="hidden"
                        borderWidth={1}
                        borderColor={borderColor}
                        bg={bgColor}
                      >
                        <Image
                          src={artwork.image_url}
                          alt={artwork.title}
                          objectFit="cover"
                          height="200px"
                          width="100%"
                        />
                        <Box p={4}>
                          <HStack justify="space-between" align="start" mb={2}>
                            <VStack align="start" spacing={1}>
                              <Heading size="sm">{artwork.title}</Heading>
                              <Badge colorScheme={artwork.status === 'submitted' ? 'green' : 'yellow'}>
                                {artwork.status}
                              </Badge>
                            </VStack>
                            {isOwnProfile && (
                              <Menu>
                                <MenuButton
                                  as={IconButton}
                                  icon={<FiMoreVertical />}
                                  variant="ghost"
                                  size="sm"
                                />
                                <MenuList>
                                  {artwork.status === 'draft' && (
                                    <MenuItem
                                      icon={<FiUpload />}
                                      onClick={() => handleSubmitArtwork(artwork.id)}
                                    >
                                      Submit Artwork
                                    </MenuItem>
                                  )}
                                  <MenuItem
                                    as={RouterLink}
                                    to={`/artwork/${artwork.id}`}
                                    icon={<FiEdit2 />}
                                  >
                                    View Details
                                  </MenuItem>
                                </MenuList>
                              </Menu>
                            )}
                          </HStack>
                          <Text noOfLines={2} color="gray.600">
                            {artwork.description}
                          </Text>
                        </Box>
                      </Box>
                    </GridItem>
                  ))}
                </Grid>

                {artworks.length === 0 && (
                  <Box textAlign="center" py={8}>
                    <Text color="gray.500">No artworks found</Text>
                  </Box>
                )}
              </VStack>
            </TabPanel>

            {/* Albums Tab */}
            <TabPanel>
              <Text>Albums content coming soon...</Text>
            </TabPanel>

            {/* Transactions Tab (only for own profile) */}
            {isOwnProfile && (
              <TabPanel>
                <Text>Transaction history coming soon...</Text>
              </TabPanel>
            )}
          </TabPanels>
        </Tabs>
      </VStack>
    </Container>
  );
} 