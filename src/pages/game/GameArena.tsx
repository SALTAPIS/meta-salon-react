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
  useBreakpointValue,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';
import { useVotingArena } from '../../hooks/useVotingArena';
import { useState, useCallback } from 'react';
import { useDebugMode } from '../../hooks/useDebugMode';
import { FaHeart } from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import { useTokens } from '../../hooks/token/useTokens';

interface DragEvent {
  clientY: number;
}

interface GameArenaProps {
  onExit: () => void;
}

const MotionBox = motion(Box as any);
const MotionImage = motion(ChakraImage as any);

export function GameArena({ onExit }: GameArenaProps) {
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const [selectedArtwork, setSelectedArtwork] = useState<'left' | 'right' | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [exitDirection, setExitDirection] = useState<'up' | 'down' | null>(null);
  const toast = useToast();
  const { debugMode } = useDebugMode();
  const isMobile = useBreakpointValue({ base: true, md: false });
  
  const { 
    currentPair,
    isLoading: arenaLoading,
    error: arenaError,
    castVote,
    remainingCount
  } = useVotingArena();

  const {
    votePacks,
    isLoading: tokenLoading,
    error: tokenError,
    refreshBalance
  } = useTokens();

  const isLoading = arenaLoading || tokenLoading;
  const error = arenaError || tokenError;

  const hasVotePacks = votePacks?.some((pack) =>
    pack.votes_remaining > 0 && (!pack.expires_at || new Date(pack.expires_at) > new Date())
  );

  const variants = {
    initial: (isFirst: boolean) => ({
      y: isFirst ? '0%' : '100%',
      height: '100%',
      width: '100%',
      scale: 1,
      rotateX: 0,
      zIndex: 1
    }),
    selected: {
      y: 0,
      height: '100%',
      width: '100%',
      scale: 1,
      rotateX: 0,
      zIndex: 2,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    unselected: {
      y: '100%',
      height: '100%',
      width: '100%',
      scale: 1,
      rotateX: 0,
      zIndex: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 40
      }
    },
    exit: (direction: 'up' | 'down') => ({
      y: direction === 'up' ? '-100%' : '100%',
      opacity: 0,
      transition: {
        duration: 0.3,
        ease: "easeInOut"
      }
    })
  };

  const handleVote = useCallback(async (artworkId: string) => {
    if (!currentPair || !hasVotePacks || isVoting) return;

    setIsVoting(true);
    try {
      // Trigger exit animation
      setExitDirection('up');
      
      // Wait for animation
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Cast vote
      await castVote(artworkId);
      await refreshBalance();
      setSelectedArtwork(null);
      setExitDirection(null);
      
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
      setExitDirection(null);
    } finally {
      setIsVoting(false);
    }
  }, [currentPair, hasVotePacks, isVoting, castVote, refreshBalance, debugMode, toast]);

  const handleDragStart = (e: DragEvent) => {
    setDragStartY(e.clientY);
  };

  const handleDragEnd = async (e: DragEvent, artwork: 'left' | 'right') => {
    const dragDistance = dragStartY - e.clientY;
    const threshold = 100; // minimum drag distance to trigger vote

    if (dragDistance > threshold) {
      // Dragged up - cast vote
      const artworkId = artwork === 'left' ? currentPair?.left.id : currentPair?.right.id;
      if (artworkId) {
        await handleVote(artworkId);
      }
    } else if (dragDistance < -threshold) {
      // Dragged down - switch to other artwork
      setSelectedArtwork(artwork === 'left' ? 'right' : 'left');
    } else {
      // Reset position if drag wasn't far enough
      setSelectedArtwork(artwork);
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

  if (isMobile) {
    return (
      <>
        <Box 
          position="fixed"
          top="57px"
          left={0}
          right={0}
          bottom="80px"
          bg={bg}
          overflow="hidden"
        >
          <Box
            width="100%"
            height="100%"
            position="relative"
            style={{ perspective: '1000px' }}
          >
            {/* Gesture Hints */}
            {selectedArtwork && (
              <Box
                position="absolute"
                top="50%"
                left="50%"
                transform="translate(-50%, -50%)"
                zIndex={3}
                textAlign="center"
                color="white"
                fontSize="sm"
                opacity={0.8}
                pointerEvents="none"
                style={{
                  textShadow: '0 1px 2px rgba(0,0,0,0.6)'
                }}
              >
                <Text mb={2}>↑ Swipe up to vote</Text>
                <Text>↓ Swipe down to switch</Text>
              </Box>
            )}

            <AnimatePresence mode="wait">
              {currentPair && (
                <>
                  {/* First Artwork */}
                  <MotionBox
                    position="absolute"
                    width="100%"
                    height="50%"
                    initial="initial"
                    animate={selectedArtwork === 'left' ? "selected" : 
                            selectedArtwork === 'right' ? "unselected" : "initial"}
                    exit={exitDirection ? `exit` : undefined}
                    variants={variants}
                    custom={true}
                    drag={selectedArtwork === 'left' ? "y" : false}
                    dragConstraints={{ top: 0, bottom: 0 }}
                    onDragStart={handleDragStart}
                    onDragEnd={(e: any) => handleDragEnd(e, 'left')}
                    onClick={() => !selectedArtwork && setSelectedArtwork('left')}
                    style={{ 
                      transformOrigin: "center",
                      transformStyle: "preserve-3d",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "10px",
                      touchAction: "pan-y",
                      userSelect: "none"
                    }}
                  >
                    <MotionImage
                      src={currentPair.left.image_url}
                      alt={currentPair.left.title || ""}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        width: 'auto',
                        height: 'auto',
                        objectFit: 'contain',
                        objectPosition: 'center',
                        pointerEvents: 'none'
                      }}
                      loading="eager"
                      draggable={false}
                    />
                  </MotionBox>

                  {/* Second Artwork */}
                  <MotionBox
                    position="absolute"
                    width="100%"
                    height="50%"
                    initial="initial"
                    animate={selectedArtwork === 'right' ? "selected" : 
                            selectedArtwork === 'left' ? "unselected" : "initial"}
                    exit={exitDirection ? `exit` : undefined}
                    variants={variants}
                    custom={false}
                    drag={selectedArtwork === 'right' ? "y" : false}
                    dragConstraints={{ top: 0, bottom: 0 }}
                    onDragStart={handleDragStart}
                    onDragEnd={(e: any) => handleDragEnd(e, 'right')}
                    onClick={() => !selectedArtwork && setSelectedArtwork('right')}
                    style={{ 
                      transformOrigin: "center",
                      transformStyle: "preserve-3d",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "10px",
                      touchAction: "pan-y",
                      userSelect: "none"
                    }}
                  >
                    <MotionImage
                      src={currentPair.right.image_url}
                      alt={currentPair.right.title || ""}
                      style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        width: 'auto',
                        height: 'auto',
                        objectFit: 'contain',
                        objectPosition: 'center',
                        pointerEvents: 'none'
                      }}
                      loading="eager"
                      draggable={false}
                    />
                  </MotionBox>
                </>
              )}
            </AnimatePresence>
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
          px={4}
        >
          <HStack spacing={{ base: 4, md: 48 }} width="100%" maxW="1200px" justify="center">
            <VStack spacing={1} align="center" flex={1}>
              <Text fontSize={{ base: "md", md: "lg" }} fontWeight="medium">
                {votePacks?.reduce((sum, pack) => sum + (pack.votes_remaining || 0), 0) || 0}
              </Text>
              <Text fontSize="xs" color="gray.500" whiteSpace="nowrap">
                Votes Left
              </Text>
            </VStack>
            <VStack spacing={1} align="center" flex={1}>
              <Text fontSize={{ base: "md", md: "lg" }} fontWeight="medium">
                {votePacks?.[0]?.vote_power || 1}x
              </Text>
              <Text fontSize="xs" color="gray.500">
                Vote Power
              </Text>
            </VStack>
            <VStack spacing={1} align="center" flex={1}>
              <Text fontSize={{ base: "md", md: "lg" }} fontWeight="medium">
                {Math.floor((remainingCount || 0) / 2)}
              </Text>
              <Text fontSize="xs" color="gray.500">
                Pairs Left
              </Text>
            </VStack>
          </HStack>
        </Box>
      </>
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
        flexDirection={{ base: 'column', md: 'row' }}
        alignItems="center"
        justifyContent="center"
        gap={{ base: 4, md: 8 }}
        px={{ base: 4, md: 8 }}
        bg={bg}
        overflow="auto"
      >
        {/* Left Artwork */}
        <Box 
          flex={{ base: "none", md: 1 }}
          w={{ base: 'auto', md: '45vw' }}
          h={{ base: 'auto', md: '80vh' }}
          maxH={{ base: '35vh', md: '80vh' }}
          position="relative"
          cursor="pointer"
          onClick={() => handleVote(currentPair!.left.id)}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <ChakraImage
            src={currentPair!.left.image_url}
            alt={currentPair!.left.title || ""}
            objectFit="contain"
            h="100%"
            w="auto"
            maxH={{ base: '35vh', md: '80vh' }}
            maxW={{ base: '90vw', md: '45vw' }}
            transition="all 0.8s cubic-bezier(0.4, 0, 0.2, 1)"
            _hover={{ transform: 'scale(1.05)' }}
            loading="eager"
          />
        </Box>

        {/* Right Artwork */}
        <Box 
          flex={{ base: "none", md: 1 }}
          w={{ base: 'auto', md: '45vw' }}
          h={{ base: 'auto', md: '80vh' }}
          maxH={{ base: '35vh', md: '80vh' }}
          position="relative"
          cursor="pointer"
          onClick={() => handleVote(currentPair!.right.id)}
          display="flex"
          alignItems="center"
          justifyContent="center"
        >
          <ChakraImage
            src={currentPair!.right.image_url}
            alt={currentPair!.right.title || ""}
            objectFit="contain"
            h="100%"
            w="auto"
            maxH={{ base: '35vh', md: '80vh' }}
            maxW={{ base: '90vw', md: '45vw' }}
            transition="all 0.8s cubic-bezier(0.4, 0, 0.2, 1)"
            _hover={{ transform: 'scale(1.05)' }}
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
        px={4}
      >
        <HStack spacing={{ base: 4, md: 48 }} width="100%" maxW="1200px" justify="center">
          <VStack spacing={1} align="center" flex={1}>
            <Text fontSize={{ base: "md", md: "lg" }} fontWeight="medium">
              {votePacks?.reduce((sum, pack) => sum + (pack.votes_remaining || 0), 0) || 0}
            </Text>
            <Text fontSize="xs" color="gray.500" whiteSpace="nowrap">
              Votes Left
            </Text>
          </VStack>
          <VStack spacing={1} align="center" flex={1}>
            <Text fontSize={{ base: "md", md: "lg" }} fontWeight="medium">
              {votePacks?.[0]?.vote_power || 1}x
            </Text>
            <Text fontSize="xs" color="gray.500">
              Vote Power
            </Text>
          </VStack>
          <VStack spacing={1} align="center" flex={1}>
            <Text fontSize={{ base: "md", md: "lg" }} fontWeight="medium">
              {Math.floor((remainingCount || 0) / 2)}
            </Text>
            <Text fontSize="xs" color="gray.500">
              Pairs Left
            </Text>
          </VStack>
        </HStack>
      </Box>
    </>
  );
} 