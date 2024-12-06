import {
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Avatar,
  Text,
  HStack,
  Box,
  useColorModeValue,
} from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/auth/useAuth';

export function NavMenu() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const menuBg = useColorModeValue('white', 'gray.800');

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  if (!user) {
    return (
      <HStack spacing={4}>
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
      </HStack>
    );
  }

  return (
    <Menu>
      <MenuButton
        as={Button}
        variant="ghost"
        rightIcon={<ChevronDownIcon color="currentColor" />}
      >
        <HStack spacing={2}>
          <Avatar 
            size="sm" 
            name={user.email} 
            src={user.avatar_url || undefined} 
          />
          <Box display={{ base: 'none', md: 'block' }}>
            <Text fontSize="sm" fontWeight="medium">
              {user.email}
            </Text>
          </Box>
        </HStack>
      </MenuButton>
      <MenuList bg={menuBg}>
        <MenuItem as={RouterLink} to="/dashboard">
          Dashboard
        </MenuItem>
        <MenuItem as={RouterLink} to="/profile">
          Profile
        </MenuItem>
        {user.role === 'admin' && (
          <>
            <MenuDivider />
            <MenuItem as={RouterLink} to="/admin">
              Admin Dashboard
            </MenuItem>
          </>
        )}
        <MenuDivider />
        <MenuItem onClick={handleSignOut}>
          Sign Out
        </MenuItem>
      </MenuList>
    </Menu>
  );
} 