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
import { UserStats } from '../../components/profile/UserStats';
import { useAuth } from '../../hooks/auth/useAuth';

const DashboardPage = () => {
  const { user } = useAuth();
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
            <UserStats userId={user.id} />
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