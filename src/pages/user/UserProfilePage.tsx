import { useEffect, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  VStack,
  HStack,
  Text,
  Avatar,
  Button,
  Heading,
  useToast,
  Badge,
  Box,
  Divider,
} from '@chakra-ui/react';
import { FiEdit2, FiSettings } from 'react-icons/fi';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import type { Database } from '../../types/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'] & {
  bio?: string | null;
  premium_until?: string | null;
};

export function UserProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const toast = useToast();
  const { user } = useAuth();

  // Check if this is the user's own profile
  const isOwnProfile = user?.username === username || user?.email?.split('@')[0] === username;

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', username)
          .single();

        if (profileError) throw profileError;
        setProfile(profiles);
      } catch (error) {
        toast({
          title: 'Error loading profile',
          description: error instanceof Error ? error.message : 'An error occurred',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };

    if (username) {
      loadProfile();
    }
  }, [username, toast]);

  if (!profile) {
    return (
      <Container maxW="container.xl" py={8}>
        <Text>Profile not found</Text>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <HStack spacing={4} align="flex-start" justify="space-between">
          <HStack spacing={4} flex={1}>
            <Avatar
              size="2xl"
              name={profile.display_name || profile.username || undefined}
              src={profile.avatar_url ?? undefined}
            />
            <VStack align="flex-start" spacing={2}>
              <Heading size="lg">{profile.display_name || profile.username}</Heading>
              <HStack>
                <Badge colorScheme={profile.role === 'admin' ? 'red' : profile.role === 'artist' ? 'purple' : 'blue'}>
                  {profile.role}
                </Badge>
                {profile.premium_until && (
                  <Badge colorScheme="gold">Premium</Badge>
                )}
              </HStack>
              {profile.bio && <Text color="gray.600">{profile.bio}</Text>}
            </VStack>
          </HStack>

          {isOwnProfile && (
            <HStack>
              <Button
                as={RouterLink}
                to={`/${username}/settings`}
                leftIcon={<FiSettings />}
                variant="outline"
              >
                Settings
              </Button>
              <Button
                as={RouterLink}
                to={`/${username}/dashboard`}
                leftIcon={<FiEdit2 />}
                colorScheme="blue"
              >
                Dashboard
              </Button>
            </HStack>
          )}
        </HStack>

        <Divider />

        <Box>
          <Heading size="md" mb={4}>Activity</Heading>
          <Text color="gray.600">No recent activity</Text>
        </Box>
      </VStack>
    </Container>
  );
} 