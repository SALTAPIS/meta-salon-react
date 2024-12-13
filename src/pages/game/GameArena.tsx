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
  useToast,
  HStack,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { useVotingArena } from '../../hooks/useVotingArena';
import { useState, useCallback } from 'react';
import { useDebugMode } from '../../hooks/useDebugMode';
import { useTokens } from '../../hooks/token/useTokens';

interface GameArenaProps {
  onExit: () => void;
}

export function GameArena({ onExit }: GameArenaProps) {
  const bg = useColorModeValue('white', 'gray.800');
  const [hoveredArtwork, setHoveredArtwork] = useState<string | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const toast = useToast();
  const { debugMode } = useDebugMode();
  
  const { 
    currentPair,
    isLoading: arenaLoading,
    error: arenaError,
    castVote,
    artworks,
    remainingArtworks
  } = useVotingArena();

  const {
    votePacks,
    isLoading: tokenLoading,
    error: tokenError,
    refreshBalance
  } = useTokens();

  const isLoading = arenaLoading || tokenLoading;
  const error = arenaError || tokenError;

  const hasVotePacks = votePacks?.some(pack => 
    pack.votes_remaining > 0 && (!pack.expires_at || new Date(pack.expires_at) > new Date())
  );

  const handleVote = useCallback(async (artworkId: string) => {
    if (!currentPair || !hasVotePacks || isVoting) return;

    setIsVoting(true);
    try {
      await castVote(artworkId);
      await refreshBalance();
      
      if (debugMode) {
        toast({
          title: 'Vote recorded',
          description: 'Your vote has been cast successfully',
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (err) {
      console.error('Vote casting failed:', err);
      toast({
        title: 'Failed to cast vote',
        description: err instanceof Error ? err.message : 'Failed to cast vote',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsVoting(false);
    }
  }, [currentPair, hasVotePacks, isVoting, castVote, refreshBalance, debugMode, toast]);

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

  if (!hasVotePacks) {
    return (
      <Center h="100vh" bg={bg}>
        <VStack spacing={4}>
          <Text fontSize="xl">You need vote packs to participate</Text>
          <Button as={RouterLink} to="/tokens" colorScheme="blue">
            Get Vote Packs
          </Button>
        </VStack>
      </Center>
    );
  }

  return (
    <>
      {/* Main voting area */}
      <Box 
        position="fixed"
        top="57px"
        left={0}
        right={0}
        bottom="80px"
        display="flex"
        alignItems="center"
        justifyContent="center"
        gap={8}
        px={8}
        bg={bg}
      >
        {/* Left Artwork */}
        <Box 
          flex={1}
          maxW="45vw"
          maxH="80vh"
          position="relative"
          cursor="pointer"
          onMouseEnter={() => setHoveredArtwork(currentPair.left.id)}
          onMouseLeave={() => setHoveredArtwork(null)}
          onClick={() => handleVote(currentPair.left.id)}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <ChakraImage
            src={currentPair.left.image_url}
            alt={currentPair.left.title || ""}
            objectFit="contain"
            maxH="80vh"
            transition="all 0.8s cubic-bezier(0.4, 0, 0.2, 1)"
            transform={hoveredArtwork === currentPair.left.id ? 'scale(1.05)' : 'scale(1)'}
            loading="eager"
          />
        </Box>

        {/* Right Artwork */}
        <Box 
          flex={1}
          maxW="45vw"
          maxH="80vh"
          position="relative"
          cursor="pointer"
          onMouseEnter={() => setHoveredArtwork(currentPair.right.id)}
          onMouseLeave={() => setHoveredArtwork(null)}
          onClick={() => handleVote(currentPair.right.id)}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <ChakraImage
            src={currentPair.right.image_url}
            alt={currentPair.right.title || ""}
            objectFit="contain"
            maxH="80vh"
            transition="all 0.8s cubic-bezier(0.4, 0, 0.2, 1)"
            transform={hoveredArtwork === currentPair.right.id ? 'scale(1.05)' : 'scale(1)'}
            loading="eager"
          />
        </Box>
      </Box>

      {/* Vote Info Footer */}
      <Box
        position="fixed"
        bottom={0}
        left={0}
        right={0}
        borderTop="1px"
        borderColor={useColorModeValue('gray.200', 'gray.700')}
        bg={bg}
        h="80px"
        display="flex"
        alignItems="center"
        justifyContent="center"
        px={8}
      >
        <HStack spacing={48} width="100%" maxW="1200px" justify="center">
          <VStack spacing={1} align="center">
            <Text fontSize="lg">
              {votePacks?.reduce((sum, pack) => sum + (pack.votes_remaining || 0), 0) || 0}
            </Text>
            <Text fontSize="xs" color="gray.500" whiteSpace="nowrap">
              Votes Available
            </Text>
          </VStack>
          <VStack spacing={1} align="center">
            <Text fontSize="lg">
              {votePacks?.[0]?.vote_power || 1}x SLN
            </Text>
            <Text fontSize="xs" color="gray.500">
              Vote Power
            </Text>
          </VStack>
          <VStack spacing={1} align="center">
            <Text fontSize="lg">
              {remainingArtworks?.length || 0}/{artworks?.length || 0}
            </Text>
            <Text fontSize="xs" color="gray.500">
              Remaining Pairs
            </Text>
          </VStack>
        </HStack>
      </Box>
    </>
  );
} 