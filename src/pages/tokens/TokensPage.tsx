import {
  Container,
  SimpleGrid,
  Box,
  Heading,
} from '@chakra-ui/react';
import { TokenBalance } from '../../components/token/TokenBalance';
import { VotePacks } from '../../components/token/VotePacks';
import { useAuth } from '../../hooks/useAuth';
import { Navigate } from 'react-router-dom';

export function TokensPage() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/auth/signin" />;
  }

  return (
    <div>
      <Container maxW="container.xl" py={8}>
        <Heading mb={6}>Tokens & Vote Packs</Heading>
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
          <Box>
            <TokenBalance />
          </Box>
          <Box>
            <VotePacks />
          </Box>
        </SimpleGrid>
      </Container>
    </div>
  );
} 