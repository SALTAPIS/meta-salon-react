import React from 'react';
import {
  Box,
  Container,
  SimpleGrid,
  Heading,
  Text,
  Image,
  VStack,
  HStack,
  Badge,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  Button,
  useColorModeValue,
  Icon,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { ArtworkService } from '../../services/ArtworkService';
import type { Artwork } from '../../types/database.types';
import { FaGamepad } from 'react-icons/fa';

export function ArtworksPage() {
  const [artworks, setArtworks] = React.useState<Artwork[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  React.useEffect(() => {
    const loadArtworks = async () => {
      try {
        setIsLoading(true);
        const data = await ArtworkService.getAllArtworks();
        setArtworks(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load artworks');
      } finally {
        setIsLoading(false);
      }
    };

    loadArtworks();
  }, []);

  if (isLoading) {
    return (
      <Center py={20}>
        <Spinner size="xl" />
      </Center>
    );
  }

  if (error) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading size="xl" mb={2}>Artworks Gallery</Heading>
          <Text color="gray.600" mb={4}>Discover amazing artworks</Text>
          <Button
            as={RouterLink}
            to="/vote"
            colorScheme="blue"
            size="lg"
            leftIcon={<Icon as={FaGamepad} />}
          >
            Enter Voting Arena
          </Button>
        </Box>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={8}>
          {artworks.map((artwork: Artwork) => (
            <Box
              key={artwork.id}
              borderWidth={1}
              borderRadius="lg"
              overflow="hidden"
              bg={bgColor}
              borderColor={borderColor}
              transition="all 0.2s"
              _hover={{ transform: 'translateY(-4px)', shadow: 'lg' }}
            >
              <Image
                src={artwork.image_url}
                alt={artwork.title}
                objectFit="cover"
                height="300px"
                width="100%"
              />
              
              <VStack p={4} align="stretch" spacing={3}>
                <Heading size="md">{artwork.title}</Heading>
                <Text noOfLines={2} color="gray.600">
                  {artwork.description}
                </Text>

                <HStack>
                  <Badge colorScheme="blue">
                    {artwork.vault_status}
                  </Badge>
                  {artwork.challenge_id && (
                    <Badge colorScheme="purple">
                      Challenge Entry
                    </Badge>
                  )}
                </HStack>

                <Button
                  as={RouterLink}
                  to={`/artwork/${artwork.id}`}
                  colorScheme="blue"
                  variant="outline"
                  size="sm"
                >
                  View Details
                </Button>
              </VStack>
            </Box>
          ))}
        </SimpleGrid>
      </VStack>
    </Container>
  );
} 