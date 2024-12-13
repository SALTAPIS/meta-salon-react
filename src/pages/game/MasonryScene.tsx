import { useRef, useState, useEffect } from 'react';
import { Box, IconButton } from '@chakra-ui/react';
import { RepeatIcon } from '@chakra-ui/icons';

interface Artwork {
  id: string;
  image_url: string;
  element: HTMLDivElement;
  x: number;
  y: number;
  rotation: number;
  width: number;
  height: number;
}

interface MasonrySceneProps {
  artworks: Array<{ id: string; image_url: string }>;
}

export default function MasonryScene({ artworks }: MasonrySceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const artworksRef = useRef<Artwork[]>([]);
  const [isPlacing, setIsPlacing] = useState(false);

  // Configuration
  const NAV_HEIGHT = 57;
  const TARGET_ARTWORKS = 3;

  // Initialize artwork
  const createArtwork = async (artwork: { id: string; image_url: string }) => {
    // Create and load image to get dimensions
    const img = new Image();
    await new Promise((resolve) => {
      img.onload = resolve;
      img.src = artwork.image_url;
    });

    // Calculate dimensions maintaining aspect ratio
    const maxSize = Math.min(window.innerWidth, window.innerHeight) * 0.3;
    const scale = Math.min(maxSize / img.width, maxSize / img.height);
    const width = img.width * scale;
    const height = img.height * scale;

    // Create element
    const element = document.createElement('div');
    element.className = 'floating-artwork';
    element.style.position = 'absolute';
    element.style.width = `${width}px`;
    element.style.height = `${height}px`;
    element.style.backgroundImage = `url(${artwork.image_url})`;
    element.style.backgroundSize = 'contain';
    element.style.backgroundPosition = 'center';
    element.style.backgroundRepeat = 'no-repeat';

    // Random position within viewport
    const x = Math.random() * (window.innerWidth - width);
    const y = Math.random() * (window.innerHeight - height - NAV_HEIGHT) + NAV_HEIGHT;
    const rotation = (Math.random() - 0.5) * 30; // Random rotation between -15 and 15 degrees

    // Set position and rotation
    element.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg)`;

    // Add to container
    containerRef.current?.appendChild(element);

    return {
      ...artwork,
      element,
      x,
      y,
      rotation,
      width,
      height
    };
  };

  // Place artworks
  const placeArtworks = async () => {
    if (!containerRef.current) return;
    setIsPlacing(true);

    // Clear existing artworks
    artworksRef.current.forEach(artwork => {
      artwork.element.remove();
    });
    artworksRef.current = [];

    // Create new artworks
    const shuffled = [...artworks].sort(() => Math.random() - 0.5);
    const selectedArtworks = shuffled.slice(0, TARGET_ARTWORKS);

    for (const artwork of selectedArtworks) {
      const floatingArtwork = await createArtwork(artwork);
      artworksRef.current.push(floatingArtwork);
    }

    setIsPlacing(false);
  };

  // Initialize on mount and handle resize
  useEffect(() => {
    placeArtworks();

    const handleResize = () => {
      placeArtworks();
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      artworksRef.current.forEach(artwork => artwork.element.remove());
    };
  }, [artworks]);

  return (
    <Box position="relative">
      <Box 
        ref={containerRef}
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        overflow="hidden"
        pointerEvents="none"
      />
      <IconButton
        aria-label="Rebuild layout"
        icon={<RepeatIcon />}
        position="fixed"
        bottom="4"
        right="4"
        colorScheme="blue"
        size="lg"
        isLoading={isPlacing}
        onClick={placeArtworks}
        zIndex={2}
      />
    </Box>
  );
} 