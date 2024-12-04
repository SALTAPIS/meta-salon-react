import React from 'react';
import { Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import {
  Box,
  Flex,
  HStack,
  Link,
  Button,
  Icon,
  useColorMode,
  Text,
  useColorModeValue,
} from '@chakra-ui/react';
import type { UserRole } from '../../types/user';
import { MdDarkMode, MdLightMode } from 'react-icons/md';

interface NavItem {
  label: string;
  href: string;
  roles?: UserRole[];
}

const mainNavItems: NavItem[] = [
  { label: 'The Salon Game', href: '/game' },
  { label: 'Classement', href: '/classement' },
  { label: 'Artworks', href: '/artworks' },
  { label: 'Submit Art', href: '/submit' },
];

export function Header() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { colorMode, toggleColorMode } = useColorMode();

  const isAuthPage = location.pathname.startsWith('/auth/');
  const textColor = useColorModeValue('gray.600', 'gray.300');
  const hoverColor = useColorModeValue('gray.800', 'white');
  const activeColor = useColorModeValue('blue.500', 'blue.300');
  const logoColor = useColorModeValue('#111111', '#FFFFFF');

  console.log('Header state:', { 
    user, 
    isAuthPage,
    userEmail: user?.email,
    userRole: user?.role,
    pathname: location.pathname
  });

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth/signin', { replace: true });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <Box as="header" borderBottom="1px" borderColor={useColorModeValue('gray.200', 'gray.700')} py={4}>
      <Flex maxW="7xl" mx="auto" px={4} align="center">
        {/* Left section: Logo */}
        <Flex flex="1">
          <Link as={RouterLink} to="/" display="flex" alignItems="center">
            <Box as="svg" h="24px" w="17px" viewBox="0 0 177 250" fill="none" xmlns="http://www.w3.org/2000/svg" mr={2}>
              <path fillRule="evenodd" clipRule="evenodd" d="M88.4866 65.3935C89.683 67.0741 90.8606 68.6981 92.0103 70.2559L95.6648 75.2033C107.834 91.6976 130.5 122.401 136.201 132.712C143.585 146.052 147.557 173.367 133.313 192.269C122.275 206.884 105.937 215.278 88.496 215.278C71.0552 215.278 54.7173 206.884 43.6977 192.288C29.4348 173.376 33.4164 146.062 40.8096 132.693C46.3615 122.628 68.5223 92.5568 80.4205 76.4023C82.0281 74.2308 83.5516 72.1537 84.9442 70.2653C86.1032 68.7075 87.2809 67.0741 88.4866 65.3935M88.4976 0C84.7001 9.24108 71.7958 30.4134 57.5386 49.764C43.3094 69.1429 18.3966 102.624 11.0254 116C-1.89757 139.419 -7.30001 181.678 16.5678 213.385C35.509 238.512 62.6891 250 88.4976 250C114.334 250 141.486 238.512 160.428 213.385C184.286 181.678 178.912 139.419 165.979 116C158.589 102.624 133.695 69.1429 119.438 49.764C105.19 30.4134 92.2859 9.24108 88.4976 0" fill={logoColor}/>
            </Box>
            <Text fontSize="lg" fontWeight="bold" color={textColor}>
              Meta.Salon
            </Text>
          </Link>
        </Flex>

        {/* Center section: Main navigation */}
        <Flex flex="1" justify="center">
          <HStack spacing={8}>
            {mainNavItems.map((item) => {
              if (item.roles && (!user?.role || !item.roles.includes(user.role as UserRole))) {
                return null;
              }
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  as={RouterLink}
                  to={item.href}
                  fontSize="sm"
                  fontWeight="500"
                  color={isActive ? activeColor : textColor}
                  _hover={{ color: hoverColor }}
                  position="relative"
                  _after={isActive ? {
                    content: '""',
                    position: 'absolute',
                    bottom: '-4px',
                    left: 0,
                    right: 0,
                    height: '2px',
                    bg: activeColor,
                    borderRadius: 'full'
                  } : undefined}
                >
                  {item.label}
                </Link>
              );
            })}
          </HStack>
        </Flex>

        {/* Right section: Auth, Theme */}
        <Flex flex="1" justify="flex-end">
          <HStack spacing={4}>
            {user ? (
              <>
                <Link
                  as={RouterLink}
                  to="/dashboard"
                  fontSize="sm"
                  fontWeight="500"
                  color={location.pathname === '/dashboard' ? activeColor : textColor}
                  _hover={{ color: hoverColor }}
                >
                  Dashboard
                </Link>
                <Button
                  onClick={handleSignOut}
                  variant="ghost"
                  size="sm"
                  color={textColor}
                  _hover={{ color: hoverColor }}
                >
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Button
                  as={RouterLink}
                  to="/auth/signin"
                  variant="ghost"
                  size="sm"
                >
                  Sign In
                </Button>
                <Button
                  as={RouterLink}
                  to="/auth/signup"
                  colorScheme="blue"
                  size="sm"
                >
                  Sign Up
                </Button>
              </>
            )}
            <Button
              onClick={toggleColorMode}
              variant="ghost"
              size="sm"
              aria-label="Toggle color mode"
            >
              <Icon as={colorMode === 'light' ? MdDarkMode : MdLightMode} />
            </Button>
          </HStack>
        </Flex>
      </Flex>
    </Box>
  );
} 