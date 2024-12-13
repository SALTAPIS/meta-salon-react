import React, { useEffect, useRef } from 'react';
import {
  Container,
  VStack,
  Heading,
  Text,
  Button,
  useColorModeValue,
  Box,
} from '@chakra-ui/react';
import { Fade } from '@chakra-ui/react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { GameArena } from './GameArena';
import { useAuth } from '../../hooks/useAuth';
import { useTokens } from '../../hooks/token/useTokens';
import gsap from 'gsap';
import { ArtworkService } from '../../services/ArtworkService';
import type { Artwork } from '../../types/database.types';

// Key for storing session state in localStorage
const ACTIVE_SESSION_KEY = 'meta_salon_active_session';

interface PreviewArtwork extends Artwork {
  element: HTMLDivElement;
  x: number;
  y: number;
  rotation: number;
  velocity: { x: number; y: number };
  angularVelocity: number;
}

export default function GamePage() {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const [previewArtworks, setPreviewArtworks] = React.useState<Artwork[]>([]);
  const bg = useColorModeValue('gray.50', 'gray.900');
  const { user } = useAuth();
  const { votePacks, isLoading } = useTokens();
  const navigate = useNavigate();
  const previewRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();
  const artworksRef = useRef<PreviewArtwork[]>([]);

  // Animation configuration
  const config = {
    friction: 0.98,
    rotationDamping: 0.95,
    throwForce: 15,
    maxRotation: 3,
    pairInterval: 2000,
    maxArtworks: 20,
    collisionElasticity: 0.7,
    minSpeed: 0.1,
  };

  // Track used artwork indices to prevent duplicates
  const usedIndices = useRef<Set<number>>(new Set());

  // Get actual artwork dimensions
  const getArtworkDimensions = (artwork: PreviewArtwork) => {
    const img = new Image();
    img.src = artwork.image_url;
    const ratio = img.naturalWidth / img.naturalHeight;
    let width = 300;
    let height = 200;
    
    if (ratio > 1.5) { // wider image
      height = width / ratio;
    } else if (ratio < 1.5) { // taller image
      width = height * ratio;
    }
    
    // Center the artwork in its container
    const offsetX = (300 - width) / 2;
    const offsetY = (200 - height) / 2;
    
    return {
      x: artwork.x + offsetX,
      y: artwork.y + offsetY,
      width,
      height
    };
  };

  // Check collision between two artworks
  const checkCollision = (art1: PreviewArtwork, art2: PreviewArtwork) => {
    const dim1 = getArtworkDimensions(art1);
    const dim2 = getArtworkDimensions(art2);

    return !(dim1.x + dim1.width < dim2.x || 
            dim1.x > dim2.x + dim2.width || 
            dim1.y + dim1.height < dim2.y || 
            dim1.y > dim2.y + dim2.height);
  };

  // Resolve collision between two artworks
  const resolveCollision = (art1: PreviewArtwork, art2: PreviewArtwork) => {
    const dim1 = getArtworkDimensions(art1);
    const dim2 = getArtworkDimensions(art2);

    const center1 = { 
      x: dim1.x + dim1.width / 2, 
      y: dim1.y + dim1.height / 2 
    };
    const center2 = { 
      x: dim2.x + dim2.width / 2, 
      y: dim2.y + dim2.height / 2 
    };

    const dx = center2.x - center1.x;
    const dy = center2.y - center1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const nx = dx / distance;
    const ny = dy / distance;

    const relativeVelocityX = art1.velocity.x - art2.velocity.x;
    const relativeVelocityY = art1.velocity.y - art2.velocity.y;
    const impulse = (relativeVelocityX * nx + relativeVelocityY * ny) * config.collisionElasticity;

    art1.velocity.x -= impulse * nx;
    art1.velocity.y -= impulse * ny;
    art2.velocity.x += impulse * nx;
    art2.velocity.y += impulse * ny;

    const impactSpeed = Math.sqrt(relativeVelocityX * relativeVelocityX + relativeVelocityY * relativeVelocityY);
    art1.angularVelocity += (Math.random() - 0.5) * impactSpeed * 0.1;
    art2.angularVelocity += (Math.random() - 0.5) * impactSpeed * 0.1;

    // Separate overlapping artworks based on their actual dimensions
    const minSeparation = Math.min(dim1.width, dim1.height, dim2.width, dim2.height) * 0.1;
    art1.x -= nx * minSeparation;
    art1.y -= ny * minSeparation;
    art2.x += nx * minSeparation;
    art2.y += ny * minSeparation;
  };

  // Get unused random artwork index
  const getUnusedIndex = (maxIndex: number) => {
    if (usedIndices.current.size >= maxIndex) {
      usedIndices.current.clear();
    }
    let index;
    do {
      index = Math.floor(Math.random() * maxIndex);
    } while (usedIndices.current.has(index));
    usedIndices.current.add(index);
    return index;
  };

  // Load preview artworks
  useEffect(() => {
    const loadArtworks = async () => {
      try {
        const artworks = await ArtworkService.getAllArtworks();
        setPreviewArtworks(artworks);
      } catch (error) {
        console.error('Failed to load preview artworks:', error);
      }
    };
    loadArtworks();
  }, []);

  // Initialize animation
  useEffect(() => {
    if (!previewRef.current || !previewArtworks.length || isPlaying) return;

    const throwPair = () => {
      if (artworksRef.current.length >= config.maxArtworks) return;

      const indices = [
        getUnusedIndex(previewArtworks.length),
        getUnusedIndex(previewArtworks.length)
      ];

      const pair = indices.map((index, i) => {
        const element = document.createElement('div');
        element.className = 'preview-artwork';
        element.style.backgroundImage = `url(${previewArtworks[index].image_url})`;
        element.style.backgroundSize = 'contain';
        element.style.backgroundRepeat = 'no-repeat';
        element.style.backgroundPosition = 'center';
        element.style.width = '300px';
        element.style.height = '200px';
        element.style.position = 'absolute';
        element.style.cursor = 'pointer';
        element.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
        previewRef.current?.appendChild(element);

        element.addEventListener('mouseenter', () => {
          gsap.to(element, {
            scale: 1.1,
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            duration: 0.3,
            ease: 'power2.out'
          });
        });

        element.addEventListener('mouseleave', () => {
          gsap.to(element, {
            scale: 1,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            duration: 0.3,
            ease: 'power2.out'
          });
        });

        // Calculate starting position (left or right edge)
        const startX = i === 0 ? -350 : window.innerWidth + 50;
        const startY = window.innerHeight / 2 - 100 + (Math.random() - 0.5) * 300;

        return {
          ...previewArtworks[index],
          element,
          x: startX,
          y: startY,
          rotation: (Math.random() - 0.5) * config.maxRotation,
          velocity: {
            x: (i === 0 ? 1 : -1) * config.throwForce * (0.8 + Math.random() * 0.4),
            y: (Math.random() - 0.5) * 2
          },
          angularVelocity: (Math.random() - 0.5) * 2
        };
      });

      artworksRef.current.push(...pair);
    };

    // Animation loop
    const animate = () => {
      artworksRef.current.forEach((artwork, index) => {
        // Update position
        artwork.x += artwork.velocity.x;
        artwork.y += artwork.velocity.y;
        artwork.rotation += artwork.angularVelocity;

        // Limit rotation
        if (Math.abs(artwork.rotation) > config.maxRotation) {
          artwork.rotation = Math.sign(artwork.rotation) * config.maxRotation;
          artwork.angularVelocity *= -0.5;
        }

        // Apply friction
        artwork.velocity.x *= config.friction;
        artwork.velocity.y *= config.friction;
        artwork.angularVelocity *= config.rotationDamping;

        // Stop if speed is very low
        if (Math.abs(artwork.velocity.x) < config.minSpeed) artwork.velocity.x = 0;
        if (Math.abs(artwork.velocity.y) < config.minSpeed) artwork.velocity.y = 0;
        if (Math.abs(artwork.angularVelocity) < config.minSpeed) artwork.angularVelocity = 0;

        // Check collisions with other artworks
        artworksRef.current.forEach((other, otherIndex) => {
          if (index !== otherIndex && checkCollision(artwork, other)) {
            resolveCollision(artwork, other);
          }
        });

        // Keep artworks in bounds
        const margin = 50;
        if (artwork.y < margin) {
          artwork.y = margin;
          artwork.velocity.y *= -0.5;
        }
        if (artwork.y > window.innerHeight - 200 - margin) {
          artwork.y = window.innerHeight - 200 - margin;
          artwork.velocity.y *= -0.5;
        }

        // Update element
        gsap.set(artwork.element, {
          x: artwork.x,
          y: artwork.y,
          rotation: artwork.rotation
        });

        // Remove if out of bounds horizontally
        if (Math.abs(artwork.x) > window.innerWidth + 400) {
          artwork.element.remove();
          artworksRef.current.splice(index, 1);
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    // Start animation
    throwPair();
    const interval = setInterval(throwPair, config.pairInterval);
    animate();

    return () => {
      cancelAnimationFrame(animationRef.current!);
      clearInterval(interval);
      artworksRef.current.forEach(artwork => artwork.element.remove());
      artworksRef.current = [];
      usedIndices.current.clear();
    };
  }, [previewArtworks, isPlaying]);

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
    <Container maxW="container.md" py={20} position="relative">
      <Box
        ref={previewRef}
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        pointerEvents="none"
        zIndex={0}
      />
      <Fade in>
        <VStack spacing={8} align="stretch" position="relative" zIndex={1}>
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