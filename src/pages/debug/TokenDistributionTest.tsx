import { useState } from 'react';
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Button,
  useToast,
  Code,
  Alert,
  AlertIcon,
  Divider,
  Input,
  FormControl,
  FormLabel,
} from '@chakra-ui/react';
import { ArtistService } from '../../services/ArtistService';

interface TestResult {
  step: string;
  success: boolean;
  data: Record<string, unknown>;
  error?: string;
}

export function TokenDistributionTest() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [testArtworkId, setTestArtworkId] = useState('');
  const toast = useToast();

  const addResult = (result: TestResult) => {
    setResults(prev => [...prev, result]);
  };

  const runTests = async () => {
    try {
      setIsRunning(true);
      setResults([]);

      // Test 1: Get payout summary
      try {
        const summary = await ArtistService.getPayoutSummary();
        addResult({
          step: 'Get Payout Summary',
          success: true,
          data: { summary }
        });
      } catch (error) {
        addResult({
          step: 'Get Payout Summary',
          success: false,
          data: {},
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Test 2: Get payout history
      try {
        const history = await ArtistService.getPayoutHistory();
        addResult({
          step: 'Get Payout History',
          success: true,
          data: { history }
        });
      } catch (error) {
        addResult({
          step: 'Get Payout History',
          success: false,
          data: {},
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }

      // Test 3: Calculate available payout
      if (!testArtworkId) {
        addResult({
          step: 'Calculate Available Payout',
          success: false,
          data: {},
          error: 'No artwork ID provided'
        });
      } else {
        try {
          const available = await ArtistService.getAvailablePayout(testArtworkId);
          addResult({
            step: 'Calculate Available Payout',
            success: true,
            data: { artwork_id: testArtworkId, available }
          });

          // Test 4: Request payout (if available)
          if (available > 0) {
            try {
              const payoutId = await ArtistService.requestPayout(testArtworkId, available);
              addResult({
                step: 'Request Payout',
                success: true,
                data: { payout_id: payoutId, amount: available }
              });
            } catch (error) {
              addResult({
                step: 'Request Payout',
                success: false,
                data: {},
                error: error instanceof Error ? error.message : 'Unknown error'
              });
            }
          } else {
            addResult({
              step: 'Request Payout',
              success: false,
              data: { available },
              error: 'No funds available for payout'
            });
          }
        } catch (error) {
          addResult({
            step: 'Calculate Available Payout',
            success: false,
            data: {},
            error: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      }

      toast({
        title: 'Tests completed',
        status: results.every(r => r.success) ? 'success' : 'warning',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Test error:', error);
      toast({
        title: 'Test error',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Container maxW="container.lg" py={8}>
      <VStack spacing={8} align="stretch">
        <Heading size="xl">Token Distribution Test</Heading>

        <FormControl>
          <FormLabel>Test Artwork ID</FormLabel>
          <Input
            value={testArtworkId}
            onChange={(e) => setTestArtworkId(e.target.value)}
            placeholder="Enter artwork ID to test"
            mb={4}
          />
        </FormControl>

        <Button
          colorScheme="blue"
          onClick={runTests}
          isLoading={isRunning}
          loadingText="Running Tests..."
        >
          Run Tests
        </Button>

        <VStack spacing={4} align="stretch">
          {results.map((result, index) => (
            <Box key={index} p={4} borderWidth={1} borderRadius="md">
              <VStack align="stretch" spacing={2}>
                <Heading size="sm">{result.step}</Heading>
                
                {result.success ? (
                  <Alert status="success">
                    <AlertIcon />
                    Success
                  </Alert>
                ) : (
                  <Alert status="error">
                    <AlertIcon />
                    {result.error}
                  </Alert>
                )}

                {Object.keys(result.data).length > 0 && (
                  <>
                    <Divider />
                    <Text fontWeight="bold">Response:</Text>
                    <Code p={2} borderRadius="md" whiteSpace="pre-wrap">
                      {JSON.stringify(result.data, null, 2)}
                    </Code>
                  </>
                )}
              </VStack>
            </Box>
          ))}
        </VStack>
      </VStack>
    </Container>
  );
}