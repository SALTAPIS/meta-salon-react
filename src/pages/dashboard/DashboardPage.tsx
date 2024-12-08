import {
  Container,
  VStack,
  Box,
  useColorModeValue,
  Heading,
  Spinner,
  Center,
  Text,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  Icon,
  Flex,
} from '@chakra-ui/react';
import { TokenBalance } from '../../components/token/TokenBalance';
import { VotePacks } from '../../components/token/VotePacks';
import { useAuth } from '../../hooks/useAuth';
import { Navigate } from 'react-router-dom';
import { FaCoins, FaVoteYea } from 'react-icons/fa';

const DashboardPage = () => {
  const { user, isLoading } = useAuth();
  const pageBgColor = useColorModeValue('gray.50', 'gray.900');
  const cardBgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  if (isLoading) {
    return (
      <Box bg={pageBgColor} minH="calc(100vh - 60px)">
        <Center h="calc(100vh - 60px)">
          <VStack spacing={4}>
            <Spinner size="xl" />
            <Text>Loading your dashboard...</Text>
          </VStack>
        </Center>
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/auth/signin" />;
  }

  return (
    <Box bg={pageBgColor} minH="calc(100vh - 60px)" py={8}>
      <Container maxW="container.xl">
        <VStack spacing={8} align="stretch">
          <Box>
            <Heading size="lg" mb={2}>Welcome back, {user.display_name || user.username || 'Artist'}</Heading>
            <Text color="gray.600">Manage your tokens and vote packs here</Text>
          </Box>
          
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
            <Card bg={cardBgColor} borderWidth="1px" borderColor={borderColor}>
              <CardHeader>
                <Flex align="center" gap={3}>
                  <Icon as={FaCoins} boxSize={5} color="yellow.500" />
                  <Heading size="md">Token Balance</Heading>
                </Flex>
              </CardHeader>
              <CardBody pt={0}>
                <TokenBalance />
              </CardBody>
            </Card>
            
            <Card bg={cardBgColor} borderWidth="1px" borderColor={borderColor}>
              <CardHeader>
                <Flex align="center" gap={3}>
                  <Icon as={FaVoteYea} boxSize={5} color="blue.500" />
                  <Heading size="md">Vote Packs</Heading>
                </Flex>
              </CardHeader>
              <CardBody pt={0}>
                <VotePacks />
              </CardBody>
            </Card>
          </SimpleGrid>
        </VStack>
      </Container>
    </Box>
  );
};

export default DashboardPage; 