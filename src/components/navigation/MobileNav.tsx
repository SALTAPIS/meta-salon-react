import {
  Box,
  Container,
  Flex,
  HStack,
  Text,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  useColorModeValue,
  useColorMode,
  Avatar,
  Button,
  IconButton,
} from '@chakra-ui/react';
import { ChevronDownIcon, MoonIcon, SunIcon } from '@chakra-ui/icons';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Logo } from './Logo';

export function MobileNav() {
  const { user, signOut } = useAuth();
  const { colorMode, toggleColorMode } = useColorMode();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const username = user?.username || user?.email?.split('@')[0] || 'User';
  const isAdmin = user?.role === 'admin' || user?.user_metadata?.role === 'admin';

  return (
    <Box
      as="nav"
      bg={bgColor}
      borderBottom="1px"
      borderColor={borderColor}
      display={{ base: 'block', md: 'none' }}
      position="fixed"
      top={0}
      left={0}
      right={0}
      zIndex={2000}
      boxShadow="sm"
    >
      <Container maxW="container.xl">
        <Flex h={16} alignItems="center" justify="space-between">
          {/* Left side - Logo + Title */}
          <HStack as={RouterLink} to="/game" spacing={2}>
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

          {/* Right side - Theme + Menu */}
          <HStack spacing={2}>
            <IconButton
              aria-label="Toggle color mode"
              icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
              onClick={toggleColorMode}
              variant="ghost"
              size="sm"
            />
            <Menu>
              <MenuButton
                as={Button}
                rightIcon={<ChevronDownIcon />}
                variant="ghost"
                px={2}
              >
                {user ? (
                  <HStack spacing={2}>
                    <Avatar 
                      size="sm" 
                      name={user.display_name || username} 
                      src={user.avatar_url || undefined}
                    />
                    <Text>{username}</Text>
                  </HStack>
                ) : (
                  <Text>The Salon Game</Text>
                )}
              </MenuButton>
              <MenuList zIndex={2000}>
                {/* Main Navigation */}
                <MenuItem as={RouterLink} to="/game">The Salon Game</MenuItem>
                <MenuItem as={RouterLink} to="/artworks">Artworks</MenuItem>
                <MenuItem as={RouterLink} to="/classement">Classement</MenuItem>
                <MenuItem as={RouterLink} to="/submit">Submit Art</MenuItem>
                
                {user ? (
                  <>
                    <MenuDivider />
                    {/* User Section */}
                    <MenuItem as={RouterLink} to={`/${username}`}>Profile</MenuItem>
                    <MenuItem as={RouterLink} to={`/${username}/dashboard`}>Dashboard</MenuItem>
                    <MenuItem as={RouterLink} to={`/${username}/tokens`}>Vote Packs</MenuItem>
                    
                    {/* Special Access Section */}
                    {isAdmin && (
                      <MenuItem as={RouterLink} to="/admin">Admin Panel</MenuItem>
                    )}
                    <MenuDivider />
                    <MenuItem onClick={signOut}>Sign Out</MenuItem>
                  </>
                ) : (
                  <>
                    <MenuDivider />
                    <MenuItem as={RouterLink} to="/auth/signin">Sign in</MenuItem>
                    <MenuItem as={RouterLink} to="/auth/signup">Sign up</MenuItem>
                  </>
                )}
              </MenuList>
            </Menu>
          </HStack>
        </Flex>
      </Container>
    </Box>
  );
} 