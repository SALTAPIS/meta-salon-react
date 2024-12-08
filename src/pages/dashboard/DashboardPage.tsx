import {
  Container,
  VStack,
  Box,
  useColorModeValue,
  Heading,
} from '@chakra-ui/react';
import { TokenBalance } from '../../components/token/TokenBalance';
import { VotePacks } from '../../components/token/VotePacks';
import { useAuth } from '../../hooks/auth/useAuth';
import { Navigate } from 'react-router-dom';

const DashboardPage = () => {
  const { user } = useAuth();
  const pageBgColor = useColorModeValue('gray.50', 'gray.900');

  if (!user) {
    return <Navigate to="/auth/signin" />;
  }

  return (
    <Box bg={pageBgColor} minH="calc(100vh - 60px)">
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          <Heading>Dashboard</Heading>
          
          <Box>
            <TokenBalance />
          </Box>
          
          <Box>
            <VotePacks userId={user.id} />
          </Box>
        </VStack>
      </Container>
    </Box>
  );
};

export default DashboardPage; 