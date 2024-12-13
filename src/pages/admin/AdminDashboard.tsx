import {
  Box,
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
} from '@chakra-ui/react';
import { useAuth } from '../../hooks/useAuth';
import { UserManagement } from '../../components/admin/UserManagement';
import { VoteManagement } from '../../components/admin/VoteManagement';
import { ArtworkManagement } from '../../components/admin/ArtworkManagement';
import { TokenDistributionTest } from '../debug/TokenDistributionTest';
import { useSession } from '../../hooks/useSession';
import { AuthService } from '../../services/auth/authService';

export function AdminDashboard() {
  const { user } = useAuth();
  const { session } = useSession();
  const toast = useToast();
  const authService = AuthService.getInstance();

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

  if (!user) {
    return (
      <Box p={8}>
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
      </Box>
    );
  }

  const isAdmin = session?.user?.role === 'admin' || session?.user?.user_metadata?.role === 'admin';

  return (
    <Box w="100%" minH="calc(100vh - 60px)">
      <Box mb={4}>
        <HStack justify="space-between" align="center" mb={2}>
          <Heading size="lg">Admin Dashboard</Heading>
          <Badge colorScheme="red" p={2} fontSize="md">Admin Mode</Badge>
        </HStack>
        <Divider />
      </Box>

      <Tabs variant="enclosed" w="100%">
        <TabList>
          <Tab>User Management</Tab>
          <Tab>Artworks</Tab>
          <Tab>Votes</Tab>
          <Tab>Token Distribution</Tab>
          <Tab>Debug Info</Tab>
        </TabList>

        <TabPanels>
          {/* User Management Tab */}
          <TabPanel p={0}>
            <Box>
              <Box mb={4}>
                <HStack justify="space-between" align="center">
                  <Heading size="md">User Management</Heading>
                  <Text color="gray.500" fontSize="sm">
                    Manage all users and their permissions
                  </Text>
                </HStack>
              </Box>
              <Box>
                <UserManagement />
              </Box>
            </Box>
          </TabPanel>

          {/* Artworks Tab */}
          <TabPanel p={0}>
            <Box>
              <ArtworkManagement />
            </Box>
          </TabPanel>

          {/* Votes Tab */}
          <TabPanel p={0}>
            <Box>
              <VoteManagement />
            </Box>
          </TabPanel>

          {/* Token Distribution Tab */}
          <TabPanel p={0}>
            <Box>
              <Box px={8} py={4}>
                <Heading size="md">Token Distribution Testing</Heading>
              </Box>
              <Box px={8}>
                <TokenDistributionTest />
              </Box>
            </Box>
          </TabPanel>

          {/* Debug Info Tab */}
          <TabPanel px={8} py={4}>
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
    </Box>
  );
} 