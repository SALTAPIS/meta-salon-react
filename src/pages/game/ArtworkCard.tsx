import { Box, Image, VStack, Text, HStack, Link, useColorModeValue } from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';

interface Artwork {
  id: string;
  image_url: string;
  title?: string;
  vault_value?: number;
  vote_count?: number;
  user_id?: string;
  user?: {
    display_name?: string;
    username?: string;
  };
  win_count?: number;
  total_matches?: number;
}

interface ArtworkCardProps {
  artwork: Artwork;
  'data-artwork-id'?: string;
  isHovered?: boolean;
  showStats?: boolean;
  hideMetadata?: boolean;
}

export function ArtworkCard({ 
  artwork, 
  'data-artwork-id': dataArtworkId, 
  isHovered,
  showStats = true,
  hideMetadata = false
}: ArtworkCardProps) {
  const bgColor = useColorModeValue('white', 'gray.700');
  const textColor = useColorModeValue('gray.600', 'gray.300');

  const hasStats = showStats && (
    (artwork.vault_value ?? 0) > 0 || 
    (artwork.vote_count ?? 0) > 0
  );

  const winRate = (artwork.total_matches ?? 0) > 0 ? 
    ((artwork.win_count ?? 0) / (artwork.total_matches ?? 1) * 100).toFixed(1) : 
    '0.0';

  return (
    <VStack
      spacing={0}
      align="stretch"
      data-artwork-id={dataArtworkId}
      bg={bgColor}
      w="100%"
    >
      <Box
        position="relative"
        w="100%"
        overflow="hidden"
      >
        <Image
          src={artwork.image_url}
          alt={artwork.title || ""}
          objectFit="contain"
          w="100%"
          transition="all 1.2s cubic-bezier(0.4, 0, 0.2, 1)"
          transform={isHovered ? 'scale(1.05)' : 'scale(1)'}
        />
      </Box>
      
      {!hideMetadata && (
        <Box p={4}>
          {artwork.title && (
            <Text fontWeight="bold" fontSize="md" mb={1}>
              {artwork.title}
            </Text>
          )}
          
          {artwork.user?.username && (
            <Link
              as={RouterLink}
              to={`/user/${artwork.user.username}`}
              color="blue.500"
              _hover={{ color: "blue.600" }}
              fontSize="sm"
              mb={3}
              display="block"
            >
              {artwork.user.display_name || artwork.user.username}
            </Link>
          )}

          {hasStats && (
            <HStack spacing={3} justify="space-between" align="flex-end" width="100%">
              <Text fontSize="sm" color={textColor}>
                {artwork.vote_count ?? 0} votes
              </Text>
              <Text fontSize="sm" color={textColor} fontWeight="bold">
                {artwork.vault_value ?? 0} SLN
              </Text>
              {(artwork.total_matches ?? 0) > 0 && (
                <Text fontSize="sm" color={textColor}>
                  {winRate}% win rate
                </Text>
              )}
            </HStack>
          )}
        </Box>
      )}
    </VStack>
  );
} 