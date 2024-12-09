import React from 'react';
import { Box, Container, Heading, Text, Button, VStack, Fade, Spinner, Center } from '@chakra-ui/react';
import { GameArena } from './GameArena';
import { useAuth } from '../../hooks/useAuth';
import { Navigate } from 'react-router-dom';

export default function GamePage() {
  const { user, isLoading } = useAuth();
  const [isPlaying, setIsPlaying] = React.useState(false);

  // Show loading spinner while auth state is being determined
  if (isLoading) {
    return (
      <Center py={20}>
        <Spinner size="xl" />
      </Center>
    );
  }

  // Only redirect if we're sure there's no user (not loading)
  if (!isLoading && !user) {
    return <Navigate to="/auth/signin" />;
  }

  return (
    <Container maxW="container.xl" py={8}>
      {!isPlaying ? (
        <Fade in={!isPlaying}>
          <VStack spacing={8} align="stretch">
            <Box textAlign="center">
              <Heading 
                as="h1" 
                size="2xl" 
                bgGradient="linear(to-r, blue.400, purple.500)"
                bgClip="text"
                mb={4}
              >
                The Salon Game
              </Heading>
              <Text fontSize="xl" color="gray.600">
                Welcome to Meta.Salon, where art meets competition
              </Text>
            </Box>

            <Box 
              p={8} 
              borderRadius="xl" 
              bg="white" 
              boxShadow="xl"
              border="1px"
              borderColor="gray.100"
            >
              <Heading as="h2" size="lg" mb={6} color="gray.700">
                How It Works
              </Heading>
              <VStack spacing={4} align="stretch">
                {[
                  "You'll be presented with pairs of artworks",
                  "Click on the artwork you prefer",
                  "Your votes help determine the winners",
                  "Each artwork appears once per session",
                  "You need an active vote pack to participate"
                ].map((text, index) => (
                  <Box 
                    key={index} 
                    p={4} 
                    bg="gray.50" 
                    borderRadius="md"
                    _hover={{ bg: 'gray.100', transform: 'translateX(8px)' }}
                    transition="all 0.2s"
                  >
                    <Text fontSize="lg" color="gray.700">
                      {text}
                    </Text>
                  </Box>
                ))}
              </VStack>
            </Box>

            <Button
              size="lg"
              height="16"
              width="full"
              colorScheme="blue"
              onClick={() => setIsPlaying(true)}
              _hover={{
                transform: 'translateY(-2px)',
                boxShadow: 'lg',
              }}
              transition="all 0.2s"
            >
              Start Voting
            </Button>
          </VStack>
        </Fade>
      ) : (
        <Fade in={isPlaying}>
          <GameArena onExit={() => setIsPlaying(false)} />
        </Fade>
      )}
    </Container>
  );
} 