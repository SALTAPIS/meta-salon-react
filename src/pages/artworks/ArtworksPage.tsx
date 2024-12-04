import { Container, Heading, SimpleGrid, Box, Text, VStack } from '@chakra-ui/react';

export default function ArtworksPage() {
  return (
    <Container maxW="6xl" py={8}>
      <VStack spacing={6} align="stretch">
        <Heading as="h1" size="xl">Artworks Gallery</Heading>
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {/* Placeholder artwork cards - will be replaced with real data */}
          <Box borderRadius="lg" overflow="hidden" borderWidth="1px">
            <Box h="200px" bg="gray.100" />
            <Box p={4}>
              <Text fontWeight="semibold">Coming Soon</Text>
              <Text fontSize="sm" color="gray.500">Artist Name</Text>
            </Box>
          </Box>
        </SimpleGrid>
      </VStack>
    </Container>
  );
} 