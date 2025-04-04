import {
  Box,
  Container,
  Flex,
  Text,
  useColorMode,
  IconButton,
  HStack,
  Tabs,
  Tab,
  TabList,
  useColorModeValue,
} from '@chakra-ui/react';
import { MoonIcon, SunIcon } from '@chakra-ui/icons';
import { NavMenu } from './NavMenu';
import { MobileNav } from './MobileNav';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import { Logo } from './Logo';

export function Header() {
  const { colorMode, toggleColorMode } = useColorMode();
  const location = useLocation();
  const navigate = useNavigate();
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const tabTextColor = useColorModeValue('gray.500', 'gray.400');
  const selectedTabColor = useColorModeValue('black', 'white');
  const bg = useColorModeValue('white', '#1a1816');

  const paths = [
    { path: '/game', label: 'The Salon Game' },
    { path: '/artworks', label: 'Artworks' },
    { path: '/classement', label: 'Classement' },
    { path: '/submit', label: 'Submit Art' }
  ];

  const getCurrentTabIndex = () => {
    const currentPath = location.pathname;
    
    // Check if we're on a user page
    if (currentPath.includes('/dashboard') || 
        currentPath.includes('/settings') || 
        currentPath.includes('/tokens') ||
        currentPath.includes('/albums')) {
      return -1; // No tab selected
    }
    // Check for root or artworks page
    if (currentPath === '/' || currentPath === '/artworks') {
      return 1; // Artworks tab
    }
    // Check for exact path matches
    if (currentPath === '/game') {
      return 0;
    }
    if (currentPath === '/classement') {
      return 2;
    }
    if (currentPath === '/submit') {
      return 3;
    }
    
    // Check if we're on a user profile page (only username in path)
    if (currentPath.split('/').length === 2 && currentPath !== '/') {
      return -1; // No tab selected for user profile pages
    }
    
    return -1; // Default to no selection
  };

  const handleTabChange = (index: number) => {
    navigate(paths[index].path);
  };

  return (
    <>
      {/* Mobile Navigation */}
      <MobileNav />

      {/* Desktop Navigation */}
      <Box 
        as="header" 
        borderBottomWidth="1px" 
        borderColor={borderColor}
        display={{ base: 'none', md: 'block' }}
        bg={bg}
        position="relative"
        zIndex={1}
      >
        <Container size="wide">
          <Flex align="center" justify="space-between">
            <HStack as={RouterLink} to="/game" spacing={2} cursor="pointer" py={4}>
              <Logo />
              <Text 
                fontSize="xl" 
                fontWeight="bold"
                fontFamily="'Allan', cursive"
                letterSpacing="wide"
                textTransform="none"
                style={{ fontWeight: 700 }}
              >
                Meta.Salon
              </Text>
            </HStack>

            <Box height="57px" position="relative" mt="-11px">
              <Tabs 
                index={getCurrentTabIndex()} 
                onChange={handleTabChange}
                variant="unstyled"
                sx={{
                  '.chakra-tabs__tab-list': {
                    position: 'relative',
                    backgroundColor: 'inherit'
                  },
                  '.chakra-tabs__tab': {
                    fontSize: 'sm',
                    px: 4,
                    py: 6,
                    color: tabTextColor,
                    position: 'relative',
                    transition: 'color 0.2s',
                    backgroundColor: 'inherit',
                    _hover: {
                      color: selectedTabColor
                    },
                    _selected: {
                      color: selectedTabColor,
                      fontWeight: 'semibold'
                    }
                  }
                }}
              >
                <TabList>
                  {paths.map(({ path, label }) => (
                    <Tab key={path}>
                      {label}
                    </Tab>
                  ))}
                </TabList>
              </Tabs>
            </Box>

            <HStack spacing={4} py={4}>
              <IconButton
                aria-label="Toggle color mode"
                icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
                onClick={toggleColorMode}
                variant="ghost"
              />
              <NavMenu />
            </HStack>
          </Flex>
        </Container>
      </Box>
    </>
  );
} 