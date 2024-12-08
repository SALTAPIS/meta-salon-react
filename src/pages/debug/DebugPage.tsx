import * as React from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import type { Session, User as SupabaseUser } from '@supabase/supabase-js';
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Code,
  Button,
  useToast,
  Divider,
  Badge,
  HStack,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
  Spinner,
} from '@chakra-ui/react';

interface DebugInfo {
  session: Session | null;
  profile: SupabaseUser | null;
  authState: Array<{
    event: string;
    timestamp: string;
    details?: {
      userId?: string;
      email?: string;
      hasProfile?: boolean;
    } | null;
  }>;
  errors: Array<{
    message: string;
    timestamp: string;
  }>;
}

export default function DebugPage() {
  const { user, isLoading } = useAuth();
  const [debugInfo, setDebugInfo] = React.useState<DebugInfo>({
    session: null,
    profile: null,
    authState: [],
    errors: [],
  });
  const toast = useToast();

  React.useEffect(() => {
    let mounted = true;
    console.log('Checking auth state...');

    async function checkAuth() {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Session error:', sessionError);
          throw sessionError;
        }

        console.log('Session result:', { hasSession: !!session, userId: session?.user?.id });

        // Get profile if session exists
        let profile = null;
        if (session?.user) {
          const { data, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
          
          if (profileError) {
            console.error('Profile error:', profileError);
            throw profileError;
          }
          profile = data;
          console.log('Profile loaded:', { id: profile.id, role: profile.role });
        }

        if (mounted) {
          setDebugInfo((prev: DebugInfo) => ({
            ...prev,
            session,
            profile,
            authState: [
              ...prev.authState,
              {
                event: session ? 'Session found' : 'No session',
                timestamp: new Date().toISOString(),
                details: session ? {
                  userId: session.user?.id,
                  email: session.user?.email,
                  hasProfile: !!profile
                } : null
              },
            ],
          }));
        }
      } catch (error) {
        console.error('Debug page error:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        if (mounted) {
          setDebugInfo((prev: DebugInfo) => ({
            ...prev,
            errors: [
              ...prev.errors,
              {
                message,
                timestamp: new Date().toISOString(),
              },
            ],
          }));
        }
      }
    }

    checkAuth();

    // Subscribe to auth changes
    console.log('Setting up auth state listener...');
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', { event, hasSession: !!session, userId: session?.user?.id });
      if (mounted) {
        setDebugInfo((prev: DebugInfo) => ({
          ...prev,
          session,
          authState: [
            ...prev.authState,
            {
              event,
              timestamp: new Date().toISOString(),
              details: session ? {
                userId: session.user?.id,
                email: session.user?.email,
              } : null
            },
          ],
        }));
      }
    });

    return () => {
      console.log('Cleaning up auth state listener...');
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // Empty dependency array to run only once

  const clearLocalStorage = () => {
    localStorage.clear();
    toast({
      title: 'Local storage cleared',
      status: 'info',
      duration: 3000,
    });
  };

  const refreshSession = async () => {
    try {
      console.log('Refreshing session...');
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      
      setDebugInfo((prev: DebugInfo) => ({
        ...prev,
        session,
        authState: [
          ...prev.authState,
          {
            event: 'Session refreshed',
            timestamp: new Date().toISOString(),
            details: session ? {
              userId: session.user?.id,
              email: session.user?.email,
            } : null
          },
        ],
      }));

      toast({
        title: 'Session refreshed',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      console.error('Session refresh error:', error);
      toast({
        title: 'Error refreshing session',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 3000,
      });
    }
  };

  if (isLoading) {
    return (
      <Container maxW="container.lg" py={8}>
        <VStack spacing={4}>
          <Spinner size="xl" />
          <Text>Loading auth state...</Text>
          <Text color="gray.500" fontSize="sm">
            Current time: {new Date().toISOString()}
          </Text>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading size="lg" mb={4}>Auth Debug Information</Heading>
          <Text color="gray.500" mb={4}>
            Current time: {new Date().toISOString()}
          </Text>
          <HStack spacing={4}>
            <Button onClick={refreshSession} colorScheme="blue" size="sm">
              Refresh Session
            </Button>
            <Button onClick={clearLocalStorage} colorScheme="red" size="sm">
              Clear Local Storage
            </Button>
          </HStack>
        </Box>

        <Divider />

        <Box>
          <Heading size="md" mb={4}>Auth Context State</Heading>
          <VStack spacing={4} align="stretch">
            <HStack>
              <Badge colorScheme={isLoading ? 'yellow' : 'green'}>
                {isLoading ? 'Loading' : 'Ready'}
              </Badge>
              <Badge colorScheme={user ? 'green' : 'red'}>
                {user ? 'Authenticated' : 'Not Authenticated'}
              </Badge>
            </HStack>
            <Text>Auth Listener: {debugInfo.authState.length > 0 ? 'Active' : 'Not active'}</Text>
          </VStack>
        </Box>

        <Accordion allowMultiple defaultIndex={[0, 1, 2, 3, 4, 5]}>
          <AccordionItem>
            <AccordionButton>
              <Box flex="1" textAlign="left">
                <Heading size="sm">Environment Variables</Heading>
              </Box>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel>
              <Code p={4} borderRadius="md" display="block" whiteSpace="pre">
                {JSON.stringify({
                  VITE_SITE_URL: import.meta.env.VITE_SITE_URL || window.location.origin,
                  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL || 'not set',
                  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'set' : 'not set',
                  VITE_SUPABASE_SERVICE_KEY: import.meta.env.VITE_SUPABASE_SERVICE_KEY ? 'set' : 'not set',
                }, null, 2)}
              </Code>
            </AccordionPanel>
          </AccordionItem>

          <AccordionItem>
            <AccordionButton>
              <Box flex="1" textAlign="left">
                <Heading size="sm">User Context</Heading>
              </Box>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel>
              <Code p={4} borderRadius="md" display="block" whiteSpace="pre">
                {JSON.stringify(user, null, 2)}
              </Code>
            </AccordionPanel>
          </AccordionItem>

          <AccordionItem>
            <AccordionButton>
              <Box flex="1" textAlign="left">
                <Heading size="sm">Current Session</Heading>
              </Box>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel>
              <Code p={4} borderRadius="md" display="block" whiteSpace="pre">
                {JSON.stringify(debugInfo.session, null, 2)}
              </Code>
            </AccordionPanel>
          </AccordionItem>

          <AccordionItem>
            <AccordionButton>
              <Box flex="1" textAlign="left">
                <Heading size="sm">Profile Data</Heading>
              </Box>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel>
              <Code p={4} borderRadius="md" display="block" whiteSpace="pre">
                {JSON.stringify(debugInfo.profile, null, 2)}
              </Code>
            </AccordionPanel>
          </AccordionItem>

          <AccordionItem>
            <AccordionButton>
              <Box flex="1" textAlign="left">
                <Heading size="sm">Auth State History</Heading>
              </Box>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel>
              <Code p={4} borderRadius="md" display="block" whiteSpace="pre">
                {JSON.stringify(debugInfo.authState, null, 2)}
              </Code>
            </AccordionPanel>
          </AccordionItem>

          <AccordionItem>
            <AccordionButton>
              <Box flex="1" textAlign="left">
                <Heading size="sm">Local Storage</Heading>
              </Box>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel>
              <Code p={4} borderRadius="md" display="block" whiteSpace="pre">
                {JSON.stringify(Object.fromEntries(
                  Object.entries(localStorage).map(([key, value]) => [
                    key,
                    key.includes('token') ? '[REDACTED]' : value
                  ])
                ), null, 2)}
              </Code>
            </AccordionPanel>
          </AccordionItem>

          <AccordionItem>
            <AccordionButton>
              <Box flex="1" textAlign="left">
                <Heading size="sm">Errors</Heading>
              </Box>
              <AccordionIcon />
            </AccordionButton>
            <AccordionPanel>
              <Code p={4} borderRadius="md" display="block" whiteSpace="pre">
                {JSON.stringify(debugInfo.errors, null, 2)}
              </Code>
            </AccordionPanel>
          </AccordionItem>
        </Accordion>
      </VStack>
    </Container>
  );
} 