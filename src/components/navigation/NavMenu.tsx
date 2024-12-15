import {
  Button,
  HStack,
  Menu,
  MenuButton,
  MenuItem,
  MenuList,
  MenuDivider,
  Text,
  useColorModeValue,
  Avatar,
} from '@chakra-ui/react';
import { ChevronDownIcon } from '@chakra-ui/icons';
import { Link as RouterLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

export function NavMenu() {
  const { user, signOut } = useAuth();
  const menuBg = useColorModeValue('white', 'gray.800');
  const iconColor = useColorModeValue('gray.600', 'whiteAlpha.900');
  const username = user?.username || user?.email?.split('@')[0] || 'User';

  const handleSignOut = async () => {
    await signOut();
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
        rightIcon={<ChevronDownIcon color={iconColor} />}
        _hover={{ bg: 'transparent' }}
        _active={{ bg: 'transparent' }}
      >
        <HStack spacing={3}>
          <Avatar
            size="sm"
            name={username}
            src={user.avatar_url || undefined}
          />
          <Text>{username}</Text>
        </HStack>
      </MenuButton>

      <MenuList bg={menuBg}>
        <MenuItem as={RouterLink} to={`/${username}`}>
          Profile
        </MenuItem>
        <MenuItem as={RouterLink} to={`/${username}/dashboard`}>
          Dashboard
        </MenuItem>
        <MenuDivider />
        <MenuItem onClick={handleSignOut}>
          Sign Out
        </MenuItem>
      </MenuList>
    </Menu>
  );
} 