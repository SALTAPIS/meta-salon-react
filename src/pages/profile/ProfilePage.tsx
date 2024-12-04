import {
  Container,
  SimpleGrid,
  Box,
  useColorModeValue,
} from '@chakra-ui/react';
import { UserProfile } from '../../components/profile/UserProfile';
import { UserStats } from '../../components/profile/UserStats';
import { useAuth } from '../../hooks/auth/useAuth';

export default function ProfilePage() {
  const { user } = useAuth();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  if (!user?.id) return null;

  return (
    <Container maxW="7xl" py={8}>
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
        <Box>
          <UserProfile />
        </Box>
        <Box
          p={6}
          bg={bgColor}
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="lg"
          shadow="sm"
        >
          <UserStats userId={user.id} />
        </Box>
      </SimpleGrid>
    </Container>
  );
} 