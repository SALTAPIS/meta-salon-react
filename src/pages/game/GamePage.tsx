import React from 'react';
import {
  Container,
  VStack,
  Heading,
  Text,
  Button,
  useColorModeValue,
} from '@chakra-ui/react';
import { Fade } from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { GameArena } from './GameArena';
import { useAuth } from '../../hooks/useAuth';
import { useTokens } from '../../hooks/token/useTokens';

// Key for storing session state in localStorage
const ACTIVE_SESSION_KEY = 'meta_salon_active_session';

export default function GamePage() {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const bg = useColorModeValue('gray.50', 'gray.900');
  const { user } = useAuth();
  const { votePacks, isLoading } = useTokens();
  const navigate = useNavigate();

  // Check if user has available votes
  const hasAvailableVotes = React.useMemo(() => {
    if (!votePacks) return false;
    return votePacks.some(pack => 
      pack.votes_remaining > 0 && 
      (!pack.expires_at || new Date(pack.expires_at) > new Date())
    );
  }, [votePacks]);

  // Check for active session on mount
  React.useEffect(() => {
    if (user && hasAvailableVotes) {
      const hasActiveSession = localStorage.getItem(ACTIVE_SESSION_KEY) === 'true';
      if (hasActiveSession) {
        setIsPlaying(true);
      }
    }
  }, [user, hasAvailableVotes]);

  // Handle session start
  const handleStartPlaying = () => {
    if (user && hasAvailableVotes) {
      localStorage.setItem(ACTIVE_SESSION_KEY, 'true');
      setIsPlaying(true);
    }
  };

  // Handle session end
  const handleExitGame = () => {
    localStorage.removeItem(ACTIVE_SESSION_KEY);
    setIsPlaying(false);
  };

  // Handle sign in
  const handleSignIn = () => {
    navigate('/auth/signin', { state: { returnUrl: '/game' } });
  };

  // Show game arena if playing
  if (isPlaying && user && hasAvailableVotes) {
    return <GameArena onExit={handleExitGame} />;
  }

  // Loading state
  if (user && isLoading) {
    return (
      <Container maxW="container.md" py={20}>
        <VStack spacing={8} align="stretch">
          <Text textAlign="center">Loading...</Text>
        </VStack>
      </Container>
    );
  }

  // Main game page content
  return (
    <Container maxW="container.md" py={20}>
      <Fade in>
        <VStack spacing={8} align="stretch">
          <VStack spacing={4}>
            <Heading size="2xl" textAlign="center">
              The Salon Game
            </Heading>
            <Text fontSize="xl" textAlign="center" color="gray.500">
              Vote for your favorite artworks and help curate the collection
            </Text>
          </VStack>

          {user ? (
            hasAvailableVotes ? (
              // Logged in with votes
              <Button
                size="lg"
                height="16"
                width="full"
                colorScheme="blue"
                onClick={handleStartPlaying}
                _hover={{
                  transform: 'translateY(-2px)',
                  boxShadow: 'lg',
                }}
                transition="all 0.2s"
              >
                Start Playing
              </Button>
            ) : (
              // Logged in but no votes
              <VStack spacing={4}>
                <Text color="gray.500" textAlign="center">
                  You need vote packs to play
                </Text>
                <Button
                  as={RouterLink}
                  to="/shop"
                  size="lg"
                  height="16"
                  width="full"
                  colorScheme="blue"
                  _hover={{
                    transform: 'translateY(-2px)',
                    boxShadow: 'lg',
                  }}
                  transition="all 0.2s"
                >
                  Get Vote Packs
                </Button>
              </VStack>
            )
          ) : (
            // Not logged in
            <Button
              size="lg"
              height="16"
              width="full"
              colorScheme="blue"
              onClick={handleSignIn}
              _hover={{
                transform: 'translateY(-2px)',
                boxShadow: 'lg',
              }}
              transition="all 0.2s"
            >
              Sign In to Play
            </Button>
          )}
        </VStack>
      </Fade>
    </Container>
  );
} 