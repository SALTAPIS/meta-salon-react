import { Box, Image, Text, HStack, Link, useColorModeValue, Grid } from '@chakra-ui/react';
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
  artist_id?: string;
  artist_name?: string;
  total_votes?: number;
  win_rate?: number;
}

interface ArtworkCardProps {
  artwork: Artwork;
  showStats?: boolean;
  hideMetadata?: boolean;
  layout?: 'masonry-fixed' | 'masonry-variable' | 'float' | 'list';
}

export function ArtworkCard({ artwork, showStats = false, hideMetadata = false, layout = 'masonry-fixed' }: ArtworkCardProps) {
  const textColor = useColorModeValue('gray.800', 'white');
  const mutedColor = useColorModeValue('gray.600', 'gray.400');
  const vaultValueColor = useColorModeValue('green.500', 'green.300');

  const hasStats = showStats && (
    (artwork.vault_value ?? 0) > 0 || 
    (artwork.vote_count ?? 0) > 0
  );

  const renderImage = () => (
    <Image
      src={artwork.image_url}
      alt={artwork.title}
      objectFit="cover"
      w="100%"
      h={layout === 'list' ? "100px" : "auto"}
    />
  );

  const renderStats = () => (
    <HStack spacing={4} justify="space-between" align="flex-end" width="100%">
      <Text fontSize="sm" color={mutedColor}>
        {artwork.vote_count ?? 0} votes
      </Text>
      <Text fontSize="sm" color={vaultValueColor} fontWeight="bold">
        {artwork.vault_value ?? 0} SLN
      </Text>
      {artwork.win_rate !== undefined && (
        <Text fontSize="sm" color={mutedColor}>
          {(artwork.win_rate * 100).toFixed(1)}% win rate
        </Text>
      )}
    </HStack>
  );

  const renderArtistLink = () => (
    artwork.artist_name && artwork.artist_id ? (
      <Link
        as={RouterLink}
        to={`/artist/${artwork.artist_id}`}
        color={mutedColor}
        fontSize="sm"
        _hover={{ color: textColor }}
      >
        {artwork.artist_name}
      </Link>
    ) : artwork.user?.username ? (
      <Link
        as={RouterLink}
        to={`/user/${artwork.user.username}`}
        color={mutedColor}
        fontSize="sm"
        _hover={{ color: textColor }}
      >
        {artwork.user.display_name || artwork.user.username}
      </Link>
    ) : null
  );

  if (layout === 'list') {
    return (
      <Grid templateColumns="100px 1fr auto" gap={4} alignItems="center" w="100%">
        {renderImage()}
        <Box>
          <Text fontWeight="bold" color={textColor} mb={1}>{artwork.title}</Text>
          {renderArtistLink()}
        </Box>
        {hasStats && renderStats()}
      </Grid>
    );
  }

  return (
    <Box position="relative" w="100%">
      {renderImage()}
      {!hideMetadata && (
        <Box p={4}>
          <Text fontWeight="bold" color={textColor} mb={1}>{artwork.title}</Text>
          {renderArtistLink()}
          {hasStats && <Box mt={2}>{renderStats()}</Box>}
        </Box>
      )}
    </Box>
  );
} 