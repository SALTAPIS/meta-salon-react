import {
  Container,
  VStack,
  Heading,
  Text,
  Box,
  Code,
  Button,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { useSession } from '../../hooks/useSession';
import { AuthService } from '../../services/auth/authService';

export function DebugPage() {
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

  if (!session) {
    return (
      <Container maxW="container.lg" py={8}>
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
            Please sign in first to see debug information and access admin controls.
          </AlertDescription>
        </Alert>
      </Container>
    );
  }

  const isAdmin = session.user?.role === 'admin' || session.user?.user_metadata?.role === 'admin';

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={8} align="stretch">
        <Heading size="xl">Debug Information</Heading>

        <Box>
          <Heading size="md" mb={4}>Session Information</Heading>
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
        </Box>

        <Box>
          <Heading size="md" mb={4}>Role Information</Heading>
          <Text>Direct Role: {session?.user?.role || 'none'}</Text>
          <Text>Metadata Role: {session?.user?.user_metadata?.role || 'none'}</Text>
          {!isAdmin && (
            <Alert status="info" mt={4}>
              <AlertIcon />
              Not an admin? Click the button below to set your account as admin.
            </Alert>
          )}
          <Button
            mt={4}
            colorScheme="blue"
            onClick={handleSetAdmin}
            isDisabled={isAdmin}
          >
            {isAdmin ? 'Already Admin' : 'Set Admin Role'}
          </Button>
        </Box>

        <Box>
          <Heading size="md" mb={4}>Environment Information</Heading>
          <Code p={4} borderRadius="md" whiteSpace="pre-wrap">
            {JSON.stringify({
              NODE_ENV: import.meta.env.MODE,
              VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ? '✓ Set' : '✗ Missing',
              VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? '✓ Set' : '✗ Missing',
              VITE_SUPABASE_SERVICE_KEY: import.meta.env.VITE_SUPABASE_SERVICE_KEY ? '✓ Set' : '✗ Missing',
              VITE_SITE_URL: import.meta.env.VITE_SITE_URL || window.location.origin,
            }, null, 2)}
          </Code>
        </Box>
      </VStack>
    </Container>
  );
} 