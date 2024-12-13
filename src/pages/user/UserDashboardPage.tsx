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
  SimpleGrid,
  useColorModeValue,
  Avatar,
  Badge,
  Card,
  CardBody,
  Image,
  Grid,
  GridItem,
  Divider,
  Spinner,
  Center,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { SettingsIcon } from '@chakra-ui/icons';
import { Link as RouterLink } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import type { Database } from '../../types/database.types';
import type { Album, Artwork } from '../../types/database.types';
import { VotePacks } from '../../components/token/VotePacks';
import { PayoutHistoryTable } from '../../components/artist/PayoutHistoryTable';

type Profile = Database['public']['Tables']['profiles']['Row'] & {
  bio?: string | null;
  premium_until?: string | null;
};

type Activity = {
  id: string;
  type: 'submission' | 'vote' | 'purchase' | 'gift' | 'join';
  title: string;
  timestamp: string;
  images?: string[];
  details?: string;
};

export function UserDashboardPage() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const toast = useToast();
  
  // Move all color mode hooks to the top
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const purchaseBgColor = useColorModeValue('green.50', 'green.900');
  const purchaseTextColor = useColorModeValue('green.600', 'green.200');

  // State hooks
  const [profile, setProfile] = useState<Profile | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [artworks, setArtworks] = useState<Artwork[]>([]);
  const [isLoadingArtworks, setIsLoadingArtworks] = useState(true);
  const [artworksError, setArtworksError] = useState<string | null>(null);

  useEffect(() => {
    loadProfile();
  }, [username]);

  useEffect(() => {
    if (profile) {
      loadAlbums();
      loadActivities();
      loadArtworks();
    }
  }, [profile]);

  const loadProfile = async () => {
    try {
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('*, avatar_url')
        .eq('username', username)
        .single();

      if (profileError) throw profileError;
      setProfile(profiles);
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

  const loadArtworks = async () => {
    if (!profile?.id) return;
    
    try {
      setIsLoadingArtworks(true);
      setArtworksError(null);

      const { data: artworksData, error: artworksError } = await supabase
        .from('artworks')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false });

      if (artworksError) throw artworksError;
      setArtworks(artworksData || []);
    } catch (error) {
      console.error('Error loading artworks:', error);
      setArtworksError(error instanceof Error ? error.message : 'Failed to load artworks');
    } finally {
      setIsLoadingArtworks(false);
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
    }
  };

  const loadActivities = async () => {
    if (!user?.id) return;

    try {
      // Get user's recent artworks
      const { data: recentArtworks, error: artworksError } = await supabase
        .from('artworks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (artworksError) throw artworksError;

      // Get recent votes on user's artworks
      const { data: recentVotes, error: votesError } = await supabase
        .from('votes')
        .select('*, artworks(*)')
        .in('artwork_id', recentArtworks?.map(a => a.id) || [])
        .order('created_at', { ascending: false })
        .limit(5);

      if (votesError) throw votesError;

      // Get recent vote pack purchases
      const { data: recentPurchases, error: purchasesError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('type', 'vote_pack')
        .order('created_at', { ascending: false })
        .limit(3);

      if (purchasesError) throw purchasesError;

      // Combine and sort activities
      const combinedActivities: Activity[] = [
        // Artwork submissions
        ...(recentArtworks?.map(artwork => ({
          id: `submission-${artwork.id}`,
          type: 'submission' as const,
          title: 'New Artwork Submitted',
          timestamp: formatTimeAgo(artwork.created_at),
          details: `Submitted "${artwork.title}"${artwork.challenge_id ? ' to challenge' : ''}`,
          images: [artwork.image_url],
        })) || []),

        // Votes received
        ...(recentVotes?.map(vote => ({
          id: `vote-${vote.id}`,
          type: 'vote' as const,
          title: 'Received Votes',
          timestamp: formatTimeAgo(vote.created_at),
          details: `Your artwork "${vote.artworks?.title}" received ${vote.value} vote${vote.value > 1 ? 's' : ''}`,
          images: vote.artworks?.image_url ? [vote.artworks.image_url] : undefined,
        })) || []),

        // Vote pack purchases
        ...(recentPurchases?.map(purchase => ({
          id: `purchase-${purchase.id}`,
          type: 'purchase' as const,
          title: 'Vote Pack Purchase',
          timestamp: formatTimeAgo(purchase.created_at),
          details: purchase.description || 'Purchased vote pack',
        })) || []),
      ].sort((a, b) => 
        new Date(parseTimeAgo(b.timestamp)).getTime() - 
        new Date(parseTimeAgo(a.timestamp)).getTime()
      );

      setActivities(combinedActivities);
    } catch (error) {
      toast({
        title: 'Error loading activities',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  // Helper function to format timestamps
  const formatTimeAgo = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
  };

  // Helper function to parse time ago format back to date
  const parseTimeAgo = (timeAgo: string) => {
    const now = new Date();
    if (timeAgo === 'just now') return now;
    
    const [value, unit] = timeAgo.split(/([0-9]+)/).filter(Boolean);
    const number = parseInt(value);
    
    switch(unit[0]) {
      case 'd': return new Date(now.getTime() - number * 24 * 60 * 60 * 1000);
      case 'h': return new Date(now.getTime() - number * 60 * 60 * 1000);
      case 'm': return new Date(now.getTime() - number * 60 * 1000);
      default: return now;
    }
  };

  return (
    <Container maxW="container.xl" py={8}>
      {/* Profile Header */}
      <Grid templateColumns="auto 1fr auto" gap={8} mb={8} alignItems="center">
        <GridItem>
          <Box
            as={RouterLink}
            to={`/${username}`}
            transition="transform 0.2s"
            _hover={{ transform: 'scale(1.05)' }}
          >
            <Avatar
              size="2xl"
              name={profile?.display_name || profile?.username || ''}
              src={profile?.avatar_url || undefined}
              cursor="pointer"
            />
          </Box>
        </GridItem>
        <GridItem>
          <HStack spacing={4}>
            <Heading size="xl">{profile?.display_name || profile?.username}</Heading>
            {profile?.role && (
              <Badge colorScheme="purple" fontSize="md">
                {profile.role}
              </Badge>
            )}
          </HStack>
        </GridItem>
        <GridItem>
          <VStack align="flex-end" spacing={4}>
            <Text fontSize="3xl" fontWeight="bold">
              {profile?.balance?.toLocaleString()} SLN
            </Text>
            {user?.id === profile?.id && (
              <HStack>
                <Button
                  as={RouterLink}
                  to={`/${username}/settings`}
                  leftIcon={<SettingsIcon />}
                  variant="outline"
                >
                  Settings
                </Button>
                <Button
                  as={RouterLink}
                  to={`/${username}/dashboard`}
                  colorScheme="blue"
                >
                  Dashboard
                </Button>
              </HStack>
            )}
          </VStack>
        </GridItem>
      </Grid>

      {/* Main Content */}
      <Tabs variant="line">
        <TabList>
          <Tab>Activity</Tab>
          <Tab>Submissions</Tab>
          <Tab>Albums</Tab>
          <Tab>Vote Packs</Tab>
          <Tab>Transactions</Tab>
          {user && (user.role === 'artist' || user.user_metadata?.role === 'artist' || 
            user.role === 'admin' || user.user_metadata?.role === 'admin') && (
            <Tab>Payouts</Tab>
          )}
        </TabList>

        <TabPanels>
          {/* Activity Tab */}
          <TabPanel>
            <VStack spacing={6} align="stretch">
              <Heading size="md">Recent Activity</Heading>
              <Box>
                <SimpleGrid 
                  columns={{ base: 1, md: 2, lg: 3 }} 
                  spacing={6}
                  minChildWidth="300px"
                >
                  {activities.map((activity) => (
                    <Card 
                      key={activity.id} 
                      height="400px"
                      overflow="hidden"
                    >
                      <CardBody>
                        <VStack align="stretch" spacing={4} height="100%">
                          <HStack justify="space-between">
                            <HStack spacing={3}>
                              <Badge
                                colorScheme={
                                  activity.type === 'submission' ? 'blue' :
                                  activity.type === 'vote' ? 'green' :
                                  activity.type === 'purchase' ? 'purple' :
                                  'gray'
                                }
                                px={2}
                                py={1}
                                borderRadius="full"
                              >
                                {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                              </Badge>
                              <Text fontWeight="bold">{activity.title}</Text>
                            </HStack>
                            <Text color="gray.500" fontSize="sm">{activity.timestamp}</Text>
                          </HStack>

                          {activity.details && (
                            <Text color="gray.600">{activity.details}</Text>
                          )}

                          {activity.images && (
                            <Box flex="1" position="relative" minHeight="200px">
                              <Image
                                src={activity.images[0]}
                                alt={activity.title}
                                position="absolute"
                                top={0}
                                left={0}
                                width="100%"
                                height="100%"
                                objectFit="cover"
                                borderRadius="md"
                              />
                            </Box>
                          )}

                          {activity.type === 'purchase' && (
                            <Box
                              p={4}
                              bg={purchaseBgColor}
                              borderRadius="lg"
                              mt="auto"
                            >
                              <Text fontWeight="medium" color={purchaseTextColor}>
                                {activity.details}
                              </Text>
                            </Box>
                          )}
                        </VStack>
                      </CardBody>
                    </Card>
                  ))}
                </SimpleGrid>
              </Box>
            </VStack>
          </TabPanel>

          {/* Submissions Tab */}
          <TabPanel>
            <VStack spacing={6} align="stretch">
              <HStack justify="space-between">
                <Heading size="md">Your Submissions</Heading>
                <Button
                  as={RouterLink}
                  to="/submit"
                  colorScheme="blue"
                >
                  Submit New Artwork
                </Button>
              </HStack>

              {isLoadingArtworks ? (
                <Center py={8}>
                  <Spinner size="xl" />
                </Center>
              ) : artworksError ? (
                <Alert status="error">
                  <AlertIcon />
                  {artworksError}
                </Alert>
              ) : artworks.length === 0 ? (
                <Alert status="info">
                  <AlertIcon />
                  You haven't submitted any artworks yet
                </Alert>
              ) : (
                artworks.map((artwork) => (
                  <Box
                    key={artwork.id}
                    p={6}
                    bg={bgColor}
                    borderRadius="lg"
                    borderWidth={1}
                    borderColor={borderColor}
                  >
                    <Grid templateColumns="200px 1fr" gap={6}>
                      <Box>
                        <Image
                          src={artwork.image_url}
                          alt={artwork.title}
                          borderRadius="md"
                          objectFit="cover"
                          width="200px"
                          height="200px"
                        />
                      </Box>
                      <VStack align="stretch" spacing={4}>
                        <HStack justify="space-between" align="flex-start">
                          <Box>
                            <Heading size="md" mb={2}>{artwork.title}</Heading>
                            <Text color="gray.600" noOfLines={2}>
                              {artwork.description}
                            </Text>
                          </Box>
                          <Button
                            as={RouterLink}
                            to={`/artwork/${artwork.id}`}
                            colorScheme="blue"
                            variant="outline"
                            size="sm"
                          >
                            View Details
                          </Button>
                        </HStack>

                        <SimpleGrid columns={4} spacing={4}>
                          <Box>
                            <Text fontWeight="bold" mb={1}>Status</Text>
                            <Badge colorScheme={artwork.status === 'approved' ? 'green' : 'yellow'}>
                              {artwork.status}
                            </Badge>
                          </Box>
                          <Box>
                            <Text fontWeight="bold" mb={1}>Total Votes</Text>
                            <Text>{artwork.vote_count || 0}</Text>
                          </Box>
                          <Box>
                            <Text fontWeight="bold" mb={1}>Vault Value</Text>
                            <Text>{artwork.vault_value?.toFixed(2) || '0.00'} SLN</Text>
                          </Box>
                          <Box>
                            <Text fontWeight="bold" mb={1}>Vault Status</Text>
                            <Badge colorScheme={artwork.vault_status === 'active' ? 'green' : 'gray'}>
                              {artwork.vault_status}
                            </Badge>
                          </Box>
                        </SimpleGrid>

                        {artwork.challenge_id && (
                          <Box>
                            <Text fontWeight="bold" mb={1}>Challenge Entry</Text>
                            <Badge colorScheme="purple">Active Challenge</Badge>
                          </Box>
                        )}

                        <Divider />

                        <HStack justify="space-between">
                          <Text fontSize="sm" color="gray.500">
                            Submitted on {new Date(artwork.created_at).toLocaleDateString()}
                          </Text>
                          {artwork.vault_value > 0 && (
                            <Button
                              size="sm"
                              colorScheme="green"
                              variant="outline"
                              onClick={() => {}}
                            >
                              Request Payout
                            </Button>
                          )}
                        </HStack>
                      </VStack>
                    </Grid>
                  </Box>
                ))
              )}
            </VStack>
          </TabPanel>

          {/* Albums Tab */}
          <TabPanel>
            <VStack spacing={6} align="stretch">
              <HStack justify="space-between">
                <Heading size="md">Your Albums</Heading>
                <Button colorScheme="blue" onClick={() => {}}>
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
            <Box
              p={6}
              bg={bgColor}
              borderRadius="lg"
              borderWidth={1}
              borderColor={borderColor}
            >
              <VotePacks />
            </Box>
          </TabPanel>

          {/* Transactions Tab */}
          <TabPanel>
            <Text>Transaction history coming soon...</Text>
          </TabPanel>

          {/* Payouts Tab */}
          {user && (user.role === 'artist' || user.user_metadata?.role === 'artist' || 
            user.role === 'admin' || user.user_metadata?.role === 'admin') && (
            <TabPanel>
              <Box
                p={6}
                bg={bgColor}
                borderRadius="lg"
                borderWidth={1}
                borderColor={borderColor}
              >
                <VStack spacing={6} align="stretch">
                  <Heading size="md">Payouts</Heading>
                  <PayoutHistoryTable />
                </VStack>
              </Box>
            </TabPanel>
          )}
        </TabPanels>
      </Tabs>
    </Container>
  );
} 