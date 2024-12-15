import React from 'react';
import Masonry from 'react-masonry-css';
import {
  Box,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  useColorModeValue,
  HStack,
  Button,
  ButtonGroup,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Text,
} from '@chakra-ui/react';
import { ChevronDownIcon, TimeIcon, ViewIcon } from '@chakra-ui/icons';
import { Link as RouterLink } from 'react-router-dom';
import { ArtworkService, TimeFilter, SortBy } from '../../services/ArtworkService';
import type { Artwork } from '../../types/database.types';
import './classement.css';

type LayoutMode = 'fixed-height' | 'fixed-width' | 'square' | 'list';
type SizeMode = 'small' | 'medium' | 'large';

const ArtworkCard = ({ 
  artwork, 
  hideMetadata = false,
  sizeMode = 'medium',
  layoutMode,
}: { 
  artwork: Artwork; 
  hideMetadata?: boolean;
  sizeMode?: SizeMode;
  layoutMode: LayoutMode;
}) => {
  const imageRef = React.useRef<HTMLImageElement>(null);

  const handleImageLoad = () => {
    // Empty handler for future use
  };

  if (layoutMode === 'list') {
    return (
      <Box borderBottom="1px solid" borderColor="gray.200" _last={{ borderBottom: 'none' }}>
        <Box p={4} display="grid" gap={6} alignItems="start" gridTemplateColumns={
          sizeMode === 'small' ? '60px 2fr 2fr 1.5fr' :
          sizeMode === 'medium' ? '120px 2fr 2fr 1.5fr' :
          '480px 2fr 2fr 1.5fr'
        }>
          <RouterLink to={`/artwork/${artwork.id}`}>
            <Box position="relative" paddingBottom="100%" overflow="hidden">
              <Box
                as="img"
                src={artwork.image_url}
                alt={artwork.title || ""}
                position="absolute"
                width="100%"
                height="100%"
                objectFit="contain"
                objectPosition="top"
              />
            </Box>
          </RouterLink>
          <Box>
            <Text fontWeight="bold" noOfLines={1}>
              {artwork.title || "Untitled"}
            </Text>
          </Box>
          <Box>
            <RouterLink to={`/${artwork.profiles?.username}`} style={{ textDecoration: 'none' }}>
              <Text noOfLines={1}>
                <Box as="span" fontWeight="bold">
                  {artwork.profiles?.display_name || artwork.profiles?.username || "—"}
                </Box>{' '}
                <Box as="span" color="gray.500">
                  {artwork.profiles?.username}
                </Box>
              </Text>
            </RouterLink>
          </Box>
          <HStack spacing={8} justify="flex-end">
            <Text>{artwork.vote_count ?? 0} wins</Text>
            <Text color="green.500" fontWeight="bold">{artwork.vault_value ?? 0} SLN</Text>
          </HStack>
        </Box>
      </Box>
    );
  }

  const hasStats = (artwork.vault_value ?? 0) > 0 || (artwork.vote_count ?? 0) > 0;

  return (
    <div className={`artwork-card ${layoutMode} ${sizeMode}`}>
      <RouterLink to={`/artwork/${artwork.id}`} className="artwork-link">
        <div className="artwork-image-container">
          <img
            ref={imageRef}
            src={artwork.image_url}
            alt={artwork.title || ""}
            className="artwork-image"
            onLoad={handleImageLoad}
          />
        </div>
        
        {!hideMetadata && (
          <div className="artwork-info">
            {artwork.title && (
              <div className="artwork-title">
                {artwork.title}
              </div>
            )}
            
            {artwork.profiles?.username && (
              <div className="artwork-artist">
                {artwork.profiles.display_name || artwork.profiles.username}
              </div>
            )}

            {hasStats && (
              <div className="artwork-stats">
                <span className="artwork-votes">{artwork.vote_count ?? 0} wins</span>
                <span className="artwork-value">{artwork.vault_value ?? 0} SLN</span>
              </div>
            )}
          </div>
        )}
      </RouterLink>
    </div>
  );
};

export function ClassementPage() {
  const [artworks, setArtworks] = React.useState<Artwork[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [timeFilter, setTimeFilter] = React.useState('all');
  const [sortBy, setSortBy] = React.useState('vault_value');
  const [viewMode, setViewMode] = React.useState('artworks');
  const [layoutMode, setLayoutMode] = React.useState<LayoutMode>('fixed-height');
  const [sizeMode, setSizeMode] = React.useState<SizeMode>('medium');
  const [hideMetadata, setHideMetadata] = React.useState(false);

  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const filterBgColor = useColorModeValue('gray.50', 'gray.800');
  const filterTextColor = useColorModeValue('gray.800', 'white');
  const menuBgColor = useColorModeValue('white', 'gray.700');
  const activeButtonBg = useColorModeValue('gray.200', 'blue.500');
  const inactiveButtonBg = useColorModeValue('white', 'gray.700');

  React.useEffect(() => {
    const loadArtworks = async () => {
      try {
        setIsLoading(true);
        const data = await ArtworkService.getAllArtworks({
          timeFilter: timeFilter as TimeFilter,
          sortBy: sortBy as SortBy
        });
        setArtworks(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load artworks');
      } finally {
        setIsLoading(false);
      }
    };

    loadArtworks();
  }, [timeFilter, sortBy]);

  const getBreakpointCols = () => {
    if (layoutMode === 'fixed-height') {
      return {
        default: 1,
        1400: 1,
        1100: 1,
        800: 1
      };
    }

    if (layoutMode === 'fixed-width') {
      switch(sizeMode) {
        case 'small':
          return { default: 12, 1400: 8, 1100: 6, 800: 4 };
        case 'medium':
          return { default: 8, 1400: 6, 1100: 4, 800: 2 };
        case 'large':
          return { default: 4, 1400: 3, 1100: 2, 800: 1 };
        default:
          return { default: 8, 1400: 6, 1100: 4, 800: 2 };
      }
    }

    if (layoutMode === 'square') {
      switch(sizeMode) {
        case 'small':
          return { default: 8, 1400: 6, 1100: 4, 800: 3 };
        case 'medium':
          return { default: 6, 1400: 5, 1100: 3, 800: 2 };
        case 'large':
          return { default: 4, 1400: 3, 1100: 2, 800: 1 };
        default:
          return { default: 6, 1400: 5, 1100: 3, 800: 2 };
      }
    }

    // Default for list view
    return {
      default: 1,
      1400: 1,
      1100: 1,
      800: 1
    };
  };

  if (isLoading) {
    return (
      <Center py={20}>
        <Spinner size="xl" />
      </Center>
    );
  }

  if (error) {
    return (
      <Alert status="error" m={6}>
        <AlertIcon />
        {error}
      </Alert>
    );
  }

  return (
    <Box maxW="100vw" overflow="hidden">
      <Box bg={filterBgColor} borderBottomWidth={1} borderColor={borderColor} mb={6}>
        <HStack spacing={4} justify="space-between" py={4} px={6}>
          <ButtonGroup size="sm" isAttached variant="solid" spacing={0}>
            <Button
              onClick={() => setViewMode('artworks')}
              bg={viewMode === 'artworks' ? activeButtonBg : inactiveButtonBg}
              color={filterTextColor}
              borderWidth={1}
              borderColor={borderColor}
              borderRightWidth={0}
              borderRightRadius={0}
              fontWeight={viewMode === 'artworks' ? 'bold' : 'normal'}
              _hover={{ bg: viewMode === 'artworks' ? activeButtonBg : useColorModeValue('gray.100', 'gray.600') }}
            >
              Artworks
            </Button>
            <Button
              onClick={() => setViewMode('artists')}
              bg={viewMode === 'artists' ? activeButtonBg : inactiveButtonBg}
              color={filterTextColor}
              borderWidth={1}
              borderColor={borderColor}
              borderLeftWidth={1}
              borderLeftRadius={0}
              fontWeight={viewMode === 'artists' ? 'bold' : 'normal'}
              _hover={{ bg: viewMode === 'artists' ? activeButtonBg : useColorModeValue('gray.100', 'gray.600') }}
            >
              Artists
            </Button>
          </ButtonGroup>

          <HStack spacing={4}>
            <Menu>
              <MenuButton 
                as={Button} 
                rightIcon={<TimeIcon />} 
                variant="ghost" 
                size="sm"
                color={filterTextColor}
              >
                {timeFilter === 'all' ? 'All Time' : timeFilter}
              </MenuButton>
              <MenuList bg={menuBgColor}>
                <MenuItem onClick={() => setTimeFilter('all')}>All Time</MenuItem>
                <MenuItem onClick={() => setTimeFilter('24h')}>Last 24 Hours</MenuItem>
                <MenuItem onClick={() => setTimeFilter('week')}>This Week</MenuItem>
                <MenuItem onClick={() => setTimeFilter('month')}>This Month</MenuItem>
              </MenuList>
            </Menu>

            <Menu>
              <MenuButton 
                as={Button} 
                rightIcon={<ChevronDownIcon />} 
                variant="ghost" 
                size="sm"
                color={filterTextColor}
              >
                Sort By: {
                  sortBy === 'vault_value' ? 'Vault Value' :
                  sortBy === 'votes' ? 'Wins' :
                  sortBy === 'newest' ? 'Newest First' :
                  'Oldest First'
                }
              </MenuButton>
              <MenuList bg={menuBgColor}>
                <MenuItem onClick={() => setSortBy('vault_value')}>Vault Value</MenuItem>
                <MenuItem onClick={() => setSortBy('votes')}>Wins</MenuItem>
                <MenuItem onClick={() => setSortBy('newest')}>Newest First</MenuItem>
                <MenuItem onClick={() => setSortBy('oldest')}>Oldest First</MenuItem>
              </MenuList>
            </Menu>

            <Menu>
              <MenuButton 
                as={Button} 
                rightIcon={<ViewIcon />} 
                variant="ghost" 
                size="sm"
                color={filterTextColor}
              >
                Layout: {
                  layoutMode === 'fixed-height' ? 'Fixed Height' :
                  layoutMode === 'fixed-width' ? 'Fixed Width' :
                  layoutMode === 'square' ? 'Square Grid' :
                  'List'
                }
              </MenuButton>
              <MenuList bg={menuBgColor}>
                <MenuItem onClick={() => setLayoutMode('fixed-height')}>Fixed Height</MenuItem>
                <MenuItem onClick={() => setLayoutMode('fixed-width')}>Fixed Width</MenuItem>
                <MenuItem onClick={() => setLayoutMode('square')}>Square Grid</MenuItem>
                <MenuItem onClick={() => setLayoutMode('list')}>List</MenuItem>
              </MenuList>
            </Menu>

            <Menu>
              <MenuButton 
                as={Button} 
                rightIcon={<ChevronDownIcon />} 
                variant="ghost" 
                size="sm"
                color={filterTextColor}
              >
                Size: {sizeMode.charAt(0).toUpperCase() + sizeMode.slice(1)}
              </MenuButton>
              <MenuList bg={menuBgColor}>
                <MenuItem onClick={() => setSizeMode('small')}>Small</MenuItem>
                <MenuItem onClick={() => setSizeMode('medium')}>Medium</MenuItem>
                <MenuItem onClick={() => setSizeMode('large')}>Large</MenuItem>
              </MenuList>
            </Menu>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setHideMetadata(!hideMetadata)}
              color={filterTextColor}
            >
              {hideMetadata ? 'Show Metadata' : 'Hide Metadata'}
            </Button>
          </HStack>
        </HStack>
      </Box>

      <Box px={6}>
        {layoutMode === 'list' ? (
          <div className="list-layout">
            {artworks.map((artwork) => (
              <ArtworkCard
                key={artwork.id}
                artwork={artwork}
                hideMetadata={hideMetadata}
                sizeMode={sizeMode}
                layoutMode={layoutMode}
              />
            ))}
          </div>
        ) : layoutMode === 'fixed-height' ? (
          <div className="fixed-height-layout">
            {artworks.map((artwork) => (
              <ArtworkCard
                key={artwork.id}
                artwork={artwork}
                hideMetadata={hideMetadata}
                sizeMode={sizeMode}
                layoutMode={layoutMode}
              />
            ))}
          </div>
        ) : layoutMode === 'fixed-width' ? (
          <div className={`fixed-width-layout ${sizeMode}`}>
            {artworks.map((artwork) => (
              <ArtworkCard
                key={artwork.id}
                artwork={artwork}
                hideMetadata={hideMetadata}
                sizeMode={sizeMode}
                layoutMode={layoutMode}
              />
            ))}
          </div>
        ) : (
          <Masonry
            breakpointCols={getBreakpointCols()}
            className="masonry-grid"
            columnClassName="masonry-grid_column"
          >
            {artworks.map((artwork) => (
              <ArtworkCard
                key={artwork.id}
                artwork={artwork}
                hideMetadata={hideMetadata}
                sizeMode={sizeMode}
                layoutMode={layoutMode}
              />
            ))}
          </Masonry>
        )}
      </Box>
    </Box>
  );
} 