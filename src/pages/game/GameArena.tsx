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
  Heading,
  Icon,
  Stack,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { useVotingArena } from '../../hooks/useVotingArena';
import { useState, useCallback } from 'react';
import { useDebugMode } from '../../hooks/useDebugMode';
import { useTokens } from '../../hooks/token/useTokens';
import { FaHeart } from 'react-icons/fa';

interface GameArenaProps {
  onExit?: () => void;
}

export function GameArena({ onExit }: GameArenaProps) {
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
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
    const errorMessage = error instanceof Error ? error.message : error;
    if (typeof errorMessage === 'string' && errorMessage.includes('Only one artwork remaining')) {
      return (
        <Center h="100vh" bg={bg}>
          <VStack spacing={8} maxW="container.sm" textAlign="center" p={4}>
            <Heading 
              size={['xl', '2xl']} 
              fontFamily="'Allan', cursive"
              letterSpacing="wide"
              textAlign="center"
              px={4}
            >
              Thank you for sharing your love for art
            </Heading>
            <Text fontSize={['md', 'lg']} color="gray.500" maxW="600px" textAlign="center" px={4}>
              You've voted on all available artworks. Why not check out your winning choices or submit your own masterpiece?
            </Text>
            <Stack 
              direction={['column', 'row']} 
              spacing={4} 
              w="100%" 
              px={4}
              justify="center"
            >
              <Button
                as={RouterLink}
                to="/artworks"
                size="lg"
                colorScheme="blue"
                leftIcon={<Icon as={FaHeart} />}
                width={['100%', 'auto']}
              >
                See Your Winners
              </Button>
              <Button
                as={RouterLink}
                to="/submit"
                size="lg"
                variant="outline"
                colorScheme="blue"
                width={['100%', 'auto']}
              >
                Submit your Artworks
              </Button>
            </Stack>
          </VStack>
        </Center>
      );
    }

    return (
      <Center h="100vh" bg={bg}>
        <VStack spacing={4}>
          <Text color="red.500">{errorMessage}</Text>
          <Button as={RouterLink} to="/" colorScheme="blue" onClick={onExit}>
            Return Home
          </Button>
        </VStack>
      </Center>
    );
  }

  if (!currentPair) {
    return (
      <Center h="100vh" bg={bg}>
        <VStack spacing={8} maxW="container.sm" textAlign="center" p={4}>
          <Heading 
            size={['xl', '2xl']} 
            fontFamily="'Allan', cursive"
            letterSpacing="wide"
            textAlign="center"
            px={4}
          >
            Thank you for sharing your love for art
          </Heading>
          <Text fontSize={['md', 'lg']} color="gray.500" maxW="600px" textAlign="center" px={4}>
            You've voted on all available artworks. Why not check out your winning choices or submit your own masterpiece?
          </Text>
          <Stack 
            direction={['column', 'row']} 
            spacing={4} 
            w="100%" 
            px={4}
            justify="center"
          >
            <Button
              as={RouterLink}
              to="/artworks"
              size="lg"
              colorScheme="blue"
              leftIcon={<Icon as={FaHeart} />}
              width={['100%', 'auto']}
            >
              See Your Winners
            </Button>
            <Button
              as={RouterLink}
              to="/submit"
              size="lg"
              variant="outline"
              colorScheme="blue"
              width={['100%', 'auto']}
            >
              Submit your Artworks
            </Button>
          </Stack>
        </VStack>
      </Center>
    );
  }

  if (!hasVotePacks) {
    return (
      <Center h="100vh" bg={bg}>
        <VStack spacing={8} maxW="container.sm" textAlign="center" p={4}>
          <Heading
            size={['xl', '2xl']}
            fontFamily="'Allan', cursive"
            letterSpacing="wide"
          >
            Time to recharge!
          </Heading>
          <Text fontSize={['md', 'xl']} color="gray.600" px={4}>
            You've used all your votes - great job supporting the artists! 
            Ready to continue shaping the future of digital art?
          </Text>
          <Stack 
            direction={['column', 'row']} 
            spacing={4}
            w="100%"
            px={4}
            justify="center"
          >
            <Button 
              as={RouterLink} 
              to="/tokens" 
              colorScheme="blue" 
              size="lg"
              width={['100%', 'auto']}
            >
              Get More Vote Packs
            </Button>
            <Button
              as={RouterLink}
              to="/artworks"
              variant="outline"
              size="lg"
              width={['100%', 'auto']}
            >
              See Your Winners
            </Button>
          </Stack>
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
        borderColor={borderColor}
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