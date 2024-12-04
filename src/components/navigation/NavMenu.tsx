import React from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';
import { Box, Stack, Link, Text, Button, Icon, VStack, Spacer } from '@chakra-ui/react';
import type { UserRole } from '../../types/user';
import { MdLogout } from 'react-icons/md';

interface NavItem {
  label: string;
  href: string;
  roles?: UserRole[];
}

const navItems: NavItem[] = [
  { label: 'Profile', href: '/profile' },
  { label: 'Challenges', href: '/challenges', roles: ['member', 'admin'] },
  { label: 'Create Challenge', href: '/challenges/create', roles: ['member', 'admin'] },
  { label: 'Monitoring', href: '/admin/monitoring', roles: ['admin'] },
  { label: 'Challenge Management', href: '/admin/challenges', roles: ['admin'] },
];

export function NavMenu() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth/signin');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <VStack h="full" py={4} spacing={4}>
      <Box as="nav" w="full">
        <Stack spacing={2}>
          {navItems.map((item) => {
            if (item.roles && (!user?.role || !item.roles.includes(user.role as UserRole))) {
              return null;
            }

            return (
              <Link
                key={item.href}
                as={RouterLink}
                to={item.href}
                p={2}
                rounded="md"
                _hover={{
                  bg: 'gray.100',
                }}
              >
                <Text>{item.label}</Text>
              </Link>
            );
          })}
        </Stack>
      </Box>
      
      <Spacer />
      
      <Box w="full" px={2}>
        <Button
          w="full"
          variant="ghost"
          colorScheme="gray"
          justifyContent="flex-start"
          leftIcon={<Icon as={MdLogout} />}
          onClick={handleSignOut}
        >
          Sign Out
        </Button>
      </Box>
    </VStack>
  );
} 