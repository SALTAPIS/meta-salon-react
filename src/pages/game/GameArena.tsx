/** @jsxImportSource react */
import {
  Box,
  Button,
  VStack,
  Text,
  useColorModeValue,
  Center,
  Spinner,
  Image as ChakraImage,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { useVotingArena } from '../../hooks/useVotingArena';
import { useState } from 'react';

interface GameArenaProps {
  onExit: () => void;
}

export function GameArena({ onExit }: GameArenaProps) {
  const bg = useColorModeValue('white', 'gray.800');
  const [hoveredArtwork, setHoveredArtwork] = useState<string | null>(null);
  
  const { 
    currentPair,
    isLoading,
    error,
  } = useVotingArena();

  if (isLoading) {
    return (
      <Center h="100vh" bg={bg}>
        <Spinner size="xl" />
      </Center>
    );
  }

  if (error) {
    const errorMessage = typeof error === 'string' ? error : 'An error occurred';
    return (
      <Center h="100vh" bg={bg}>
        <VStack spacing={4}>
          <Text color="red.500">{errorMessage}</Text>
          <Button as={RouterLink} to="/" colorScheme="blue">
            Return Home
          </Button>
        </VStack>
      </Center>
    );
  }

  if (!currentPair) {
    return (
      <Center h="100vh" bg={bg}>
        <VStack spacing={4}>
          <Text fontSize="xl">No more artworks to vote on!</Text>
          <Button onClick={onExit} colorScheme="blue">
            Return to Game Menu
          </Button>
        </VStack>
      </Center>
    );
  }

  return (
    <Box display="flex" h="calc(100vh - 57px)" alignItems="center" justifyContent="center" gap={8} px={8}>
      {/* Left Artwork */}
      <Box 
        flex={1}
        maxW="45vw"
        position="relative"
        cursor="pointer"
        onMouseEnter={() => setHoveredArtwork(currentPair.left.id)}
        onMouseLeave={() => setHoveredArtwork(null)}
      >
        <ChakraImage
          src={currentPair.left.image_url}
          alt={currentPair.left.title || ""}
          objectFit="contain"
          w="100%"
          h="100%"
          transition="all 0.8s cubic-bezier(0.4, 0, 0.2, 1)"
          transform={hoveredArtwork === currentPair.left.id ? 'scale(1.05)' : 'scale(1)'}
          loading="eager"
          style={{ maxWidth: '100%', maxHeight: '100%' }}
        />
      </Box>

      {/* Right Artwork */}
      <Box 
        flex={1}
        maxW="45vw"
        position="relative"
        cursor="pointer"
        onMouseEnter={() => setHoveredArtwork(currentPair.right.id)}
        onMouseLeave={() => setHoveredArtwork(null)}
      >
        <ChakraImage
          src={currentPair.right.image_url}
          alt={currentPair.right.title || ""}
          objectFit="contain"
          w="100%"
          h="100%"
          transition="all 0.8s cubic-bezier(0.4, 0, 0.2, 1)"
          transform={hoveredArtwork === currentPair.right.id ? 'scale(1.05)' : 'scale(1)'}
          loading="eager"
          style={{ maxWidth: '100%', maxHeight: '100%' }}
        />
      </Box>
    </Box>
  );
} 