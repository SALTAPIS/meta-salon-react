import { 
  Box, 
  useColorModeValue, 
  Center, 
  Spinner, 
  Text, 
  VStack, 
  Button, 
  HStack,
  Container,
  useToast,
  Image,
} from '@chakra-ui/react';
import React, { useCallback, useMemo } from 'react';
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
  const [isTransitioning, setIsTransitioning] = React.useState(false);
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

  // Memoize active packs calculation
  const { activePacks, availableVotes } = useMemo(() => {
    const active = votePacks?.filter((pack: VotePack) => 
      pack.votes_remaining > 0 && (!pack.expires_at || new Date(pack.expires_at) > new Date())
    ) || [];
    
    const votes = active.reduce((sum: number, pack: VotePack) => 
      sum + (pack.votes_remaining || 0), 0
    ) || 0;

    return { activePacks: active, availableVotes: votes };
  }, [votePacks]);

  const hasVotePacks = activePacks.length > 0;
  const isLoading = (isArenaLoading || isTokensLoading) && !isTransitioning;
  const error = arenaError || tokensError;

  // Animation setup
  React.useEffect(() => {
    timeline.current = gsap.timeline({ paused: true });
    return () => {
      timeline.current?.kill();
    };
  }, []);

  // Prevent scrolling on hover
  React.useEffect(() => {
    const preventScroll = (e: WheelEvent) => {
      if (hoveredArtwork) {
        e.preventDefault();
      }
    };
    window.addEventListener('wheel', preventScroll, { passive: false });
    return () => window.removeEventListener('wheel', preventScroll);
  }, [hoveredArtwork]);

  // Memoize vote handler
  const handleVote = useCallback(async (artworkId: string) => {
    if (!currentPair || !activePacks[0] || isTransitioning) return;
    
    setIsTransitioning(true);
    const winner = document.querySelector(`[data-artwork-id="${artworkId}"]`);
    const loser = document.querySelector(`[data-artwork-id="${
      artworkId === currentPair.left.id ? currentPair.right.id : currentPair.left.id
    }"]`);
    
    if (winner && loser && timeline.current) {
      timeline.current
        .clear()
        .to(loser, {
          scale: 0.8,
          opacity: 0,
          duration: 0.8,
          ease: "power2.inOut"
        })
        .to(winner, {
          scale: 1.1,
          duration: 0.8,
          ease: "power2.inOut"
        }, '<')
        .play();

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
        setIsTransitioning(false);
      }, 1000);
    }
  }, [currentPair, activePacks, timeline, castVote, refreshBalance, debugMode, toast, isTransitioning]);

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
        h="calc(90vh - 160px)"
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
          transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
          cursor="pointer"
          data-artwork-id={currentPair?.left.id}
          onClick={() => handleVote(currentPair?.left.id)}
          onMouseEnter={() => setHoveredArtwork(currentPair?.left.id)}
          onMouseLeave={() => setHoveredArtwork(null)}
          overflow="visible"
          transform={hoveredArtwork === currentPair?.left.id ? 'translateY(-8px)' : 'none'}
        >
          <Image
            src={currentPair?.left.image_url}
            alt={currentPair?.left.title || ""}
            objectFit="contain"
            w="100%"
            h="100%"
            transition="all 0.8s cubic-bezier(0.4, 0, 0.2, 1)"
            transform={hoveredArtwork === currentPair?.left.id ? 'scale(1.05)' : 'scale(1)'}
            loading="eager"
            style={{ maxWidth: '100%', maxHeight: '100%' }}
          />
        </Box>

        {/* Right Artwork */}
        <Box 
          flex={1}
          maxW="45vw"
          h={hoveredArtwork === currentPair?.right.id ? '55vh' : '40vh'}
          position="relative"
          transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
          cursor="pointer"
          data-artwork-id={currentPair?.right.id}
          onClick={() => handleVote(currentPair?.right.id)}
          onMouseEnter={() => setHoveredArtwork(currentPair?.right.id)}
          onMouseLeave={() => setHoveredArtwork(null)}
          overflow="visible"
          transform={hoveredArtwork === currentPair?.right.id ? 'translateY(-8px)' : 'none'}
        >
          <Image
            src={currentPair?.right.image_url}
            alt={currentPair?.right.title || ""}
            objectFit="contain"
            w="100%"
            h="100%"
            transition="all 0.8s cubic-bezier(0.4, 0, 0.2, 1)"
            transform={hoveredArtwork === currentPair?.right.id ? 'scale(1.05)' : 'scale(1)'}
            loading="eager"
            style={{ maxWidth: '100%', maxHeight: '100%' }}
          />
        </Box>
      </Box>

      {/* Vote Info Footer */}
      <Box 
        position="fixed"
        bottom={4}
        left={0}
        right={0}
        borderTop="1px"
        borderColor={borderColor}
        bg={bg} 
        h="64px"
        display="flex"
        alignItems="center"
        justifyContent="center"
        px={8}
      >
        <HStack spacing={48} width="100%" maxW="1200px" justify="center">
          <VStack spacing={1} align="center">
            <Text fontSize="lg">{availableVotes}</Text>
            <Text fontSize="xs" color="gray.500" whiteSpace="nowrap">Votes Available</Text>
          </VStack>
          <VStack spacing={1} align="center">
            <Text fontSize="lg">{activePacks[0]?.vote_power || 1}x SLN</Text>
            <Text fontSize="xs" color="gray.500">Weight</Text>
          </VStack>
          <VStack spacing={1} align="center">
            <Text fontSize="lg">{remainingArtworks?.length || 0}/{artworks?.length || 0}</Text>
            <Text fontSize="xs" color="gray.500">Remaining Pairs</Text>
          </VStack>
        </HStack>
      </Box>
    </Box>
  );
} 