import React from 'react';
import {
  Box,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  Container,
  useColorModeValue,
  HStack,
  Button,
  ButtonGroup,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Spacer,
} from '@chakra-ui/react';
import { ChevronDownIcon, TimeIcon, ViewIcon } from '@chakra-ui/icons';
import { Link as RouterLink } from 'react-router-dom';
import { ArtworkService } from '../../services/ArtworkService';
import type { Artwork } from '../../types/database.types';
import { ArtworkCard } from '../game/ArtworkCard';

type LayoutMode = 'masonry-fixed' | 'masonry-variable' | 'float' | 'list';

export function ClassementPage() {
  const [artworks, setArtworks] = React.useState<Artwork[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [timeFilter, setTimeFilter] = React.useState('all');
  const [sortBy, setSortBy] = React.useState('vault_value');
  const [viewMode, setViewMode] = React.useState('artworks'); // 'artworks' or 'artists'
  const [layoutMode, setLayoutMode] = React.useState<LayoutMode>('masonry-fixed');

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const filterBgColor = useColorModeValue('gray.50', 'gray.800');
  const filterTextColor = useColorModeValue('gray.800', 'white');
  const menuBgColor = useColorModeValue('white', 'gray.700');
  const buttonColorScheme = useColorModeValue('gray', 'blue');
  const activeButtonBg = useColorModeValue('gray.200', 'blue.500');
  const inactiveButtonBg = useColorModeValue('white', 'gray.700');

  React.useEffect(() => {
    const loadArtworks = async () => {
      try {
        setIsLoading(true);
        const data = await ArtworkService.getAllArtworks();
        // Sort by vault value descending
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

  if (isLoading) {
    return (
      <Center py={20}>
        <Spinner size="xl" />
      </Center>
    );
  }

  if (error) {
    return (
      <Container py={8}>
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <>
      <Box bg={filterBgColor} borderBottomWidth={1} borderColor={borderColor} mb={6}>
        <HStack spacing={4} justify="space-between" py={4}>
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
                _hover={{ bg: useColorModeValue('gray.100', 'blue.600') }}
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
                _hover={{ bg: useColorModeValue('gray.100', 'blue.600') }}
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
                _hover={{ bg: useColorModeValue('gray.100', 'blue.600') }}
              >
                Layout: {layoutMode.replace('-', ' ')}
              </MenuButton>
              <MenuList bg={menuBgColor}>
                <MenuItem onClick={() => setLayoutMode('masonry-fixed')}>Fixed Width Masonry</MenuItem>
                <MenuItem onClick={() => setLayoutMode('masonry-variable')}>Variable Width Masonry</MenuItem>
                <MenuItem onClick={() => setLayoutMode('float')}>Fixed Height Grid</MenuItem>
                <MenuItem onClick={() => setLayoutMode('list')}>List View</MenuItem>
              </MenuList>
            </Menu>
          </HStack>
        </HStack>
      </Box>

      <Box
        sx={{
          columnCount: [1, 2, 3, 4, 5, 6],
          columnGap: "1.5rem",
          "& > div": {
            marginBottom: "3rem",
            breakInside: "avoid",
          }
        }}
      >
        {artworks.map((artwork: Artwork) => (
          <Box
            key={artwork.id}
            as={RouterLink}
            to={`/artwork/${artwork.id}`}
            borderWidth={1}
            overflow="hidden"
            bg={bgColor}
            borderColor={borderColor}
            transition="all 0.2s"
            _hover={{ transform: 'translateY(-4px)', shadow: 'lg' }}
            display="inline-block"
            w="100%"
          >
            <ArtworkCard artwork={artwork} showStats={true} />
          </Box>
        ))}
      </Box>
    </>
  );
} 