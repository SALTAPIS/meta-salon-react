import React from 'react';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  Code,
  useToast,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Badge,
} from '@chakra-ui/react';
import { supabase } from '../../lib/supabaseClient';
import { getSession } from '../../utils/session';
import { VoteService } from '../../services/VoteService';

interface TestResponse {
  status: number;
  data: unknown;
  error?: Error;
}

interface DebugInfo {
  session: unknown;
  environment: {
    supabaseUrl?: string;
    hasAnonKey?: boolean;
    hasServiceKey?: boolean;
  };
}

export function DebugPage() {
  // Pre-filled test values
  const [artworkId, setArtworkId] = React.useState('2aea6257-3bcf-417b-a51c-bae0c87451dd');
  const [packId, setPackId] = React.useState('7282e82c-9ef9-4e4f-9a6b-60e4b7e00f04');
  const [voteValue, setVoteValue] = React.useState('1');
  const [response, setResponse] = React.useState<TestResponse | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [debugInfo, setDebugInfo] = React.useState<DebugInfo | null>(null);
  const toast = useToast();

  // Load debug info on mount
  React.useEffect(() => {
    loadDebugInfo();
  }, []);

  const loadDebugInfo = async () => {
    const session = await getSession();
    const env = {
      supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
      hasAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY,
      hasServiceKey: !!import.meta.env.VITE_SUPABASE_SERVICE_KEY,
    };

    setDebugInfo({
      session,
      environment: env
    });
  };

  const handleTest = async () => {
    try {
      setLoading(true);
      setResponse(null);

      // Call VoteService directly
      await VoteService.castVote(artworkId, packId, parseInt(voteValue));

      // Set success response
      setResponse({
        status: 200,
        data: { success: true },
        error: undefined
      });

      toast({
        title: 'Success',
        description: 'Vote cast successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

    } catch (err) {
      console.error('Test error:', err);
      setResponse({
        status: 500,
        data: null,
        error: err as Error
      });

      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Unknown error',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={6} align="stretch">
        <Heading size="lg">Vote Testing</Heading>

        <Box p={6} borderWidth={1} borderRadius="lg" width="100%">
          <VStack spacing={4}>
            <FormControl>
              <FormLabel>Artwork ID (pre-filled)</FormLabel>
              <Input value={artworkId} isReadOnly />
            </FormControl>

            <FormControl>
              <FormLabel>Vote Pack ID (pre-filled)</FormLabel>
              <Input value={packId} isReadOnly />
            </FormControl>

            <FormControl>
              <FormLabel>Vote Value</FormLabel>
              <Input
                type="number"
                value={voteValue}
                onChange={(e) => setVoteValue(e.target.value)}
                min="1"
                max="100"
              />
            </FormControl>

            <Button
              colorScheme="blue"
              onClick={handleTest}
              isLoading={loading}
              loadingText="Testing..."
              width="full"
            >
              Cast Vote
            </Button>
          </VStack>
        </Box>

        {response && (
          <Box p={6} borderWidth={1} borderRadius="lg" bg={response.error ? 'red.50' : 'green.50'}>
            <VStack spacing={4} align="stretch">
              <Text fontWeight="bold">
                Status: {response.status}
              </Text>
              
              {response.data && (
                <>
                  <Text fontWeight="bold">Response:</Text>
                  <Code p={4} borderRadius="md" whiteSpace="pre-wrap">
                    {JSON.stringify(response.data, null, 2)}
                  </Code>
                </>
              )}

              {response.error && (
                <>
                  <Text fontWeight="bold" color="red.500">Error:</Text>
                  <Code p={4} borderRadius="md" whiteSpace="pre-wrap" bg="red.100">
                    {JSON.stringify(response.error, null, 2)}
                  </Code>
                </>
              )}
            </VStack>
          </Box>
        )}
      </VStack>
    </Container>
  );
} 