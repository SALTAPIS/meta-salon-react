import React from 'react';
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

type LayoutMode = 'masonry' | 'compact' | 'table' | 'list';
type SizeMode = 'small' | 'medium' | 'large';

const MasonryArtworkCard = ({ 
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

  // Calculate width class based on aspect ratio and size mode
  const getWidthClass = () => {
    if (layoutMode === 'table' || layoutMode === 'list') return "w-full";
    
    const baseWidth = {
      small: { wide: "w-1/2", normal: "w-1/3", tall: "w-1/4" },
      medium: { wide: "w-3/4", normal: "w-1/2", tall: "w-1/3" },
      large: { wide: "w-full", normal: "w-3/4", tall: "w-1/2" }
    }[sizeMode];

    if (!aspectRatio) return baseWidth.normal;
    if (aspectRatio > 1.7) return baseWidth.wide;
    if (aspectRatio < 0.8) return baseWidth.tall;
    return baseWidth.normal;
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

  const hasStats = (artwork.vault_value ?? 0) > 0 || (artwork.vote_count ?? 0) > 0;
  const sizeClass = sizeMode === 'small' ? 'small' : sizeMode === 'medium' ? 'medium' : 'large';

  return (
    <div className={`artwork-card ${getWidthClass()} ${sizeClass}`}>
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
  const [layoutMode, setLayoutMode] = React.useState<LayoutMode>('masonry');
  const [sizeMode, setSizeMode] = React.useState<SizeMode>('medium');

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

  const getLayoutStyles = () => {
    const baseStyles = {
      width: '100%',
      textAlign: 'left' as const,
    };

    if (layoutMode === 'table') {
      return {
        ...baseStyles,
        className: 'table-layout',
      };
    }

    return {
      ...baseStyles,
      className: 'masonry-layout',
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
                Layout: {layoutMode.charAt(0).toUpperCase() + layoutMode.slice(1)}
              </MenuButton>
              <MenuList bg={menuBgColor}>
                <MenuItem onClick={() => setLayoutMode('masonry')}>Masonry Grid</MenuItem>
                <MenuItem onClick={() => setLayoutMode('compact')}>Compact Grid</MenuItem>
                <MenuItem onClick={() => setLayoutMode('table')}>Table View</MenuItem>
                <MenuItem onClick={() => setLayoutMode('list')}>List View</MenuItem>
              </MenuList>
            </Menu>

            {layoutMode !== 'table' && (
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
            )}
          </HStack>
        </HStack>
      </Box>

      <Box px={6}>
        <div className={getLayoutStyles().className}>
          {artworks.map((artwork: Artwork) => (
            <MasonryArtworkCard 
              key={artwork.id}
              artwork={artwork}
              hideMetadata={layoutMode === 'compact'}
              sizeMode={sizeMode}
              layoutMode={layoutMode}
            />
          ))}
        </div>
      </Box>
    </Box>
  );
} 