import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Flex,
  HStack,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Text,
  useColorModeValue,
  Container,
  Spinner,
  Avatar,
} from '@chakra-ui/react';
import { useAuth } from '../../hooks/useAuth';

export function Navigation() {
  const { user, signOut, isLoading } = useAuth();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  // Debug logging
  console.log('[Navigation] User state:', {
    isLoading,
    userId: user?.id,
    username: user?.username,
    email: user?.email,
    role: user?.role,
    metadata: user?.user_metadata,
  });

  // Get the base path for user routes
  const getPath = (route: string) => {
    const username = user?.username || user?.email?.split('@')[0];
    return `/${username}/${route}`;
  };

  return (
    <Box
      bg={bgColor}
      borderBottom={1}
      borderStyle="solid"
      borderColor={borderColor}
      position="sticky"
      top={0}
      zIndex={1000}
    >
      <Container maxW="container.xl">
        <Flex h={16} alignItems="center" justifyContent="space-between">
          {/* Left side */}
          <HStack spacing={8} alignItems="center">
            <RouterLink to="/">
              <Text fontSize="xl" fontWeight="bold">
                Meta Salon
              </Text>
            </RouterLink>

            <HStack spacing={4}>
              <RouterLink to="/artworks">
                <Text>Artworks</Text>
              </RouterLink>
              <RouterLink to="/game">
                <Text>Game</Text>
              </RouterLink>
              <RouterLink to="/classement">
                <Text>Classement</Text>
              </RouterLink>
            </HStack>
          </HStack>

          {/* Right side */}
          <HStack spacing={4}>
            {isLoading ? (
              <Spinner size="sm" />
            ) : user ? (
              <>
                {/* Balance Display */}
                {typeof user.balance === 'number' && (
                  <Text fontWeight="bold">
                    {user.balance.toLocaleString()} SLN
                  </Text>
                )}

                <Menu>
                  <MenuButton as={Button} variant="ghost" px={2}>
                    <HStack spacing={2}>
                      <Avatar
                        size="sm"
                        name={user.display_name || user.username || undefined}
                        src={user.avatar_url || undefined}
                      />
                      <Text>{user.display_name || user.username || user.email?.split('@')[0]}</Text>
                    </HStack>
                  </MenuButton>
                  <MenuList>
                    <MenuItem as={RouterLink} to={getPath('dashboard')}>
                      Dashboard
                    </MenuItem>
                    <MenuItem as={RouterLink} to={getPath('profile')}>
                      Profile
                    </MenuItem>
                    <MenuItem as={RouterLink} to="/tokens">
                      Vote Packs
                    </MenuItem>
                    {user.role === 'admin' && (
                      <MenuItem as={RouterLink} to="/admin">
                        Admin Panel
                      </MenuItem>
                    )}
                    {user.role && ['artist', 'admin'].includes(user.role) && (
                      <MenuItem as={RouterLink} to="/artist">
                        Artist Dashboard
                      </MenuItem>
                    )}
                    <MenuDivider />
                    <MenuItem onClick={signOut}>
                      Sign Out
                    </MenuItem>
                  </MenuList>
                </Menu>
              </>
            ) : (
              <>
                <Button
                  as={RouterLink}
                  to="/auth/signin"
                  variant="ghost"
                >
                  Sign In
                </Button>
                <Button
                  as={RouterLink}
                  to="/auth/signup"
                  colorScheme="blue"
                >
                  Sign Up
                </Button>
              </>
            )}
          </HStack>
        </Flex>
      </Container>
    </Box>
  );
} 