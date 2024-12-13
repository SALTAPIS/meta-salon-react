import {
  Box,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  HStack,
  Tag,
  useToast,
  Alert,
  AlertIcon,
  VStack,
  Heading,
  useColorModeValue,
  Spinner,
  Center,
} from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Link as RouterLink } from 'react-router-dom';

interface VoteHistory {
  id: string;
  created_at: string;
  artwork_id: string;
  user_id: string;
  value: number;
  vote_power: number;
  total_value: number;
  artwork: {
    title: string;
  } | null;
  user: {
    id: string;
    username: string | null;
    display_name: string | null;
  } | null;
}

export function VoteManagement() {
  const [votes, setVotes] = useState<VoteHistory[]>([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');

  const fetchVotes = async () => {
    try {
      setIsLoading(true);
      
      // Get total vote count
      const { count: voteCount, error: countError } = await supabase
        .from('votes')
        .select('*', { count: 'exact', head: true });

      if (countError) throw countError;
      setTotalVotes(voteCount || 0);

      // Get last 50 votes with artwork details
      const { data: voteHistory, error: votesError } = await supabase
        .from('votes')
        .select(`
          id,
          created_at,
          artwork_id,
          user_id,
          value,
          vote_power,
          total_value,
          artwork:artworks (
            title
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (votesError) throw votesError;

      // Fetch user details separately
      const userIds = [...new Set(voteHistory?.map(vote => vote.user_id) || [])];
      const { data: users, error: usersError } = await supabase
        .from('profiles')
        .select('id, username, display_name')
        .in('id', userIds);

      if (usersError) throw usersError;

      // Combine the data
      const votesWithUsers = voteHistory?.map(vote => ({
        ...vote,
        artwork: Array.isArray(vote.artwork) ? vote.artwork[0] : vote.artwork,
        user: users?.find(user => user.id === vote.user_id) || null
      })) as VoteHistory[];

      setVotes(votesWithUsers);
    } catch (err) {
      console.error('Error fetching votes:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch votes');
    } finally {
      setIsLoading(false);
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

      // Refresh vote data
      await fetchVotes();
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
    fetchVotes();
  }, []);

  if (error) {
    return (
      <Alert status="error">
        <AlertIcon />
        {error}
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <Center py={8}>
        <Spinner size="xl" />
      </Center>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      <Box>
        <HStack justify="space-between" mb={4}>
          <Heading size="md">Vote Management</Heading>
          <Button
            colorScheme="red"
            onClick={handleResetVotes}
            isLoading={resetting}
            loadingText="Resetting..."
          >
            Reset All Votes
          </Button>
        </HStack>

        <HStack spacing={4} mb={6}>
          <Text color="gray.600">
            Total Votes Cast: <Tag colorScheme="blue" size="lg">{totalVotes}</Tag>
          </Text>
        </HStack>
      </Box>

      <Box overflowX="auto">
        <Table variant="simple" bg={bgColor} borderRadius="lg">
          <Thead>
            <Tr>
              <Th>Date</Th>
              <Th>Artwork</Th>
              <Th>Voter</Th>
              <Th isNumeric>Vote Weight</Th>
              <Th isNumeric>Total Votes</Th>
              <Th isNumeric>Value</Th>
            </Tr>
          </Thead>
          <Tbody>
            {votes.map((vote) => (
              <Tr key={vote.id}>
                <Td>{new Date(vote.created_at).toLocaleString()}</Td>
                <Td>
                  <RouterLink to={`/artwork/${vote.artwork_id}`}>
                    {vote.artwork?.title || 'Unknown Artwork'}
                  </RouterLink>
                </Td>
                <Td>
                  {vote.user?.display_name || vote.user?.username || 'Unknown User'}
                </Td>
                <Td isNumeric>{vote.vote_power}x</Td>
                <Td isNumeric>{vote.value}</Td>
                <Td isNumeric>{vote.total_value} SLN</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Box>
    </VStack>
  );
} 