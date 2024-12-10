import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  VStack,
  HStack,
  Text,
  Avatar,
  IconButton,
  Heading,
  useToast,
} from '@chakra-ui/react';
import { FiMoreVertical } from 'react-icons/fi';
import { supabase } from '../../lib/supabaseClient';
import type { Database } from '../../types/database.types';

type Profile = Database['public']['Tables']['profiles']['Row'] & {
  bio?: string | null;
  premium_until?: string | null;
};

export function UserProfilePage() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const toast = useToast();

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
        <HStack spacing={4} align="flex-start">
          <Avatar
            size="2xl"
            name={profile.display_name || profile.username || undefined}
            src={profile.avatar_url ?? undefined}
          />
          <VStack align="flex-start" flex={1} spacing={2}>
            <Heading size="lg">{profile.display_name || profile.username}</Heading>
            {profile.bio && <Text color="gray.600">{profile.bio}</Text>}
          </VStack>
          <IconButton
            aria-label="More options"
            icon={<FiMoreVertical />}
            variant="ghost"
          />
        </HStack>
      </VStack>
    </Container>
  );
} 