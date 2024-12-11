import {
  Box,
  Stack,
  Card,
  CardHeader,
  HStack,
  Heading,
  Button,
  Alert,
  AlertIcon,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Image,
  Badge,
  Link,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Link as RouterLink } from 'react-router-dom';

interface Artwork {
  id: string;
  title: string;
  description: string;
  image_url: string;
  status: string;
  created_at: string;
  user_id: string;
  challenge_id: string | null;
  vault_status: string;
  vote_count: number;
  vault_value: number;
}

export function ArtworkManagement() {
  const [submittedArtworks, setSubmittedArtworks] = useState<Artwork[]>([]);
  const [unsubmittedArtworks, setUnsubmittedArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);
  const bgColor = useColorModeValue('white', 'gray.800');
  const toast = useToast();

  const fetchArtworks = async () => {
    try {
      setLoading(true);

      // Fetch submitted artworks
      const { data: submitted, error: submittedError } = await supabase
        .from('artworks')
        .select('*')
        .in('status', ['submitted', 'approved'])
        .order('created_at', { ascending: false });

      if (submittedError) throw submittedError;
      setSubmittedArtworks(submitted || []);

      // Fetch unsubmitted artworks
      const { data: unsubmitted, error: unsubmittedError } = await supabase
        .from('artworks')
        .select('*')
        .eq('status', 'draft')
        .order('created_at', { ascending: false });

      if (unsubmittedError) throw unsubmittedError;
      setUnsubmittedArtworks(unsubmitted || []);

    } catch (error) {
      console.error('Error fetching artworks:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch artworks',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleResetVotes = async () => {
    try {
      setResetting(true);
      const { data, error } = await supabase.rpc('admin_reset_all_votes');

      if (error) throw error;

      toast({
        title: 'Votes Reset Successfully',
        description: `Deleted ${data.deleted_votes} votes and reset ${data.updated_artworks} artworks`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Refresh artwork data
      await fetchArtworks();
    } catch (error) {
      console.error('Error resetting votes:', error);
      toast({
        title: 'Error Resetting Votes',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setResetting(false);
    }
  };

  useEffect(() => {
    fetchArtworks();
  }, []);

  const ArtworkTable = ({ artworks, title }: { artworks: Artwork[], title: string }) => (
    <Box overflowX="auto">
      <Heading size="md" mb={4}>{title}</Heading>
      <Table variant="simple" bg={bgColor} borderRadius="lg">
        <Thead>
          <Tr>
            <Th>Image</Th>
            <Th>Title</Th>
            <Th>Status</Th>
            <Th>Vault Status</Th>
            <Th>Votes</Th>
            <Th>Value</Th>
            <Th>Created</Th>
            <Th>Actions</Th>
          </Tr>
        </Thead>
        <Tbody>
          {artworks.map((artwork) => (
            <Tr key={artwork.id}>
              <Td>
                <Image 
                  src={artwork.image_url} 
                  alt={artwork.title}
                  boxSize="50px"
                  objectFit="cover"
                  borderRadius="md"
                />
              </Td>
              <Td>
                <Link as={RouterLink} to={`/artwork/${artwork.id}`} color="blue.500">
                  {artwork.title}
                </Link>
              </Td>
              <Td>
                <Badge colorScheme={artwork.status === 'approved' ? 'green' : 'yellow'}>
                  {artwork.status}
                </Badge>
              </Td>
              <Td>
                <Badge colorScheme={artwork.vault_status === 'active' ? 'green' : 'gray'}>
                  {artwork.vault_status}
                </Badge>
              </Td>
              <Td>{artwork.vote_count || 0}</Td>
              <Td>{artwork.vault_value || 0} SLN</Td>
              <Td>{new Date(artwork.created_at).toLocaleDateString()}</Td>
              <Td>
                <Link as={RouterLink} to={`/artwork/${artwork.id}`}>
                  <Button size="sm" colorScheme="blue">View</Button>
                </Link>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );

  return (
    <Stack spacing={8}>
      <Card>
        <CardHeader>
          <HStack justify="space-between" align="center">
            <Heading size="md">Artwork Management</Heading>
            <Button
              colorScheme="red"
              onClick={handleResetVotes}
              isLoading={resetting}
              loadingText="Resetting..."
            >
              Reset All Votes
            </Button>
          </HStack>
        </CardHeader>
      </Card>

      {loading ? (
        <Alert status="info">
          <AlertIcon />
          Loading artworks...
        </Alert>
      ) : (
        <>
          <ArtworkTable 
            artworks={submittedArtworks} 
            title="Submitted & Approved Artworks" 
          />
          <ArtworkTable 
            artworks={unsubmittedArtworks} 
            title="Draft Artworks" 
          />
        </>
      )}
    </Stack>
  );
} 