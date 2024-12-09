import { Box, Image } from '@chakra-ui/react';

interface Artwork {
  id: string;
  image_url: string;
}

interface ArtworkCardProps {
  artwork: Artwork;
  'data-artwork-id'?: string;
  isHovered?: boolean;
}

export function ArtworkCard({ artwork, 'data-artwork-id': dataArtworkId, isHovered }: ArtworkCardProps) {
  return (
    <Box
      position="relative"
      w="100%"
      h="100%"
      overflow="hidden"
      data-artwork-id={dataArtworkId}
    >
      <Image
        src={artwork.image_url}
        alt=""
        objectFit="contain"
        w="100%"
        h="100%"
        transition="all 1.2s cubic-bezier(0.4, 0, 0.2, 1)"
        transform={isHovered ? 'scale(1.05)' : 'scale(1)'}
      />
    </Box>
  );
} 