import { Link as RouterLink } from 'react-router-dom';
import {
  Box,
  Flex,
  HStack,
  Link,
  IconButton,
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  useDisclosure,
  useColorModeValue,
  Stack,
  useColorMode,
  Text,
} from '@chakra-ui/react';
import { HamburgerIcon, CloseIcon, MoonIcon, SunIcon } from '@chakra-ui/icons';
import { useSession } from '../../hooks/useSession';

interface NavLinkProps {
  children: React.ReactNode;
  to: string;
}

const NavLink = ({ children, to }: NavLinkProps) => (
  <Link
    as={RouterLink}
    px={2}
    py={1}
    rounded={'md'}
    _hover={{
      textDecoration: 'none',
      bg: useColorModeValue('gray.200', 'gray.700'),
    }}
    to={to}
  >
    {children}
  </Link>
);

export function Navigation() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { colorMode, toggleColorMode } = useColorMode();
  const { session } = useSession();

  const userRole = session?.user?.user_metadata?.role;
  const isArtist = userRole === 'artist';
  const isAdmin = userRole === 'admin';

  return (
    <Box bg={useColorModeValue('gray.100', 'gray.900')} px={4}>
      <Flex h={16} alignItems={'center'} justifyContent={'space-between'}>
        <IconButton
          size={'md'}
          icon={isOpen ? <CloseIcon /> : <HamburgerIcon />}
          aria-label={'Open Menu'}
          display={{ md: 'none' }}
          onClick={isOpen ? onClose : onOpen}
        />
        <HStack spacing={8} alignItems={'center'}>
          <Box>
            <Link as={RouterLink} to="/" _hover={{ textDecoration: 'none' }}>
              <Text fontSize="xl" fontWeight="bold">
                Meta Salon
              </Text>
            </Link>
          </Box>
          <HStack as={'nav'} spacing={4} display={{ base: 'none', md: 'flex' }}>
            <NavLink to="/artworks">Artworks</NavLink>
            <NavLink to="/game">Game</NavLink>
            <NavLink to="/classement">Classement</NavLink>
            {session && (
              <>
                <NavLink to="/tokens">Tokens</NavLink>
                {(isArtist || isAdmin) && (
                  <NavLink to="/artist">Artist Dashboard</NavLink>
                )}
                {isAdmin && (
                  <NavLink to="/admin">Admin</NavLink>
                )}
              </>
            )}
          </HStack>
        </HStack>

        <Flex alignItems={'center'}>
          <Stack direction={'row'} spacing={7}>
            <Button onClick={toggleColorMode}>
              {colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
            </Button>

            {session ? (
              <Menu>
                <MenuButton
                  as={Button}
                  rounded={'full'}
                  variant={'link'}
                  cursor={'pointer'}
                  minW={0}
                >
                  Profile
                </MenuButton>
                <MenuList>
                  <MenuItem as={RouterLink} to="/profile">
                    Settings
                  </MenuItem>
                  <MenuDivider />
                  <MenuItem as={RouterLink} to="/auth/signout">
                    Sign Out
                  </MenuItem>
                </MenuList>
              </Menu>
            ) : (
              <Button as={RouterLink} to="/auth/signin">
                Sign In
              </Button>
            )}
          </Stack>
        </Flex>
      </Flex>

      {isOpen ? (
        <Box pb={4} display={{ md: 'none' }}>
          <Stack as={'nav'} spacing={4}>
            <NavLink to="/artworks">Artworks</NavLink>
            <NavLink to="/game">Game</NavLink>
            <NavLink to="/classement">Classement</NavLink>
            {session && (
              <>
                <NavLink to="/tokens">Tokens</NavLink>
                {(isArtist || isAdmin) && (
                  <NavLink to="/artist">Artist Dashboard</NavLink>
                )}
                {isAdmin && (
                  <NavLink to="/admin">Admin</NavLink>
                )}
              </>
            )}
          </Stack>
        </Box>
      ) : null}
    </Box>
  );
} 