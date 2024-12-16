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
import { useState, useCallback, useEffect } from 'react';
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

const colors = [
  '#FF0000', // Red
  '#FF69B4', // Pink
  '#FF8C00', // Orange
  '#FFD700', // Gold
  '#9400D3', // Purple
  '#4B0082', // Indigo
  '#00FF00', // Green
  '#00FFFF', // Cyan
];

const Sparkle = ({ delay = 0, color = '#FFFFFF' }: { delay?: number; color?: string }) => (
  <motion.div
    initial={{ scale: 0, opacity: 0 }}
    animate={{
      scale: [0, 1, 0],
      opacity: [0, 1, 0],
      rotate: [0, 180],
    }}
    transition={{
      duration: 0.8,
      delay,
      ease: "easeOut"
    }}
    style={{
      position: 'absolute',
      width: '12px',
      height: '12px',
      filter: 'brightness(1.5) contrast(1.2)',
    }}
  >
    <svg width="12" height="12" viewBox="0 0 10 10" fill="none">
      <path d="M5 0L6.12257 3.87743L10 5L6.12257 6.12257L5 10L3.87743 6.12257L0 5L3.87743 3.87743L5 0Z" fill={color} />
    </svg>
  </motion.div>
);

const HeartFountain = ({ isActive, voteWeight = 1, position }: { isActive: boolean; voteWeight?: number; position: { x: number, y: number } }) => {
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          style={{
            position: 'fixed',
            top: position.y,
            left: position.x,
            transform: 'translate(-50%, -50%)',
            pointerEvents: 'none',
            zIndex: 1000,
            mixBlendMode: 'difference',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <motion.div
            initial={{ 
              opacity: 0,
              scale: 0.8,
              y: 0
            }}
            animate={{ 
              opacity: [0, 1, 0],
              scale: [0.8, 1, 1],
              y: -60
            }}
            transition={{ 
              duration: 0.5,
              ease: "easeOut",
              times: [0, 0.3, 1]
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 19 17" fill="none">
              <path 
                fillRule="evenodd" 
                clipRule="evenodd" 
                d="M9.5001 15.0881C10.0871 14.6033 10.6722 14.1326 11.1943 13.7125C11.3294 13.6039 11.4603 13.4986 11.5858 13.3973C11.7097 13.2962 11.8321 13.1964 11.9528 13.098C13.7278 11.6504 15.1555 10.4861 16.1406 9.35951L16.1422 9.35771C17.2803 8.06111 17.7003 6.97911 17.7003 5.84331C17.7003 4.68521 17.2875 3.64901 16.5738 2.92411C15.8204 2.16051 14.8217 1.73451 13.6905 1.73451C12.8626 1.73451 12.1372 1.96711 11.4904 2.44641C11.1216 2.72221 10.8095 3.02071 10.5374 3.38111L9.5 4.75581L8.4626 3.38111C8.1927 3.02351 7.8833 2.72691 7.5184 2.45301C6.8507 1.97771 6.1168 1.73451 5.3095 1.73451C4.1687 1.73451 3.1554 2.16671 2.4364 2.91361L2.4313 2.91891L2.4262 2.92411C1.7107 3.65091 1.2997 4.66551 1.2997 5.84331C1.2997 6.95891 1.7216 8.06331 2.8578 9.35771L2.8594 9.35951C3.8445 10.4861 5.2722 11.6504 7.0472 13.098C7.1651 13.1941 7.2844 13.2914 7.4053 13.3901C8.0595 13.8991 8.7754 14.4883 9.5001 15.0881Z" 
                fill="white"
                stroke="white"
                strokeWidth="1.5"
              />
            </svg>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export function GameArena({ onExit }: GameArenaProps) {
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const [selectedArtwork, setSelectedArtwork] = useState<'left' | 'right' | null>(null);
  const [isVoting, setIsVoting] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [exitDirection, setExitDirection] = useState<'up' | 'down' | null>(null);
  const toast = useToast();
  const isMobile = useBreakpointValue({ base: true, md: false });
  
  const [testHeartPosition, setTestHeartPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault();
        setShowHeartAnimation({
          isActive: true,
          position: {
            x: window.innerWidth / 2,
            y: window.innerHeight / 2
          }
        });
        setTimeout(() => {
          setShowHeartAnimation({
            isActive: false,
            position: { x: 0, y: 0 }
          });
        }, 1500);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, []);

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
      y: isFirst ? '0%' : '50%',
      top: isFirst ? 0 : '50%',
      height: '50%',
      width: '100%',
      scale: 1,
      zIndex: 1
    }),
    selected: {
      y: 0,
      top: 0,
      height: '80%',
      width: '100%',
      scale: 1,
      zIndex: 2,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 30
      }
    },
    unselected: {
      y: 0,
      top: '80%',
      height: '20%',
      width: '100%',
      scale: 1,
      zIndex: 1,
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 40
      }
    }
  };

  const [lastTapTime, setLastTapTime] = useState<number>(0);
  const doubleTapThreshold = 300; // ms between taps

  const handleTap = async (artwork: 'left' | 'right') => {
    const now = Date.now();
    const timeSinceLastTap = now - lastTapTime;
    
    if (timeSinceLastTap < doubleTapThreshold) {
      // Double tap detected
      setLastTapTime(0);
      
      // If double tap, cast vote
      const artworkId = artwork === 'left' ? currentPair?.left.id : currentPair?.right.id;
      if (artworkId) {
        await handleVote(artworkId);
      }
    } else {
      // Single tap
      setLastTapTime(now);

      // If single tap on small artwork, make it big
      if (!selectedArtwork || (selectedArtwork !== artwork)) {
        setSelectedArtwork(artwork);
      }
    }
  };

  const [showHeartAnimation, setShowHeartAnimation] = useState<{ isActive: boolean; position: { x: number; y: number } }>({ 
    isActive: false, 
    position: { x: 0, y: 0 } 
  });

  const handleVote = useCallback(async (artworkId: string, event?: React.MouseEvent | React.TouchEvent) => {
    if (!currentPair || !hasVotePacks || isVoting) return;

    setIsVoting(true);
    try {
      // Get the clicked artwork's position and determine if it's left or right
      let position;
      if (event) {
        const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
        position = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2
        };
      } else {
        // For desktop, determine position based on which artwork was voted
        const isLeftArtwork = artworkId === currentPair.left.id;
        position = {
          x: window.innerWidth * (isLeftArtwork ? 0.25 : 0.75),
          y: window.innerHeight * 0.5
        };
      }

      // Show heart animation
      setShowHeartAnimation({ isActive: true, position });
      
      // Wait for animation
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Hide animation before transition
      setShowHeartAnimation({ isActive: false, position: { x: 0, y: 0 } });
      
      // Trigger exit animation
      setExitDirection('up');
      
      // Cast vote
      await castVote(artworkId);
      await refreshBalance();
      setSelectedArtwork(null);
      setExitDirection(null);
      
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
  }, [currentPair, hasVotePacks, isVoting, castVote, refreshBalance, toast]);

  const handleDragStart = (e: DragEvent, artwork: 'left' | 'right') => {
    setDragStartY(e.clientY);
    if (!selectedArtwork) {
      setSelectedArtwork(artwork);
    }
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
          height="100dvh"
          maxHeight="-webkit-fill-available"
          style={{
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'none'
          }}
        >
          <Box
            position="relative"
            width="100%"
            height="calc(100dvh - 137px)"
            style={{ 
              perspective: '1000px',
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'none'
            }}
          >
            <AnimatePresence mode="wait">
              {currentPair && (
                <Box
                  position="absolute"
                  inset={0}
                  overflow="hidden"
                >
                  {/* First Artwork */}
                  <MotionBox
                    position="absolute"
                    top={0}
                    left={0}
                    right={0}
                    height="50%"
                    initial={false}
                    animate={{
                      ...(selectedArtwork === 'left' ? variants.selected : 
                          selectedArtwork === 'right' ? variants.unselected : 
                          { top: 0, height: '50%', scale: 1, zIndex: 1 }),
                      ...(exitDirection && {
                        y: exitDirection === 'up' ? '-100%' : '100%',
                        opacity: 0,
                        transition: { duration: 0.3, ease: "easeInOut" }
                      })
                    }}
                    variants={variants}
                    custom={true}
                    drag="y"
                    dragConstraints={{ top: 0, bottom: 0 }}
                    onDragStart={(e: any) => handleDragStart(e, 'left')}
                    onDragEnd={(e: any) => handleDragEnd(e, 'left')}
                    onTap={() => handleTap('left')}
                    style={{ 
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "10px",
                      touchAction: "pan-y",
                      userSelect: "none",
                      willChange: "transform",
                      cursor: "pointer"
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
                    top="50%"
                    left={0}
                    right={0}
                    height="50%"
                    initial={false}
                    animate={{
                      ...(selectedArtwork === 'right' ? variants.selected : 
                          selectedArtwork === 'left' ? variants.unselected : 
                          { top: '50%', height: '50%', scale: 1, zIndex: 1 }),
                      ...(exitDirection && {
                        y: exitDirection === 'up' ? '-100%' : '100%',
                        opacity: 0,
                        transition: { duration: 0.3, ease: "easeInOut" }
                      })
                    }}
                    variants={variants}
                    custom={false}
                    drag="y"
                    dragConstraints={{ top: 0, bottom: 0 }}
                    onDragStart={(e: any) => handleDragStart(e, 'right')}
                    onDragEnd={(e: any) => handleDragEnd(e, 'right')}
                    onTap={() => handleTap('right')}
                    style={{ 
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "10px",
                      touchAction: "pan-y",
                      userSelect: "none",
                      willChange: "transform",
                      cursor: "pointer"
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
                </Box>
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
          zIndex={3}
          style={{
            WebkitOverflowScrolling: 'touch',
            overscrollBehavior: 'none'
          }}
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

        {/* Heart Animation Layer */}
        <HeartFountain 
          isActive={showHeartAnimation.isActive} 
          voteWeight={votePacks?.[0]?.vote_power || 1}
          position={showHeartAnimation.position}
        />
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

      {/* Heart Animation Layer */}
      <HeartFountain 
        isActive={showHeartAnimation.isActive} 
        voteWeight={votePacks?.[0]?.vote_power || 1}
        position={showHeartAnimation.position}
      />
    </>
  );
} 