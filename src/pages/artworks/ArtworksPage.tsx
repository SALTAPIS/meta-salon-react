import React from 'react';
import {
  Box,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  Container,
  useColorModeValue,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { ArtworkService } from '../../services/ArtworkService';
import type { Artwork } from '../../types/database.types';
import { ArtworkCard } from '../game/ArtworkCard';

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
      <Container py={8}>
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Box
      sx={{
        columnCount: [1, 2, 3, 4, 5, 6],
        columnGap: "1.5rem",
        "& > div": {
          marginBottom: "3rem",
          breakInside: "avoid",
        }
      }}
    >
      {artworks.map((artwork: Artwork) => (
        <Box
          key={artwork.id}
          as={RouterLink}
          to={`/artwork/${artwork.id}`}
          borderWidth={1}
          overflow="hidden"
          bg={bgColor}
          borderColor={borderColor}
          transition="all 0.2s"
          _hover={{ transform: 'translateY(-4px)', shadow: 'lg' }}
          display="inline-block"
          w="100%"
        >
          <ArtworkCard artwork={artwork} showStats={true} />
        </Box>
      ))}
    </Box>
  );
} 