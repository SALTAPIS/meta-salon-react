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
  Text,
  useColorModeValue,
  Container,
} from '@chakra-ui/react';
import { useAuth } from '../../hooks/useAuth';

export function Navigation() {
  const { user, signOut } = useAuth();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

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
            {user ? (
              <>
                {/* Balance Display */}
                <Text fontWeight="bold">
                  {user.balance?.toLocaleString()} SLN
                </Text>

                <Menu>
                  <MenuButton as={Button} variant="ghost">
                    {user.display_name || user.username || user.email}
                  </MenuButton>
                  <MenuList>
                    <MenuItem as={RouterLink} to={`/${user.username}/profile`}>
                      Profile
                    </MenuItem>
                    <MenuItem as={RouterLink} to={`/${user.username}/dashboard`}>
                      Dashboard
                    </MenuItem>
                    <MenuItem as={RouterLink} to={`/${user.username}/settings`}>
                      Settings
                    </MenuItem>
                    <MenuItem as={RouterLink} to="/tokens">
                      Vote Packs
                    </MenuItem>
                    {user.role === 'admin' && (
                      <MenuItem as={RouterLink} to="/admin">
                        Admin Panel
                      </MenuItem>
                    )}
                    {(user.role && ['artist', 'admin'].includes(user.role)) && (
                      <MenuItem as={RouterLink} to="/artist">
                        Artist Dashboard
                      </MenuItem>
                    )}
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