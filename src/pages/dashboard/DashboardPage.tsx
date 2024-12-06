import {
  Container,
  SimpleGrid,
  Box,
  Heading,
  Text,
  useColorModeValue,
  VStack,
} from '@chakra-ui/react';
import { VotePacks } from '../../components/token/VotePacks';
import { TokenBalance } from '../../components/token/TokenBalance';
import { useAuth } from '../../hooks/auth/useAuth';
import { useTokens } from '../../hooks/token/useTokens';
import ConnectionStatus from '../../components/token/ConnectionStatus';

const DashboardPage = () => {
  const { user } = useAuth();
  const { realtimeStatus } = useTokens();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  if (!user?.id) return null;

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
          </Box>
          <Box>
            <TokenBalance />
          </Box>
        </SimpleGrid>

        <Box>
          <VotePacks userId={user.id} />
        </Box>

        <Box textAlign="center" py={4}>
          <ConnectionStatus status={realtimeStatus} />
        </Box>
      </VStack>
    </Container>
  );
};

export default DashboardPage; 