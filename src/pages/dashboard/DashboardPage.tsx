import {
  Container,
  SimpleGrid,
  Box,
  Heading,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import { TokenBalance } from '../../components/token/TokenBalance';
import { VotePacks } from '../../components/token/VotePacks';
import { useAuth } from '../../hooks/auth/useAuth';

const DashboardPage = () => {
  const { user } = useAuth();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  if (!user?.id) return null;

  return (
    <Container maxW="7xl" py={8}>
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
          <Text color="gray.500">
            Your art journey continues here. Vote on artworks, earn tokens, and
            join the community.
          </Text>
        </Box>

        <Box
          p={6}
          bg={bgColor}
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="lg"
          shadow="sm"
        >
          <Heading size="md" mb={4}>
            Quick Stats
          </Heading>
          <Text color="gray.500">
            Track your token balance and voting power.
          </Text>
        </Box>
      </SimpleGrid>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8} mt={8}>
        <Box>
          <TokenBalance userId={user.id} />
        </Box>
        <Box>
          <VotePacks userId={user.id} />
        </Box>
      </SimpleGrid>
    </Container>
  );
};

export default DashboardPage; 