import {
  Container,
  SimpleGrid,
  Box,
  Heading,
  Text,
  useColorModeValue,
  VStack,
  Button,
  useToast,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatGroup,
} from '@chakra-ui/react';
import { VotePacks } from '../../components/token/VotePacks';
import { useAuth } from '../../hooks/auth/useAuth';
import { useTokens } from '../../hooks/token/useTokens';
import { checkDatabaseSetup } from '../../lib/supabase';
import ConnectionStatus from '../../components/token/ConnectionStatus';

const DashboardPage = () => {
  const { user } = useAuth();
  const { balance, votePacks, transactions, realtimeStatus } = useTokens();
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  if (!user?.id) return null;

  const handleTestSetup = async () => {
    try {
      const isWorking = await checkDatabaseSetup();
      toast({
        title: isWorking ? 'Setup Check Passed' : 'Setup Check Failed',
        description: isWorking 
          ? 'All database tables and policies are working correctly' 
          : 'There were issues with the database setup. Check the console for details.',
        status: isWorking ? 'success' : 'error',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Test failed:', error);
      toast({
        title: 'Test Failed',
        description: 'An error occurred while testing the setup',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Container maxW="7xl" py={8}>
      <VStack spacing={8} align="stretch">
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
          <Box
            p={6}
            bg={bgColor}
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="lg"
            shadow="sm"
          >
            <Heading size="md" mb={4}>
              Welcome Back
            </Heading>
            <Text color="gray.500" mb={4}>
              Your art journey continues here. Vote on artworks, earn tokens, and
              join the community.
            </Text>
            <Button
              size="sm"
              colorScheme="blue"
              variant="outline"
              onClick={handleTestSetup}
            >
              Test Database Setup
            </Button>
            <ConnectionStatus status={realtimeStatus} />
          </Box>

          <Box
            p={6}
            bg={bgColor}
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="lg"
            shadow="sm"
          >
            <StatGroup>
              <Stat>
                <StatLabel>Balance</StatLabel>
                <StatNumber>{balance}</StatNumber>
                <StatHelpText>Available tokens</StatHelpText>
              </Stat>
              <Stat>
                <StatLabel>Votes</StatLabel>
                <StatNumber>
                  {votePacks.reduce((total, pack) => total + pack.votes_remaining, 0)}
                </StatNumber>
                <StatHelpText>Available votes</StatHelpText>
              </Stat>
              <Stat>
                <StatLabel>Transactions</StatLabel>
                <StatNumber>{transactions.length}</StatNumber>
                <StatHelpText>Total transactions</StatHelpText>
              </Stat>
            </StatGroup>
          </Box>
        </SimpleGrid>

        <Box
          p={6}
          bg={bgColor}
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="lg"
          shadow="sm"
        >
          <VotePacks userId={user.id} />
        </Box>
      </VStack>
    </Container>
  );
};

export default DashboardPage; 