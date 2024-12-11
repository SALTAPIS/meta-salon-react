import { 
  Box, 
  useColorModeValue, 
  Center, 
  Spinner, 
  Text, 
  VStack, 
  Button, 
  IconButton,
  HStack,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Progress,
  Tooltip,
  Container,
  Flex
} from '@chakra-ui/react';
import React from 'react';
import gsap from 'gsap';
import { ArtworkCard } from './ArtworkCard';
import { useVotingArena } from '../../hooks/useVotingArena';
import { Link as RouterLink } from 'react-router-dom';
import { CloseIcon } from '@chakra-ui/icons';
import { useTokens } from '../../hooks/token/useTokens';
import type { VotePack } from '../../types/database.types';

interface GameArenaProps {
  onExit: () => void;
}

export function GameArena({ onExit }: GameArenaProps) {
  const [selectedArtwork, setSelectedArtwork] = React.useState<string | null>(null);
  const [hoveredArtwork, setHoveredArtwork] = React.useState<string | null>(null);
  const arenaRef = React.useRef<HTMLDivElement>(null);
  const timeline = React.useRef<gsap.core.Timeline>();
  const bg = useColorModeValue('white', 'gray.900');
  
  const { 
    currentPair, 
    isLoading, 
    error, 
    castVote, 
    hasVotePacks,
    artworks,
    remainingArtworks 
  } = useVotingArena();
  
  const { votePacks } = useTokens();
  const availableVotes = votePacks?.reduce((sum: number, pack: VotePack) => 
    sum + (pack.votes_remaining || 0), 0
  ) || 0;

  React.useEffect(() => {
    // Initialize GSAP timeline
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
    if (!currentPair) return;
    
    setSelectedArtwork(artworkId);
    
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
      } catch (err) {
        console.error('Vote casting failed:', err);
      }

      // Reset after animation
      setTimeout(() => {
        setSelectedArtwork(null);
        timeline.current?.clear();
        gsap.set([winner, loser], { clearProps: 'all' });
      }, 1500);
    }
  };

  const getArtworkHeight = (artworkId: string) => {
    if (!hoveredArtwork) return '60vh';
    return hoveredArtwork === artworkId ? '90vh' : '30vh';
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
          <Text color="red.500">{error}</Text>
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
    <Box h="100vh" overflow="hidden" position="relative" bg={bg}>
      {/* Main artwork display */}
      <Container maxW="container.xl" h="100%" pt="4" pb="20">
        <Flex 
          ref={arenaRef}
          h="100%" 
          gap={8} 
          align="center" 
          justify="center"
        >
          <Box 
            h={getArtworkHeight(currentPair.left.id)}
            cursor={selectedArtwork ? 'default' : 'pointer'}
            onClick={() => !selectedArtwork && handleVote(currentPair.left.id)}
            onMouseEnter={() => !selectedArtwork && setHoveredArtwork(currentPair.left.id)}
            onMouseLeave={() => !selectedArtwork && setHoveredArtwork(null)}
            transition="height 1.2s cubic-bezier(0.4, 0, 0.2, 1)"
            flex={1}
            maxW="45%"
          >
            <ArtworkCard
              artwork={currentPair.left}
              data-artwork-id={currentPair.left.id}
              isHovered={hoveredArtwork === currentPair.left.id}
              showStats={false}
              hideMetadata={true}
            />
          </Box>

          <Box 
            h={getArtworkHeight(currentPair.right.id)}
            cursor={selectedArtwork ? 'default' : 'pointer'}
            onClick={() => !selectedArtwork && handleVote(currentPair.right.id)}
            onMouseEnter={() => !selectedArtwork && setHoveredArtwork(currentPair.right.id)}
            onMouseLeave={() => !selectedArtwork && setHoveredArtwork(null)}
            transition="height 1.2s cubic-bezier(0.4, 0, 0.2, 1)"
            flex={1}
            maxW="45%"
          >
            <ArtworkCard
              artwork={currentPair.right}
              data-artwork-id={currentPair.right.id}
              isHovered={hoveredArtwork === currentPair.right.id}
              showStats={false}
              hideMetadata={true}
            />
          </Box>
        </Flex>
      </Container>

      {/* Stats panel at bottom */}
      <Box 
        position="fixed" 
        bottom={0} 
        left={0} 
        right={0} 
        bg={bg} 
        borderTop="1px" 
        borderColor="gray.200"
        p={4}
      >
        <Container maxW="container.xl">
          <HStack justify="space-between">
            <Stat>
              <StatLabel>Available Votes</StatLabel>
              <StatNumber>{availableVotes}</StatNumber>
              <StatHelpText>From {votePacks?.length || 0} packs</StatHelpText>
            </Stat>

            {artworks.length > 0 && (
              <HStack spacing={6} align="center">
                <Tooltip label="Your voting progress">
                  <Box>
                    <Text fontSize="sm" mb={1}>Progress</Text>
                    <Progress 
                      value={((artworks.length - remainingArtworks.length) / artworks.length) * 100}
                      size="sm"
                      width="200px"
                      borderRadius="full"
                      colorScheme="blue"
                    />
                  </Box>
                </Tooltip>
                <Stat textAlign="right">
                  <StatLabel>Artworks Remaining</StatLabel>
                  <StatNumber>{remainingArtworks.length}</StatNumber>
                  <StatHelpText>Out of {artworks.length}</StatHelpText>
                </Stat>
              </HStack>
            )}
          </HStack>
        </Container>
      </Box>

      {/* Close button */}
      <IconButton
        aria-label="Exit game"
        icon={<CloseIcon />}
        position="fixed"
        top={4}
        right={4}
        onClick={onExit}
        variant="ghost"
      />
    </Box>
  );
} 