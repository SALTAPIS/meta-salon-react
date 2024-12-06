import {
  Container,
  SimpleGrid,
  Box,
  Heading,
  Text,
  useColorModeValue,
  VStack,
  Flex,
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
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
      <Container maxW="7xl" py={8}>
        <VStack spacing={8} align="stretch">
          {/* Welcome and Balance Section */}
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
            <Box
              p={6}
              bg={bgColor}
              borderWidth="1px"
              borderColor={borderColor}
              borderRadius="lg"
              shadow="sm"
              height="full"
              display="flex"
              flexDirection="column"
              justifyContent="center"
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
              <TokenBalance />
            </Box>
          </SimpleGrid>

          {/* Vote Packs Section */}
          <Box
            bg={bgColor}
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="lg"
            shadow="sm"
            overflow="hidden"
          >
            <VotePacks userId={user.id} />
          </Box>

          {/* Connection Status */}
          <Flex justify="center" py={4}>
            <ConnectionStatus status={realtimeStatus} />
          </Flex>
        </VStack>
      </Container>
    </Box>
  );
};

export default DashboardPage; 