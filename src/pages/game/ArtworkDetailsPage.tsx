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
  HStack,
  Link,
  Stat,
  StatLabel,
  StatNumber,
} from '@chakra-ui/react';
import { ArtworkService } from '../../services/ArtworkService';
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
        const data = await ArtworkService.getArtwork(id);
        setArtwork(data);
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
                      to={`/user/${artwork.profiles.username}`}
                      color="blue.500"
                      fontSize="lg"
                    >
                      by {artwork.profiles.display_name || artwork.profiles.username}
                    </Link>
                  )}
                </Box>
              </HStack>

              <Text color="gray.600">{artwork.description}</Text>

              <HStack spacing={8} mt={4}>
                <Stat>
                  <StatLabel fontSize="lg">Vault Value</StatLabel>
                  <StatNumber fontSize="3xl" color="green.500">
                    {artwork.vault_value?.toFixed(2) || '0'} SLN
                  </StatNumber>
                </Stat>
                <Stat>
                  <StatLabel fontSize="lg">Total Votes</StatLabel>
                  <StatNumber fontSize="3xl">
                    {artwork.vote_count || 0}
                  </StatNumber>
                </Stat>
              </HStack>
            </VStack>
          </Box>
        </Box>
      </VStack>
    </Container>
  );
} 