import { useState } from 'react';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Text,
  VStack,
  Code,
  useToast,
} from '@chakra-ui/react';
import { supabase } from '../../lib/supabaseClient';

interface TestResponse {
  status: number;
  data?: any;
  error?: any;
}

export function EdgeFunctionTestPage() {
  const [artworkId, setArtworkId] = useState('');
  const [packId, setPackId] = useState('');
  const [voteValue, setVoteValue] = useState('1');
  const [response, setResponse] = useState<TestResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const handleTest = async () => {
    try {
      setLoading(true);
      setResponse(null);

      // Log request details
      console.log('Testing Edge Function with:', {
        artwork_id: artworkId,
        pack_id: packId,
        value: parseInt(voteValue)
      });

      // Make the request
      const { data, error } = await supabase.functions.invoke('cast-vote', {
        body: {
          artwork_id: artworkId,
          pack_id: packId,
          value: parseInt(voteValue)
        }
      });

      // Log response
      console.log('Edge Function response:', { data, error });

      // Set response state
      setResponse({
        status: error ? 400 : 200,
        data,
        error
      });

      // Show toast
      toast({
        title: error ? 'Error' : 'Success',
        description: error ? error.message : 'Test completed successfully',
        status: error ? 'error' : 'success',
        duration: 5000,
        isClosable: true,
      });

    } catch (err) {
      console.error('Test error:', err);
      setResponse({
        status: 500,
        error: err instanceof Error ? err.message : 'Unknown error'
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
    <Container maxW="container.md" py={8}>
      <VStack spacing={6} align="stretch">
        <Heading size="lg">Edge Function Test Page</Heading>
        
        <Box p={6} borderWidth={1} borderRadius="lg">
          <VStack spacing={4}>
            <FormControl>
              <FormLabel>Artwork ID</FormLabel>
              <Input
                value={artworkId}
                onChange={(e) => setArtworkId(e.target.value)}
                placeholder="Enter artwork UUID"
              />
            </FormControl>

            <FormControl>
              <FormLabel>Vote Pack ID</FormLabel>
              <Input
                value={packId}
                onChange={(e) => setPackId(e.target.value)}
                placeholder="Enter vote pack UUID"
              />
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
              Test Edge Function
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
                  <Text fontWeight="bold">Response Data:</Text>
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