import React from 'react';
import { Container, Heading, SimpleGrid, Box, Text, VStack, Stat, StatLabel, StatNumber, Divider } from '@chakra-ui/react';
import { useAuth } from '../../components/auth/AuthProvider';
import { TokenBalance } from '../../components/token/TokenBalance';
import { VotePacks } from '../../components/token/VotePacks';

export default function DashboardPage() {
  const { user } = useAuth();

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading as="h1" size="xl" mb={2}>Dashboard</Heading>
          <Text color="gray.600">
            Welcome back{user?.email ? `, ${user.email}` : ''}
          </Text>
        </Box>
        
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

        <Divider />

        <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={8}>
          <Box>
            <TokenBalance />
          </Box>
          <Box>
            <VotePacks />
          </Box>
        </SimpleGrid>
      </VStack>
    </Container>
  );
} 