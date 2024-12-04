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

export default function TokensPage() {
  const { user } = useAuth();

  if (!user?.id) return null;

  return (
    <Container maxW="7xl" py={8}>
      <Box mb={8}>
        <Heading size="lg">Tokens & Vote Packs</Heading>
        <Text color="gray.500" mt={2}>
          Manage your tokens and purchase vote packs to participate in artwork voting.
        </Text>
      </Box>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
        <Box>
          <TokenBalance userId={user.id} />
        </Box>
        <Box>
          <VotePacks userId={user.id} />
        </Box>
      </SimpleGrid>
    </Container>
  );
} 