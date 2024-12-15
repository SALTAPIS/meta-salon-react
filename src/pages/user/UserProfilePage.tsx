import { useState, useEffect } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Avatar,
  Badge,
  Button,
  Tabs,
  TabList,
  TabPanels,
  TabPanel,
  Tab,
  SimpleGrid,
  useColorModeValue,
  Spinner,
  Center,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { SettingsIcon } from '@chakra-ui/icons';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabaseClient';
import type { Artwork } from '../../types/database.types';
import { ArtworkCard } from '../../pages/game/ArtworkCard';

export function UserProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const isOwnProfile = user?.username === username;

  useEffect(() => {
    const loadArtworks = async () => {
      try {
        setLoading(true);
        setError(null);

        // First get the user's profile ID
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('id')
          .eq('username', username)
          .single();

        if (profileError) throw profileError;
        if (!profiles) throw new Error('Profile not found');

        // Then get their artworks
        const { data: artworksData, error: artworksError } = await supabase
          .from('artworks')
          .select('*')
          .eq('user_id', profiles.id)
          .order('created_at', { ascending: false });

        if (artworksError) throw artworksError;
        setArtworks(artworksData || []);
      } catch (err) {
        console.error('Error loading artworks:', err);
        setError(err instanceof Error ? err.message : 'Failed to load artworks');
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      loadArtworks();
    }
  }, [username]);

  return (
    <Container maxW="container.xl" py={8}>
      {/* Profile Header */}
      <HStack spacing={8} mb={8} align="flex-start" justify="space-between">
        <HStack spacing={6}>
          <Avatar
            size="2xl"
            name={username}
            src={user?.avatar_url || undefined}
          />
          <VStack align="flex-start" spacing={2}>
            <Heading size="xl">{user?.display_name}</Heading>
            <Text color="gray.500">@{user?.username}</Text>
            {user?.role && (
              <Badge colorScheme="purple" fontSize="md">
                {user.role}
              </Badge>
            )}
          </VStack>
        </HStack>

        {isOwnProfile ? (
          <Button
            as={RouterLink}
            to={`/${username}/settings`}
            leftIcon={<SettingsIcon />}
            variant="outline"
          >
            Settings
          </Button>
        ) : null}
      </HStack>

      {/* Content Tabs */}
      <Tabs variant="line">
        <TabList borderBottom="none" pb="1px">
          <Tab 
            fontSize="sm"
            px={4}
            py={6}
            _selected={{
              color: 'blue.500',
              borderBottom: '2px solid',
              borderColor: 'blue.500',
              marginBottom: '-1px'
            }}
            _hover={{
              color: 'blue.400'
            }}
          >
            Artworks
          </Tab>
          <Tab 
            fontSize="sm"
            px={4}
            py={6}
            _selected={{
              color: 'blue.500',
              borderBottom: '2px solid',
              borderColor: 'blue.500',
              marginBottom: '-1px'
            }}
            _hover={{
              color: 'blue.400'
            }}
          >
            Albums
          </Tab>
        </TabList>

        <TabPanels>
          {/* Artworks Tab */}
          <TabPanel p={0} pt={6}>
            {loading ? (
              <Center py={8}>
                <Spinner size="xl" />
              </Center>
            ) : error ? (
              <Alert status="error">
                <AlertIcon />
                {error}
              </Alert>
            ) : artworks.length === 0 ? (
              <Alert status="info">
                <AlertIcon />
                No artworks found
              </Alert>
            ) : (
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                {artworks.map((artwork) => (
                  <Box
                    key={artwork.id}
                    as={RouterLink}
                    to={`/artwork/${artwork.id}`}
                    borderRadius="lg"
                    overflow="hidden"
                    bg={bgColor}
                    borderWidth={1}
                    borderColor={borderColor}
                    transition="all 0.2s"
                    _hover={{ transform: 'translateY(-4px)', shadow: 'lg' }}
                  >
                    <Box height="300px">
                      <ArtworkCard artwork={artwork} showStats={true} />
                    </Box>
                    <Box p={4}>
                      <VStack align="stretch" spacing={2}>
                        <Heading size="md">{artwork.title}</Heading>
                        <Text color="gray.500" fontSize="sm" noOfLines={2}>
                          {artwork.description}
                        </Text>
                        <HStack>
                          <Badge colorScheme={artwork.status === 'approved' ? 'green' : 'yellow'}>
                            {artwork.status}
                          </Badge>
                          {artwork.challenge_id && (
                            <Badge colorScheme="purple">Challenge Entry</Badge>
                          )}
                        </HStack>
                      </VStack>
                    </Box>
                  </Box>
                ))}
              </SimpleGrid>
            )}
          </TabPanel>

          {/* Albums Tab */}
          <TabPanel>
            <Text>Albums coming soon...</Text>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Container>
  );
} 