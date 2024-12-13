import { 
  Box, 
  useColorModeValue, 
  Center, 
  Spinner, 
  Text, 
  VStack, 
  Button, 
  HStack,
  Stat,
  StatLabel,
  StatNumber,
  Container,
  useToast,
  Image
} from '@chakra-ui/react';
import React from 'react';
import gsap from 'gsap';
import { Link as RouterLink } from 'react-router-dom';
import { useVotingArena } from '../../hooks/useVotingArena';
import { useTokens } from '../../hooks/token/useTokens';
import { useDebugMode } from '../../hooks/useDebugMode';
import type { VotePack } from '../../types/database.types';

interface GameArenaProps {
  onExit: () => void;
}

export function GameArena({ onExit }: GameArenaProps) {
  const bg = useColorModeValue('white', 'gray.900');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const [hoveredArtwork, setHoveredArtwork] = React.useState<string | null>(null);
  const arenaRef = React.useRef<HTMLDivElement>(null);
  const timeline = React.useRef<gsap.core.Timeline>();
  const toast = useToast();
  const { debugMode } = useDebugMode();
  
  const { 
    currentPair, 
    isLoading: isArenaLoading, 
    error: arenaError, 
    castVote, 
    artworks,
    remainingArtworks 
  } = useVotingArena();

  const { 
    votePacks, 
    isLoading: isTokensLoading, 
    error: tokensError,
    refreshBalance 
  } = useTokens();

  const isLoading = isArenaLoading || isTokensLoading;
  const error = arenaError || tokensError;
  
  // Get active vote packs
  const activePacks = votePacks?.filter((pack: VotePack) => 
    pack.votes_remaining > 0 && (!pack.expires_at || new Date(pack.expires_at) > new Date())
  ) || [];

  const hasVotePacks = activePacks.length > 0;
  const availableVotes = activePacks.reduce((sum: number, pack: VotePack) => 
    sum + (pack.votes_remaining || 0), 0
  ) || 0;

  React.useEffect(() => {
    timeline.current = gsap.timeline({ paused: true });
    
    // Prevent scrolling when artwork is scaled
    const preventScroll = (e: WheelEvent) => {
      if (hoveredArtwork) {
        e.preventDefault();
      }
    };
    window.addEventListener('wheel', preventScroll, { passive: false });
    
    return () => {
      timeline.current?.kill();
      window.removeEventListener('wheel', preventScroll);
    };
  }, [hoveredArtwork]);

  const handleVote = async (artworkId: string) => {
    if (!currentPair || !activePacks[0]) return;
    
    const winner = document.querySelector(`[data-artwork-id="${artworkId}"]`);
    const loser = document.querySelector(`[data-artwork-id="${artworkId === currentPair.left.id ? currentPair.right.id : currentPair.left.id}"]`);
    
    if (winner && loser && timeline.current) {
      timeline.current
        .clear()
        .to(loser, {
          scale: 0.8,
          opacity: 0,
          duration: 1.2,
          ease: "power2.inOut"
        })
        .to(winner, {
          scale: 1.2,
          duration: 1.2,
          ease: "power2.inOut"
        }, '<')
        .play();

      try {
        // Cast vote while animation is playing
        await castVote(artworkId);
        // Refresh vote packs after vote
        await refreshBalance();
        
        // Only show success toast in debug mode
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
        if (debugMode) {
          toast({
            title: 'Failed to cast vote',
            description: err instanceof Error ? err.message : 'Unknown error',
            status: 'error',
            duration: 5000,
            isClosable: true,
          });
        }
      }

      // Reset after animation
      setTimeout(() => {
        timeline.current?.clear();
        gsap.set([winner, loser], { clearProps: 'all' });
      }, 1500);
    }
  };

  if (isLoading) {
    return (
      <Center h="100vh" bg={bg}>
        <Spinner size="xl" />
      </Center>
    );
  }

  if (error) {
    return (
      <Center h="100vh" bg={bg}>
        <VStack spacing={4}>
          <Text color="red.500">{error instanceof Error ? error.message : error}</Text>
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
          <Button as={RouterLink} to="/shop" colorScheme="blue">
            Get Vote Packs
          </Button>
        </VStack>
      </Center>
    );
  }

  return (
    <Box 
      ref={arenaRef} 
      h="calc(90vh - 80px)"
      maxH="calc(90vh - 80px)"
      bg={bg} 
      overflow="hidden"
      position="relative"
    >
      {/* Voting Pairs */}
      <Box 
        display="flex"
        h="calc(90vh - 128px)"
        alignItems="center"
        justifyContent="center"
        gap={8}
        px={8}
      >
        {/* Left Artwork */}
        <Box 
          flex={1} 
          maxW="45vw"
          h={hoveredArtwork === currentPair?.left.id ? '55vh' : '40vh'}
          position="relative"
          transition="all 0.3s"
          cursor="pointer"
          data-artwork-id={currentPair?.left.id}
          onClick={() => handleVote(currentPair?.left.id)}
          onMouseEnter={() => setHoveredArtwork(currentPair?.left.id)}
          onMouseLeave={() => setHoveredArtwork(null)}
          overflow="hidden"
        >
          <Image
            src={currentPair?.left.image_url}
            alt={currentPair?.left.title || ""}
            objectFit="contain"
            w="100%"
            h="100%"
            transition="all 1.2s cubic-bezier(0.4, 0, 0.2, 1)"
            transform={hoveredArtwork === currentPair?.left.id ? 'scale(1.05)' : 'scale(1)'}
          />
        </Box>

        {/* Right Artwork */}
        <Box 
          flex={1}
          maxW="45vw"
          h={hoveredArtwork === currentPair?.right.id ? '55vh' : '40vh'}
          position="relative"
          transition="all 0.3s"
          cursor="pointer"
          data-artwork-id={currentPair?.right.id}
          onClick={() => handleVote(currentPair?.right.id)}
          onMouseEnter={() => setHoveredArtwork(currentPair?.right.id)}
          onMouseLeave={() => setHoveredArtwork(null)}
          overflow="hidden"
        >
          <Image
            src={currentPair?.right.image_url}
            alt={currentPair?.right.title || ""}
            objectFit="contain"
            w="100%"
            h="100%"
            transition="all 1.2s cubic-bezier(0.4, 0, 0.2, 1)"
            transform={hoveredArtwork === currentPair?.right.id ? 'scale(1.05)' : 'scale(1)'}
          />
        </Box>
      </Box>

      {/* Vote Info Footer */}
      <Box 
        position="absolute"
        bottom={0}
        left={0}
        right={0}
        borderTop="1px" 
        borderColor={borderColor}
        bg={bg} 
        h="48px"
        display="flex"
        alignItems="center"
      >
        <Container maxW="container.xl" centerContent>
          <HStack spacing={12} justify="center">
            <Stat size="sm" textAlign="center">
              <StatLabel fontSize="xs">Votes Available</StatLabel>
              <StatNumber fontSize="md">{availableVotes}</StatNumber>
            </Stat>
            <Stat size="sm" textAlign="center">
              <StatLabel fontSize="xs">Weight</StatLabel>
              <StatNumber fontSize="md">{activePacks[0]?.vote_power || 1}x SLN</StatNumber>
            </Stat>
            <Stat size="sm" textAlign="center">
              <StatLabel fontSize="xs">Remaining Pairs</StatLabel>
              <StatNumber fontSize="md">{remainingArtworks?.length || 0}/{artworks?.length || 0}</StatNumber>
            </Stat>
          </HStack>
        </Container>
      </Box>
    </Box>
  );
} 