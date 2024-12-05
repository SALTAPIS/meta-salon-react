import {
  Container,
  SimpleGrid,
  Box,
  Heading,
  Text,
} from '@chakra-ui/react';
import { TokenBalance } from '../../components/token/TokenBalance';
import { VotePacks } from '../../components/token/VotePacks';
import { useAuth } from '../../hooks/auth/useAuth';
import { Navigate } from 'react-router-dom';
import { MainLayout } from '../../layouts/MainLayout';

export function TokensPage() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/auth/signin" />;
  }

  return (
    <MainLayout>
      <Container maxW="container.xl" py={8}>
        <Heading mb={6}>Tokens & Vote Packs</Heading>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
          <Box>
            <TokenBalance />
          </Box>
          <Box>
            <VotePacks userId={user.id} />
          </Box>
        </SimpleGrid>
      </Container>
    </MainLayout>
  );
} 