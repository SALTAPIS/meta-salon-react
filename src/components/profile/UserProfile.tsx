import {
  Box,
  VStack,
  Heading,
  Text,
  Avatar,
  useColorModeValue,
} from '@chakra-ui/react';
import { useAuth } from '../../hooks/useAuth';
import { UserStats } from './UserStats';

export function UserProfile() {
  const { user } = useAuth();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  if (!user) return null;

  return (
    <Box
      p={6}
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="lg"
      shadow="sm"
    >
      <VStack spacing={6} align="center">
        <Avatar
          size="2xl"
          name={user.email}
          src={user.avatar_url || undefined}
        />
        <Box textAlign="center">
          <Heading size="md">{user.email}</Heading>
          <Text color="gray.500" mt={1}>
            Member since {new Date(user.created_at).toLocaleDateString()}
          </Text>
        </Box>
        <UserStats userId={user.id} />
      </VStack>
    </Box>
  );
} 