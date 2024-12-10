import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Heading,
  SimpleGrid,
  Text,
  useToast,
} from '@chakra-ui/react';
import { supabase } from '../../lib/supabaseClient';
import type { Album } from '../../types/database.types';

export function UserAlbumsPage() {
  const { username } = useParams<{ username: string }>();
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();

  useEffect(() => {
    const loadAlbums = async () => {
      try {
        setLoading(true);
        
        // First get the user's profile
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('username', username)
          .single();

        if (profileError) throw profileError;

        // Then get their albums
        const { data: albumsData, error: albumsError } = await supabase
          .from('albums')
          .select('*')
          .eq('user_id', profiles.id)
          .order('created_at', { ascending: false });

        if (albumsError) throw albumsError;
        setAlbums(albumsData || []);
      } catch (error) {
        toast({
          title: 'Error loading albums',
          description: error instanceof Error ? error.message : 'An error occurred',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    };

    loadAlbums();
  }, [username, toast]);

  return (
    <Container maxW="container.xl" py={8}>
      <Heading mb={6}>Albums</Heading>
      {loading ? (
        <Text>Loading albums...</Text>
      ) : albums.length === 0 ? (
        <Text>No albums found</Text>
      ) : (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
          {albums.map((album) => (
            <Box
              key={album.id}
              p={5}
              shadow="md"
              borderWidth="1px"
              borderRadius="lg"
            >
              <Heading size="md" mb={2}>
                {album.title}
              </Heading>
              {album.description && (
                <Text color="gray.600">{album.description}</Text>
              )}
            </Box>
          ))}
        </SimpleGrid>
      )}
    </Container>
  );
}

export default UserAlbumsPage; 