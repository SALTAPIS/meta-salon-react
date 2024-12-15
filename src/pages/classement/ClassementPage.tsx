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

type LayoutMode = 'fixed-height' | 'fixed-width' | 'square' | 'table';
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
    
    if (sizeMode === 'randomized') {
      // For vertical images (aspect ratio < 1)
      if (aspectRatio < 1) {
        const randomSpan = Math.floor(Math.random() * 3) + 1;
        return randomSpan > 1 ? `span-${randomSpan}` : '';
      }
      
      // For horizontal images (aspect ratio > 1)
      const randomSpan = Math.floor(Math.random() * 4) + 1;
      return randomSpan > 1 ? `span-${randomSpan}` : '';
    }
    
    if (sizeMode === 'proportional' && totalVaultValue > 0) {
      // Calculate relative area based on vault value
      const relativeArea = (artwork.vault_value || 0) / totalVaultValue;
      
      // Scale factor to convert relative area to column spans
      // We want larger values to take up more columns
      const maxArea = 12; // maximum columns
      const scaledArea = Math.ceil(relativeArea * maxArea);
      
      // Adjust span based on aspect ratio and scaled area
      if (aspectRatio < 1) {
        // Vertical images: limit to 3 columns max
        return `span-${Math.min(3, Math.max(1, Math.ceil(scaledArea / 2)))}`;
      } else {
        // Horizontal images: limit to 4 columns max
        return `span-${Math.min(4, Math.max(1, scaledArea))}`;
      }
    }
    
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

  const sizeClass = layoutMode === 'variable-sized' 
    ? (sizeMode === 'randomized' ? 'randomized' : 'proportional')
    : sizeMode;
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
  const [artworkSizes, setArtworkSizes] = React.useState<Map<string, number>>(new Map());

  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const filterBgColor = useColorModeValue('gray.50', 'gray.800');
  const filterTextColor = useColorModeValue('gray.800', 'white');
  const menuBgColor = useColorModeValue('white', 'gray.700');
  const activeButtonBg = useColorModeValue('gray.200', 'blue.500');
  const inactiveButtonBg = useColorModeValue('white', 'gray.700');

  // Calculate total vault value for proportional sizing
  const totalVaultValue = React.useMemo(() => 
    artworks.reduce((sum, artwork) => sum + (artwork.vault_value || 0), 0),
    [artworks]
  );

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

  React.useEffect(() => {
    if (layoutMode === 'variable-sized') {
      const sizes = new Map<string, number>();
      artworks.forEach(artwork => {
        const img = new Image();
        img.onload = () => {
          const aspectRatio = img.naturalWidth / img.naturalHeight;
          const size = getArtworkSize(artwork, aspectRatio, sizeMode, totalVaultValue);
          sizes.set(artwork.id, size);
          setArtworkSizes(new Map(sizes));
        };
        img.src = artwork.image_url;
      });
    }
  }, [artworks, layoutMode, sizeMode, totalVaultValue]);

  const sortedArtworks = React.useMemo(() => {
    if (layoutMode !== 'variable-sized') return artworks;

    return [...artworks].sort((a, b) => {
      const sizeA = artworkSizes.get(a.id) || 1;
      const sizeB = artworkSizes.get(b.id) || 1;
      return sizeB - sizeA; // Sort larger items first
    });
  }, [artworks, artworkSizes, layoutMode]);

  const getArtworkSize = (artwork: Artwork, aspectRatio: number | null, sizeMode: SizeMode, totalVaultValue: number) => {
    if (!aspectRatio) return 1;
    
    if (sizeMode === 'randomized') {
      // Simple random sizing: 1, 2, or 3 columns
      return Math.floor(Math.random() * 3) + 1;
    }
    
    if (sizeMode === 'proportional' && totalVaultValue > 0) {
      const relativeValue = (artwork.vault_value || 0) / totalVaultValue;
      // Scale based on value: 1, 2, or 3 columns
      if (relativeValue > 0.2) return 3;
      if (relativeValue > 0.1) return 2;
      return 1;
    }
    
    return 1;
  };

  const getSpanClass = (artworkId: string) => {
    if (layoutMode !== 'variable-sized') return '';
    const size = artworkSizes.get(artworkId);
    return size && size > 1 ? `span-${size}` : '';
  };

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

    return {
      default: 4,
      1400: 3,
      1100: 2,
      800: 1
    };
  };

  const getSizeClass = (artworkId: string) => {
    if (layoutMode !== 'variable-sized') return '';
    const size = artworkSizes.get(artworkId);
    return size ? `size-${size}` : '';
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
                Size: {
                  layoutMode === 'variable-sized'
                    ? (sizeMode === 'randomized' ? 'Randomized' : 'Proportional')
                    : sizeMode.charAt(0).toUpperCase() + sizeMode.slice(1)
                }
              </MenuButton>
              <MenuList bg={menuBgColor}>
                {layoutMode === 'variable-sized' ? (
                  <>
                    <MenuItem onClick={() => setSizeMode('randomized')}>Randomized</MenuItem>
                    <MenuItem onClick={() => setSizeMode('proportional')}>Proportional to Value</MenuItem>
                  </>
                ) : (
                  <>
                    <MenuItem onClick={() => setSizeMode('small')}>Small</MenuItem>
                    <MenuItem onClick={() => setSizeMode('medium')}>Medium</MenuItem>
                    <MenuItem onClick={() => setSizeMode('large')}>Large</MenuItem>
                  </>
                )}
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
                totalVaultValue={totalVaultValue}
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
                totalVaultValue={totalVaultValue}
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
                totalVaultValue={totalVaultValue}
              />
            ))}
          </div>
        ) : (
          <Masonry
            breakpointCols={getBreakpointCols()}
            className="masonry-grid"
            columnClassName="masonry-grid_column"
          >
            {sortedArtworks.map((artwork) => (
              <ArtworkCard
                key={artwork.id}
                artwork={artwork}
                hideMetadata={hideMetadata}
                sizeMode={sizeMode}
                layoutMode={layoutMode}
                totalVaultValue={totalVaultValue}
                spanClass={getSpanClass(artwork.id)}
                getSizeClass={getSizeClass}
              />
            ))}
          </Masonry>
        )}
      </Box>
    </Box>
  );
} 