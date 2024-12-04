import { Box, Container, Heading, Text, VStack } from '@chakra-ui/react';

export default function GamePage() {
  return (
    <Container maxW="4xl" py={8}>
      <VStack spacing={6} align="stretch">
        <Heading as="h1" size="xl">The Salon Game</Heading>
        <Text fontSize="lg">
          Welcome to Meta.Salon, where art meets competition. Learn how to participate
          in our unique digital art salon experience.
        </Text>
        <Box>
          <Heading as="h2" size="lg" mb={4}>How It Works</Heading>
          <Text>
            Meta.Salon is a modern interpretation of the historical art salons,
            where artists showcase their work and compete for recognition and prestige.
          </Text>
        </Box>
      </VStack>
    </Container>
  );
} 