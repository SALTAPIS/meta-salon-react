import { Container, Heading, SimpleGrid, Box, Text, VStack, Stat, StatLabel, StatNumber } from '@chakra-ui/react';
import { useAuth } from '../../components/auth/AuthProvider';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <Container maxW="4xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Heading as="h1" size="xl">Dashboard</Heading>
        
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
          <Box p={6} borderRadius="lg" borderWidth="1px">
            <Stat>
              <StatLabel>Your Artworks</StatLabel>
              <StatNumber>0</StatNumber>
            </Stat>
          </Box>
          
          <Box p={6} borderRadius="lg" borderWidth="1px">
            <Stat>
              <StatLabel>Total Votes</StatLabel>
              <StatNumber>0</StatNumber>
            </Stat>
          </Box>
          
          <Box p={6} borderRadius="lg" borderWidth="1px">
            <Stat>
              <StatLabel>Current Rank</StatLabel>
              <StatNumber>-</StatNumber>
            </Stat>
          </Box>
        </SimpleGrid>

        <Box>
          <Heading as="h2" size="lg" mb={4}>Recent Activity</Heading>
          <Box p={4} borderRadius="lg" borderWidth="1px">
            <Text color="gray.500">No recent activity</Text>
          </Box>
        </Box>
      </VStack>
    </Container>
  );
} 