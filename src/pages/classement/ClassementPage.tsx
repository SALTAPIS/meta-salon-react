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
} from '@chakra-ui/react';
import { ChevronDownIcon, TimeIcon, ViewIcon } from '@chakra-ui/icons';
import { Link as RouterLink } from 'react-router-dom';
import { ArtworkService } from '../../services/ArtworkService';
import type { Artwork } from '../../types/database.types';
import './classement.css';

type LayoutMode = 'fixed-height' | 'fixed-width' | 'variable-sized' | 'square' | 'table';
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
  const [aspectRatio, setAspectRatio] = React.useState<number | null>(null);
  const imageRef = React.useRef<HTMLImageElement>(null);

  const handleImageLoad = () => {
    if (imageRef.current) {
      const { naturalWidth, naturalHeight } = imageRef.current;
      setAspectRatio(naturalWidth / naturalHeight);
    }
  };

  const getSpanClass = (aspectRatio: number | null) => {
    if (!aspectRatio || layoutMode !== 'variable-sized') return '';
    
    // Vertical images (aspect ratio < 1): max 3 columns
    if (aspectRatio < 1) {
      if (aspectRatio < 0.5) return 'span-3';
      if (aspectRatio < 0.8) return 'span-2';
      return '';
    }
    
    // Horizontal images (aspect ratio > 1): max 4 columns
    if (aspectRatio > 2) return 'span-4';
    if (aspectRatio > 1.5) return 'span-3';
    if (aspectRatio > 1.2) return 'span-2';
    return '';
  };

  if (layoutMode === 'table') {
    return (
      <div className="table-row">
        <RouterLink to={`/artwork/${artwork.id}`} className="table-row-link">
          <div className="table-row-content">
            <img
              src={artwork.image_url}
              alt={artwork.title || ""}
              className="table-thumbnail"
            />
            <div className="table-info">
              <div className="table-title">{artwork.title}</div>
              {artwork.profiles?.username && (
                <div className="table-artist">
                  {artwork.profiles.display_name || artwork.profiles.username}
                </div>
              )}
            </div>
            <div className="table-stats">
              <div className="table-votes">{artwork.vote_count ?? 0} votes</div>
              <div className="table-value">{artwork.vault_value ?? 0} SLN</div>
            </div>
          </div>
        </RouterLink>
      </div>
    );
  }

  const sizeClass = sizeMode === 'small' ? 'small' : sizeMode === 'medium' ? 'medium' : 'large';
  const hasStats = (artwork.vault_value ?? 0) > 0 || (artwork.vote_count ?? 0) > 0;

  return (
    <div className={`artwork-card ${layoutMode} ${sizeClass} ${getSpanClass(aspectRatio)}`}>
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
                <span className="artwork-votes">{artwork.vote_count ?? 0} votes</span>
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
        const data = await ArtworkService.getAllArtworks();
        const sorted = data.sort((a, b) => (b.vault_value || 0) - (a.vault_value || 0));
        setArtworks(sorted);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load artworks');
      } finally {
        setIsLoading(false);
      }
    };

    loadArtworks();
  }, []);

  const getBreakpointCols = () => {
    if (layoutMode === 'fixed-height') {
      return {
        default: 1,
        1400: 1,
        1100: 1,
        800: 1,
        500: 1
      };
    }

    if (layoutMode === 'fixed-width') {
      switch(sizeMode) {
        case 'small':
          return { default: 4, 1400: 3, 1100: 2, 800: 1 };
        case 'medium':
          return { default: 3, 1400: 2, 1100: 1, 800: 1 };
        case 'large':
          return { default: 2, 1400: 2, 1100: 1, 800: 1 };
        default:
          return { default: 4, 1400: 3, 1100: 2, 800: 1 };
      }
    }

    const baseColumns = {
      small: { default: 5, 1400: 4, 1100: 3, 800: 2, 500: 1 },
      medium: { default: 4, 1400: 3, 1100: 2, 800: 2, 500: 1 },
      large: { default: 3, 1400: 2, 1100: 2, 800: 1, 500: 1 }
    }[sizeMode];

    if (layoutMode === 'square') {
      return {
        default: 5,
        1400: 4,
        1100: 3,
        800: 2,
        500: 1
      };
    }

    return baseColumns;
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
                Sort By: {sortBy === 'vault_value' ? 'Vault Value' : 'Votes'}
              </MenuButton>
              <MenuList bg={menuBgColor}>
                <MenuItem onClick={() => setSortBy('vault_value')}>Vault Value</MenuItem>
                <MenuItem onClick={() => setSortBy('votes')}>Vote Count</MenuItem>
                <MenuItem onClick={() => setSortBy('win_rate')}>Win Rate</MenuItem>
                <MenuItem onClick={() => setSortBy('trending')}>Trending</MenuItem>
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
                  layoutMode === 'variable-sized' ? 'Variable Sized' :
                  layoutMode === 'square' ? 'Square Grid' :
                  'Table View'
                }
              </MenuButton>
              <MenuList bg={menuBgColor}>
                <MenuItem onClick={() => setLayoutMode('fixed-height')}>Fixed Height</MenuItem>
                <MenuItem onClick={() => setLayoutMode('fixed-width')}>Fixed Width</MenuItem>
                <MenuItem onClick={() => setLayoutMode('variable-sized')}>Variable Sized</MenuItem>
                <MenuItem onClick={() => setLayoutMode('square')}>Square Grid</MenuItem>
                <MenuItem onClick={() => setLayoutMode('table')}>Table View</MenuItem>
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
        {layoutMode === 'table' ? (
          <div className="table-layout">
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