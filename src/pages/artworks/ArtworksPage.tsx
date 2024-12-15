import React from 'react';
import {
  Box,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  Container,
  useColorModeValue,
  Heading,
  VStack,
  Button,
  Divider,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { ArtworkService } from '../../services/ArtworkService';
import type { Artwork } from '../../types/database.types';
import { ArtworkCard } from '../game/ArtworkCard';
import { useAuth } from '../../hooks/useAuth';

export function ArtworksPage() {
  const [topArtworks, setTopArtworks] = React.useState<Artwork[]>([]);
  const [userArtworks, setUserArtworks] = React.useState<Artwork[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { user } = useAuth();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  React.useEffect(() => {
    const loadArtworks = async () => {
      try {
        setIsLoading(true);
        
        // Always load top artworks of the week
        const topData = await ArtworkService.getAllArtworks({
          timeFilter: 'week',
          sortBy: 'vault_value',
          limit: 10
        });
        setTopArtworks(topData);

        // Load user's winning artworks if logged in
        if (user) {
          const userData = await ArtworkService.getAllArtworks({
            timeFilter: 'month',
            sortBy: 'vault_value'
          });
          setUserArtworks(userData);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load artworks');
      } finally {
        setIsLoading(false);
      }
    };

    loadArtworks();
  }, [user]);

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

  const ArtworkGrid = ({ artworks, dense = false }: { artworks: Artwork[], dense?: boolean }) => (
    <Box
      sx={{
        columnCount: dense ? [1, 2, 3, 4, 5, 6] : [1, 2, 3, 4],
        columnGap: "1.5rem",
        "& > div": {
          marginBottom: dense ? "1rem" : "1.5rem",
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

  // For non-logged in users
  if (!user) {
    return (
      <Box p={8}>
        <Heading size="lg" mb={8} textAlign="left">
          Top 10 Winning Artworks of the Week
        </Heading>
        <ArtworkGrid artworks={topArtworks} />
      </Box>
    );
  }

  // For logged-in users with no vote history
  if (userArtworks.length === 0) {
    return (
      <Box>
        <Center minH="50vh">
          <VStack spacing={8}>
            <Heading 
              size="2xl" 
              fontFamily="'Allan', cursive"
              letterSpacing="wide"
            >
              A New Beginning
            </Heading>
            <Button
              as={RouterLink}
              to="/game"
              size="lg"
              colorScheme="blue"
            >
              Start Playing
            </Button>
          </VStack>
        </Center>

        <Divider my={8} />

        <Box p={8}>
          <Heading size="lg" mb={8} textAlign="left">
            Top 10 Winning Artworks of the Week
          </Heading>
          <ArtworkGrid artworks={topArtworks} />
        </Box>
      </Box>
    );
  }

  // For logged-in users with vote history
  return (
    <Box>
      <Box p={8}>
        <Heading size="lg" mb={8} textAlign="left">
          Your Winning Artworks
        </Heading>
        <ArtworkGrid artworks={userArtworks} dense={true} />
      </Box>

      <Divider my={8} />

      <Box p={8}>
        <Heading size="lg" mb={8} textAlign="left">
          Top 10 Winning Artworks of the Week
        </Heading>
        <ArtworkGrid artworks={topArtworks} dense={true} />
      </Box>
    </Box>
  );
} 