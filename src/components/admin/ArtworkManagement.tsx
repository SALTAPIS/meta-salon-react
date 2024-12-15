import {
  Box,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  useToast,
  Alert,
  AlertIcon,
  Stack,
  Card,
  CardHeader,
  Image,
  Link,
  Badge,
  useColorModeValue,
  Heading,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Input,
  useDisclosure,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { supabaseAdmin } from '../../lib/supabaseAdmin';
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
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
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

  useEffect(() => {
    fetchArtworks();
  }, []);

  const handleEditClick = (artwork: Artwork) => {
    setSelectedArtwork(artwork);
    setEditTitle(artwork.title);
    onOpen();
  };

  const handleUpdateTitle = async () => {
    if (!selectedArtwork) return;

    try {
      console.log('Starting title update for artwork:', selectedArtwork.id);
      
      // First verify we can fetch the artwork with admin client
      const { data: existingArtwork, error: fetchError } = await supabaseAdmin
        .from('artworks')
        .select('*')
        .eq('id', selectedArtwork.id)
        .single();

      if (fetchError) {
        console.error('Failed to verify artwork with admin client:', fetchError);
        throw fetchError;
      }

      console.log('Found artwork:', existingArtwork);
      console.log('Attempting update with new title:', editTitle);

      // Perform the update
      const { data: updatedData, error: updateError } = await supabaseAdmin
        .from('artworks')
        .update({ 
          title: editTitle,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedArtwork.id)
        .select()
        .single();

      if (updateError) {
        console.error('Update failed:', updateError);
        throw updateError;
      }

      console.log('Update successful:', updatedData);

      // Update local state with the returned data
      const updateLocalState = (artworks: Artwork[]) =>
        artworks.map(art => art.id === selectedArtwork.id ? updatedData : art);

      setSubmittedArtworks(updateLocalState);
      setUnsubmittedArtworks(updateLocalState);

      // Refresh the full list to ensure we're in sync
      await fetchArtworks();

      toast({
        title: 'Success',
        description: `Title updated to: ${editTitle}`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });

      onClose();
    } catch (error) {
      console.error('Full error details:', error);
      toast({
        title: 'Error updating title',
        description: error instanceof Error ? error.message : 'Failed to update title',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

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
                <Stack spacing={1}>
                  <Link as={RouterLink} to={`/artwork/${artwork.id}`} color="blue.500">
                    {artwork.title || "Untitled"}
                  </Link>
                  <Button
                    size="xs"
                    colorScheme="blue"
                    variant="ghost"
                    onClick={() => handleEditClick(artwork)}
                  >
                    Edit Title
                  </Button>
                </Stack>
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
    <Box>
      <Stack spacing={8}>
        <Card>
          <CardHeader>
            <Heading size="md">Artwork Management</Heading>
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

      {/* Edit Title Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Edit Artwork Title</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              placeholder="Enter new title"
            />
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={handleUpdateTitle}>
              Save
            </Button>
            <Button variant="ghost" onClick={onClose}>Cancel</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
} 