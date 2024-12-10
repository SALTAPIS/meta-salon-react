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
  Avatar,
  Badge,
  Card,
  CardBody,
  Image,
  Grid,
  GridItem,
  IconButton,
} from '@chakra-ui/react';
import { SettingsIcon } from '@chakra-ui/icons';
import { Link as RouterLink } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import type { Database } from '../../types/database.types';
import type { Album } from '../../types/database.types';
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
  const [profile, setProfile] = useState<Profile | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
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
    loadActivities();
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
    }
  };

  const loadActivities = async () => {
    try {
      // TODO: Replace with actual activity loading logic
      const mockActivities: Activity[] = [
        {
          id: '1',
          type: 'submission',
          title: 'Submitted',
          timestamp: 'just now',
          images: ['https://example.com/image1.jpg'],
        },
        {
          id: '2',
          type: 'vote',
          title: 'Voting session',
          timestamp: '2h ago',
          images: ['https://example.com/image2.jpg', 'https://example.com/image3.jpg'],
        },
        {
          id: '3',
          type: 'purchase',
          title: 'Vote pack purchase',
          timestamp: '1d ago',
          details: 'Pro Pack - 25 Votes',
        },
      ];
      setActivities(mockActivities);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);
      const { error } = await supabase
        .from('profiles')
        .update({
          ...formData,
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

  return (
    <Container maxW="container.xl" py={8}>
      {/* Profile Header */}
      <Grid templateColumns="auto 1fr auto" gap={8} mb={8} alignItems="center">
        <GridItem>
          <Avatar
            size="2xl"
            name={user?.display_name || user?.email || ''}
            src={user?.avatar_url || undefined}
          />
        </GridItem>
        <GridItem>
          <HStack spacing={4}>
            <Heading size="xl">{user?.display_name || user?.username}</Heading>
            {user?.role && (
              <Badge colorScheme="purple" fontSize="md">
                {user.role}
              </Badge>
            )}
          </HStack>
        </GridItem>
        <GridItem>
          <VStack align="flex-end" spacing={4}>
            <Text fontSize="3xl" fontWeight="bold">
              {profile?.balance?.toLocaleString()} SLN
            </Text>
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
            <SimpleGrid columns={1} spacing={4}>
              {activities.map((activity) => (
                <Card key={activity.id}>
                  <CardBody>
                    <VStack align="stretch" spacing={4}>
                      <HStack justify="space-between">
                        <Text fontWeight="bold">{activity.title}</Text>
                        <Text color="gray.500">{activity.timestamp}</Text>
                      </HStack>
                      {activity.images && (
                        <SimpleGrid columns={activity.images.length > 1 ? 3 : 1} spacing={4}>
                          {activity.images.map((image, index) => (
                            <Image
                              key={index}
                              src={image}
                              alt={`Activity ${index + 1}`}
                              borderRadius="md"
                            />
                          ))}
                        </SimpleGrid>
                      )}
                      {activity.details && (
                        <Text color="gray.600">{activity.details}</Text>
                      )}
                    </VStack>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          </TabPanel>

          {/* Submissions Tab */}
          <TabPanel>
            <Text>Submissions coming soon...</Text>
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