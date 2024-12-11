import {
  Box,
  Container,
  Heading,
  Text,
  Card,
  CardHeader,
  CardBody,
  Stack,
  Divider,
  HStack,
  Badge,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Code,
  Button,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Link,
  Image,
  useColorModeValue,
} from '@chakra-ui/react';
import { useAuth } from '../../hooks/useAuth';
import { UserManagement } from '../../components/admin/UserManagement';
import { TokenDistributionTest } from '../debug/TokenDistributionTest';
import { useSession } from '../../hooks/useSession';
import { AuthService } from '../../services/auth/authService';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Link as RouterLink } from 'react-router-dom';

interface Artwork {
  id: string;
  title: string;
  description: string;
  image_url: string;
  status: string;
  created_at: string;
  user_id: string;
  challenge_id: string | null;
  vault_status: string;
  vote_count: number;
  vault_value: number;
}

export function AdminDashboard() {
  const { user } = useAuth();
  const { session } = useSession();
  const toast = useToast();
  const authService = AuthService.getInstance();
  const [submittedArtworks, setSubmittedArtworks] = useState<Artwork[]>([]);
  const [unsubmittedArtworks, setUnsubmittedArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const bgColor = useColorModeValue('white', 'gray.800');

  const fetchArtworks = async () => {
    try {
      setLoading(true);

      // Fetch submitted artworks
      const { data: submitted, error: submittedError } = await supabase
        .from('artworks')
        .select('*')
        .in('status', ['submitted', 'approved'])
        .order('created_at', { ascending: false });

      if (submittedError) throw submittedError;
      setSubmittedArtworks(submitted || []);

      // Fetch unsubmitted artworks
      const { data: unsubmitted, error: unsubmittedError } = await supabase
        .from('artworks')
        .select('*')
        .eq('status', 'draft')
        .order('created_at', { ascending: false });

      if (unsubmittedError) throw unsubmittedError;
      setUnsubmittedArtworks(unsubmitted || []);

    } catch (error) {
      console.error('Error fetching artworks:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch artworks',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchArtworks();
  }, []);

  const handleSetAdmin = async () => {
    if (!session?.user?.id) return;
    
    try {
      const { error } = await authService.setAdminRole(session.user.id);
      if (error) throw error;
      
      toast({
        title: 'Admin role set',
        description: 'Please sign out and sign back in to apply the changes.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to set admin role',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleResetVotes = async () => {
    try {
      setResetting(true);
      const { data, error } = await supabase.rpc('admin_reset_all_votes');

      if (error) throw error;

      toast({
        title: 'Votes Reset Successfully',
        description: `Deleted ${data.deleted_votes} votes and reset ${data.updated_artworks} artworks`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Refresh artwork data
      await fetchArtworks();
    } catch (error) {
      console.error('Error resetting votes:', error);
      toast({
        title: 'Error Resetting Votes',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setResetting(false);
    }
  };

  const ArtworkTable = ({ artworks, title }: { artworks: Artwork[], title: string }) => (
    <Box overflowX="auto">
      <Heading size="md" mb={4}>{title}</Heading>
      <Table variant="simple" bg={bgColor} borderRadius="lg">
        <Thead>
          <Tr>
            <Th>Image</Th>
            <Th>Title</Th>
            <Th>Status</Th>
            <Th>Vault Status</Th>
            <Th>Votes</Th>
            <Th>Value</Th>
            <Th>Created</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {artworks.map((artwork) => (
            <Tr key={artwork.id}>
              <Td>
                <Image 
                  src={artwork.image_url} 
                  alt={artwork.title}
                  boxSize="50px"
                  objectFit="cover"
                  borderRadius="md"
                />
              </Td>
              <Td>
                <Link as={RouterLink} to={`/artwork/${artwork.id}`} color="blue.500">
                  {artwork.title}
                </Link>
              </Td>
              <Td>
                <Badge colorScheme={artwork.status === 'approved' ? 'green' : 'yellow'}>
                  {artwork.status}
                </Badge>
              </Td>
              <Td>
                <Badge colorScheme={artwork.vault_status === 'active' ? 'green' : 'gray'}>
                  {artwork.vault_status}
                </Badge>
              </Td>
              <Td>{artwork.vote_count || 0}</Td>
              <Td>{artwork.vault_value || 0} SLN</Td>
              <Td>{new Date(artwork.created_at).toLocaleDateString()}</Td>
              <Td>
                <Link as={RouterLink} to={`/artwork/${artwork.id}`}>
                  <Button size="sm" colorScheme="blue">View</Button>
                </Link>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );

  if (!user) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert
          status="warning"
          variant="subtle"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          textAlign="center"
          height="200px"
          borderRadius="lg"
        >
          <AlertIcon boxSize="40px" mr={0} />
          <AlertTitle mt={4} mb={1} fontSize="lg">
            Not Signed In
          </AlertTitle>
          <AlertDescription maxWidth="sm">
            Please sign in first to access the admin dashboard.
          </AlertDescription>
        </Alert>
      </Container>
    );
  }

  const isAdmin = session?.user?.role === 'admin' || session?.user?.user_metadata?.role === 'admin';

  return (
    <Container maxW="container.xl" py={8}>
      <Stack spacing={8}>
        <Box>
          <HStack justify="space-between" align="center" mb={2}>
            <Heading size="lg">Admin Dashboard</Heading>
            <Badge colorScheme="red" p={2} fontSize="md">Admin Mode</Badge>
          </HStack>
          <Divider />
        </Box>

        <Tabs variant="enclosed">
          <TabList>
            <Tab>User Management</Tab>
            <Tab>Artworks</Tab>
            <Tab>Token Distribution</Tab>
            <Tab>Debug Info</Tab>
          </TabList>

          <TabPanels>
            {/* User Management Tab */}
            <TabPanel>
              <Card>
                <CardHeader>
                  <HStack justify="space-between" align="center">
                    <Heading size="md">User Management</Heading>
                    <Text color="gray.500" fontSize="sm">
                      Manage all users and their permissions
                    </Text>
                  </HStack>
                </CardHeader>
                <CardBody>
                  <UserManagement />
                </CardBody>
              </Card>
            </TabPanel>

            {/* Artworks Tab */}
            <TabPanel>
              <Stack spacing={8}>
                <Card width="100%">
                  <CardHeader>
                    <HStack justify="space-between" align="center">
                      <Heading size="md">Artwork Management</Heading>
                      <Button
                        colorScheme="red"
                        onClick={handleResetVotes}
                        isLoading={resetting}
                        loadingText="Resetting..."
                      >
                        Reset All Votes
                      </Button>
                    </HStack>
                  </CardHeader>
                </Card>

                {loading ? (
                  <Alert status="info">
                    <AlertIcon />
                    Loading artworks...
                  </Alert>
                ) : (
                  <>
                    <ArtworkTable 
                      artworks={submittedArtworks} 
                      title="Submitted & Approved Artworks" 
                    />
                    <ArtworkTable 
                      artworks={unsubmittedArtworks} 
                      title="Draft Artworks" 
                    />
                  </>
                )}
              </Stack>
            </TabPanel>

            {/* Token Distribution Tab */}
            <TabPanel>
              <Card>
                <CardHeader>
                  <Heading size="md">Token Distribution Testing</Heading>
                </CardHeader>
                <CardBody>
                  <TokenDistributionTest />
                </CardBody>
              </Card>
            </TabPanel>

            {/* Debug Info Tab */}
            <TabPanel>
              <Stack spacing={6}>
                <Card>
                  <CardHeader>
                    <Heading size="md">Session Information</Heading>
                  </CardHeader>
                  <CardBody>
                    <Code p={4} borderRadius="md" whiteSpace="pre-wrap">
                      {JSON.stringify({
                        user_id: session?.user?.id,
                        email: session?.user?.email,
                        role: session?.user?.role,
                        metadata: session?.user?.user_metadata,
                        aud: session?.user?.aud,
                        created_at: session?.user?.created_at,
                      }, null, 2)}
                    </Code>
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader>
                    <Heading size="md">Role Information</Heading>
                  </CardHeader>
                  <CardBody>
                    <Stack spacing={4}>
                      <Text>Direct Role: {session?.user?.role || 'none'}</Text>
                      <Text>Metadata Role: {session?.user?.user_metadata?.role || 'none'}</Text>
                      {!isAdmin && (
                        <Alert status="info">
                          <AlertIcon />
                          Not an admin? Click the button below to set your account as admin.
                        </Alert>
                      )}
                      <Button
                        colorScheme="blue"
                        onClick={handleSetAdmin}
                        isDisabled={isAdmin}
                      >
                        {isAdmin ? 'Already Admin' : 'Set Admin Role'}
                      </Button>
                    </Stack>
                  </CardBody>
                </Card>

                <Card>
                  <CardHeader>
                    <Heading size="md">Environment Information</Heading>
                  </CardHeader>
                  <CardBody>
                    <Code p={4} borderRadius="md" whiteSpace="pre-wrap">
                      {JSON.stringify({
                        NODE_ENV: import.meta.env.MODE,
                        VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ? '✓ Set' : '✗ Missing',
                        VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing',
                        VITE_SUPABASE_SERVICE_KEY: import.meta.env.VITE_SUPABASE_SERVICE_KEY ? '✓ Set' : '✗ Missing',
                        VITE_SITE_URL: import.meta.env.VITE_SITE_URL || window.location.origin,
                      }, null, 2)}
                    </Code>
                  </CardBody>
                </Card>
              </Stack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Stack>
    </Container>
  );
} 