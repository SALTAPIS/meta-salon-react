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

const HeartFountain = ({ isActive, position }: { isActive: boolean; position: { x: number, y: number } }) => {
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
            <svg xmlns="http://www.w3.org/2000/svg" width="90" height="76" viewBox="0 0 45 38" fill="none">
              <mask id="path-1-inside-1_4017_265" fill="white">
                <path fillRule="evenodd" clipRule="evenodd" d="M15.8685 32.8677C17.3915 34.0516 19.0775 35.4417 20.818 36.8831C21.3075 37.295 21.9058 37.5008 22.5041 37.5008C23.1023 37.5008 23.7006 37.295 24.1901 36.8831C25.5827 35.7299 26.975 34.6095 28.2282 33.6014C28.5414 33.3494 28.8459 33.1045 29.1396 32.8677C29.4517 32.6127 29.7612 32.3605 30.0676 32.1109C34.0309 28.8801 37.4853 26.0642 39.9085 23.2928C42.8457 19.9467 44.2054 16.8064 44.2054 13.3061C44.2054 9.95996 43.0089 6.81967 40.7789 4.55473C38.4945 2.23817 35.4488 0.951172 32.0766 0.951172C29.5746 0.951172 27.2902 1.67188 25.278 3.16471C25.0379 3.34426 24.8035 3.52906 24.5753 3.72095C23.8208 4.35463 23.1304 5.06323 22.5041 5.89314C21.8777 5.06323 21.1874 4.35463 20.4328 3.72095C20.2046 3.52906 19.9703 3.34426 19.7302 3.16471C17.7179 1.72328 15.4335 0.951172 12.9315 0.951172C9.55934 0.951172 6.45924 2.23817 4.22926 4.55473C1.99928 6.81967 0.802734 9.90834 0.802734 13.3061C0.802734 16.755 2.16238 19.9467 5.0996 23.2928C7.52284 26.0642 10.9772 28.8801 14.9406 32.1109C15.2469 32.3605 15.5564 32.6127 15.8685 32.8677Z"/>
              </mask>
              <path d="M15.8685 32.8677L12.7051 36.7397L12.7519 36.778L12.7997 36.8151L15.8685 32.8677ZM20.818 36.8831L24.037 33.0571L24.0221 33.0446L24.0072 33.0323L20.818 36.8831ZM24.1901 36.8831L21.0012 33.0321L20.9861 33.0445L20.9712 33.0571L24.1901 36.8831ZM28.2282 33.6014L31.3621 37.4973L31.3624 37.4971L28.2282 33.6014ZM29.1396 32.8677L32.2782 36.7599L32.2907 36.7498L32.3031 36.7397L29.1396 32.8677ZM30.0676 32.1109L33.2265 35.9866L33.2267 35.9864L30.0676 32.1109ZM39.9085 23.2928L36.1509 19.9943L36.1445 20.0016L39.9085 23.2928ZM40.7789 4.55473L44.3418 1.0468L44.3391 1.04404L40.7789 4.55473ZM25.278 3.16471L22.2989 -0.850938L22.2912 -0.845186L22.2834 -0.839404L25.278 3.16471ZM24.5753 3.72095L27.7909 7.54977L27.7931 7.54789L24.5753 3.72095ZM22.5041 5.89314L18.5132 8.90525L22.5041 14.193L26.495 8.90525L22.5041 5.89314ZM20.4328 3.72095L17.215 7.54789L17.2172 7.54977L20.4328 3.72095ZM19.7302 3.16471L22.7247 -0.839404L22.6836 -0.870157L22.6418 -0.900059L19.7302 3.16471ZM4.22926 4.55473L7.79218 8.06267L7.81194 8.0426L7.83147 8.02232L4.22926 4.55473ZM5.0996 23.2928L8.86364 20.0016L8.85726 19.9943L5.0996 23.2928ZM14.9406 32.1109L11.7814 35.9864L11.7816 35.9866L14.9406 32.1109ZM12.7997 36.8151C14.2526 37.9446 15.8813 39.2867 17.6288 40.7339L24.0072 33.0323C22.2737 31.5966 20.5303 30.1587 18.9373 28.9202L12.7997 36.8151ZM17.599 40.7091C19.0099 41.8961 20.7546 42.5008 22.5041 42.5008V32.5008C23.057 32.5008 23.6051 32.6938 24.037 33.0571L17.599 40.7091ZM22.5041 42.5008C24.2535 42.5008 25.9982 41.8961 27.4091 40.7091L20.9712 33.0571C21.403 32.6938 21.9511 32.5008 22.5041 32.5008V42.5008ZM27.3791 40.7341C28.7404 39.6069 30.1061 38.5077 31.3621 37.4973L25.0942 29.7054C23.8439 30.7112 22.425 31.853 21.0012 33.0321L27.3791 40.7341ZM31.3624 37.4971C31.6743 37.2462 31.9817 36.999 32.2782 36.7599L26.0011 28.9754C25.7101 29.2101 25.4084 29.4527 25.094 29.7057L31.3624 37.4971ZM32.3031 36.7397C32.6123 36.4871 32.9191 36.2371 33.2265 35.9866L26.9086 28.2352C26.6034 28.4839 26.2911 28.7384 25.9762 28.9956L32.3031 36.7397ZM33.2267 35.9864C37.0778 32.8471 40.9109 29.7424 43.6726 26.584L36.1445 20.0016C34.0597 22.3859 30.984 24.9131 26.9084 28.2353L33.2267 35.9864ZM43.6662 26.5913C47.1714 22.5981 49.2054 18.3319 49.2054 13.3061H39.2054C39.2054 15.2809 38.5201 17.2953 36.1509 19.9943L43.6662 26.5913ZM49.2054 13.3061C49.2054 8.78007 47.5818 4.33758 44.3418 1.0468L37.216 8.06267C38.4359 9.30175 39.2054 11.1399 39.2054 13.3061H49.2054ZM44.3391 1.04404C41.1064 -2.23426 36.7745 -4.04883 32.0766 -4.04883V5.95117C34.1231 5.95117 35.8827 6.71061 37.2187 8.06543L44.3391 1.04404ZM32.0766 -4.04883C28.549 -4.04883 25.2101 -3.01062 22.2989 -0.850938L28.257 7.18035C29.3704 6.35439 30.6002 5.95117 32.0766 5.95117V-4.04883ZM22.2834 -0.839404C21.9755 -0.609141 21.6659 -0.365374 21.3574 -0.105993L27.7931 7.54789C27.9411 7.4235 28.1002 7.29766 28.2725 7.16882L22.2834 -0.839404ZM21.3597 -0.107875C20.3425 0.746436 19.3857 1.72495 18.5132 2.88102L26.495 8.90525C26.8751 8.40151 27.2991 7.96281 27.7909 7.54977L21.3597 -0.107875ZM26.495 2.88102C25.6224 1.72495 24.6657 0.746436 23.6485 -0.107875L17.2172 7.54977C17.7091 7.96281 18.133 8.40151 18.5132 8.90525L26.495 2.88102ZM23.6507 -0.105993C23.3422 -0.365374 23.0326 -0.609141 22.7247 -0.839404L16.7357 7.16882C16.9079 7.29766 17.0671 7.4235 17.215 7.54789L23.6507 -0.105993ZM22.6418 -0.900059C19.8195 -2.92171 16.525 -4.04883 12.9315 -4.04883V5.95117C14.3421 5.95117 15.6163 6.36828 16.8185 7.22947L22.6418 -0.900059ZM12.9315 -4.04883C8.26897 -4.04883 3.84623 -2.257 0.627055 1.08715L7.83147 8.02232C9.07226 6.73335 10.8497 5.95117 12.9315 5.95117V-4.04883ZM0.666343 1.0468C-2.56654 4.33035 -4.19727 8.7174 -4.19727 13.3061H5.80273C5.80273 11.0993 6.56509 9.30899 7.79218 8.06267L0.666343 1.0468ZM-4.19727 13.3061C-4.19727 18.2716 -2.17076 22.5896 1.34193 26.5913L8.85726 19.9943C6.49552 17.3038 5.80273 15.2383 5.80273 13.3061H-4.19727ZM1.33556 26.584C4.09722 29.7424 7.9303 32.8471 11.7814 35.9864L18.0997 28.2353C14.0242 24.9131 10.9485 22.3859 8.86363 20.0016L1.33556 26.584ZM11.7816 35.9866C12.0891 36.2371 12.3958 36.4871 12.7051 36.7397L19.0319 28.9956C18.7171 28.7384 18.4048 28.4839 18.0995 28.2352L11.7816 35.9866Z" fill="white" mask="url(#path-1-inside-1_4017_265)"/>
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
  
  const [showHeartAnimation, setShowHeartAnimation] = useState<{ isActive: boolean; position: { x: number; y: number } }>({ 
    isActive: false, 
    position: { x: 0, y: 0 } 
  });

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