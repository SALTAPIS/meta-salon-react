import { useEffect, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Container,
  VStack,
  Image,
  Heading,
  Text,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  useColorModeValue,
  Badge,
  HStack,
  Divider,
  Link,
} from '@chakra-ui/react';
import { ArtworkService } from '../../services/ArtworkService';
import { VotePanel } from '../../components/artwork/VotePanel';
import type { Artwork } from '../../types/database.types';

export function ArtworkDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    const loadArtwork = async () => {
      if (!id) return;

      try {
        setIsLoading(true);
        const artworkData = await ArtworkService.getArtwork(id);
        setArtwork(artworkData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load artwork');
      } finally {
        setIsLoading(false);
      }
    };

    loadArtwork();
  }, [id]);

  if (isLoading) {
    return (
      <Center py={20}>
        <Spinner size="xl" />
      </Center>
    );
  }

  if (error || !artwork) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="error">
          <AlertIcon />
          {error || 'Artwork not found'}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box
          borderWidth={1}
          borderRadius="lg"
          overflow="hidden"
          bg={bgColor}
          borderColor={borderColor}
        >
          <Image
            src={artwork.image_url}
            alt={artwork.title}
            objectFit="contain"
            width="100%"
            height="600px"
          />
          <Box p={6}>
            <VStack align="stretch" spacing={4}>
              <HStack justify="space-between" align="center">
                <Box>
                  <Heading size="xl" mb={2}>{artwork.title}</Heading>
                  {artwork.profiles?.username && (
                    <Link
                      as={RouterLink}
                      to={`/${artwork.profiles.username}`}
                      color="blue.500"
                      fontSize="lg"
                    >
                      by {artwork.profiles.display_name || artwork.profiles.username}
                    </Link>
                  )}
                </Box>
              </HStack>

              <Text color="gray.600">{artwork.description}</Text>

              <HStack>
                <Badge colorScheme="blue">
                  {artwork.status.charAt(0).toUpperCase() + artwork.status.slice(1)}
                </Badge>
                {artwork.challenge_id && (
                  <Badge colorScheme="purple">
                    Challenge Entry
                  </Badge>
                )}
              </HStack>

              <Divider />

              <VotePanel artworkId={artwork.id} artwork={artwork} />
            </VStack>
          </Box>
        </Box>
      </VStack>
    </Container>
  );
} 