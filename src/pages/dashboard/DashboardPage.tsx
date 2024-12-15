import {
  Container,
  VStack,
  Box,
  useColorModeValue,
  Heading,
  Spinner,
  Center,
  Text,
} from '@chakra-ui/react';
import { TokenBalance } from '../../components/token/TokenBalance';
import { VotePacks } from '../../components/token/VotePacks';
import { useAuth } from '../../hooks/useAuth';
import { Navigate } from 'react-router-dom';

const DashboardPage = () => {
  const { user, isLoading } = useAuth();
  const pageBgColor = useColorModeValue('gray.50', 'gray.900');

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
    <Box bg={pageBgColor} minH="calc(100vh - 60px)">
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          <VStack align="flex-start" spacing={1}>
            <Heading>Welcome back, {user.display_name}</Heading>
            <Text color="gray.500">@{user.username}</Text>
          </VStack>
          
          <Box>
            <TokenBalance />
          </Box>
          
          <Box>
            <VotePacks />
          </Box>
        </VStack>
      </Container>
    </Box>
  );
};

export default DashboardPage; 