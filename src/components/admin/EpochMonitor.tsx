import { useEffect, useState } from 'react';
import {
  Box,
  VStack,
  Heading,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatGroup,
  Progress,
  Badge,
  SimpleGrid,
  useColorModeValue,
} from '@chakra-ui/react';
import { supabase } from '../../lib/supabaseClient';

interface EpochStats {
  total_votes: number;
  unique_voters: number;
  participating_artworks: number;
  highest_vote: number;
  lowest_vote: number;
  avg_vote_size: number;
  total_tokens_distributed: number;
  rewarded_artists: number;
  highest_reward: number;
  lowest_reward: number;
  avg_reward: number;
  artworks_with_votes: number;
  avg_votes_per_artwork: number;
  most_votes_artwork: number;
  least_votes_artwork: number;
  completion_percentage: number;
}

interface Epoch {
  id: number;
  start_time: string;
  end_time: string;
  status: 'active' | 'processing' | 'completed';
  total_votes: number;
  total_rewards: number;
  participating_artworks: number;
  unique_voters: number;
}

export function EpochMonitor() {
  const [currentEpoch, setCurrentEpoch] = useState<Epoch | null>(null);
  const [epochStats, setEpochStats] = useState<EpochStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    const loadEpochData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get current epoch
        const { data: epochData, error: epochError } = await supabase
          .rpc('get_current_epoch');

        if (epochError) throw epochError;

        if (epochData) {
          // Get epoch details
          const { data: epochs, error: detailsError } = await supabase
            .from('epochs')
            .select('*')
            .eq('id', epochData)
            .single();

          if (detailsError) throw detailsError;
          setCurrentEpoch(epochs);

          // Get epoch statistics
          const { data: stats, error: statsError } = await supabase
            .rpc('get_epoch_stats', { epoch_id_param: epochData });

          if (statsError) throw statsError;
          setEpochStats(stats);
        }
      } catch (err) {
        console.error('Error loading epoch data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load epoch data');
      } finally {
        setLoading(false);
      }
    };

    loadEpochData();
    const interval = setInterval(loadEpochData, 60000); // Refresh every minute

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Box p={4} borderWidth={1} borderRadius="lg" bg={bgColor} borderColor={borderColor}>
        <Text>Loading epoch data...</Text>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4} borderWidth={1} borderRadius="lg" bg={bgColor} borderColor={borderColor}>
        <Text color="red.500">Error: {error}</Text>
      </Box>
    );
  }

  if (!currentEpoch || !epochStats) {
    return (
      <Box p={4} borderWidth={1} borderRadius="lg" bg={bgColor} borderColor={borderColor}>
        <Text>No active epoch found</Text>
      </Box>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'green';
      case 'processing':
        return 'yellow';
      case 'completed':
        return 'blue';
      default:
        return 'gray';
    }
  };

  return (
    <Box p={6} borderWidth={1} borderRadius="lg" bg={bgColor} borderColor={borderColor}>
      <VStack spacing={6} align="stretch">
        <Box>
          <Heading size="md" mb={2}>Current Epoch</Heading>
          <Badge colorScheme={getStatusColor(currentEpoch.status)}>
            {currentEpoch.status.toUpperCase()}
          </Badge>
          <Progress
            mt={4}
            value={epochStats.completion_percentage}
            colorScheme="blue"
            hasStripe
            isAnimated={currentEpoch.status === 'active'}
          />
          <Text fontSize="sm" mt={1}>
            {epochStats.completion_percentage.toFixed(1)}% Complete
          </Text>
        </Box>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={4}>
          <Stat>
            <StatLabel>Total Votes</StatLabel>
            <StatNumber>{epochStats.total_votes}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Unique Voters</StatLabel>
            <StatNumber>{epochStats.unique_voters}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Participating Artworks</StatLabel>
            <StatNumber>{epochStats.participating_artworks}</StatNumber>
          </Stat>
          <Stat>
            <StatLabel>Tokens Distributed</StatLabel>
            <StatNumber>{epochStats.total_tokens_distributed}</StatNumber>
          </Stat>
        </SimpleGrid>

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
          <Box p={4} borderWidth={1} borderRadius="md">
            <Heading size="sm" mb={4}>Vote Statistics</Heading>
            <StatGroup>
              <Stat>
                <StatLabel>Highest Vote</StatLabel>
                <StatNumber>{epochStats.highest_vote}</StatNumber>
              </Stat>
              <Stat>
                <StatLabel>Average Vote</StatLabel>
                <StatNumber>{epochStats.avg_vote_size.toFixed(1)}</StatNumber>
              </Stat>
              <Stat>
                <StatLabel>Lowest Vote</StatLabel>
                <StatNumber>{epochStats.lowest_vote}</StatNumber>
              </Stat>
            </StatGroup>
          </Box>

          <Box p={4} borderWidth={1} borderRadius="md">
            <Heading size="sm" mb={4}>Reward Statistics</Heading>
            <StatGroup>
              <Stat>
                <StatLabel>Highest Reward</StatLabel>
                <StatNumber>{epochStats.highest_reward}</StatNumber>
              </Stat>
              <Stat>
                <StatLabel>Average Reward</StatLabel>
                <StatNumber>{epochStats.avg_reward.toFixed(1)}</StatNumber>
              </Stat>
              <Stat>
                <StatLabel>Rewarded Artists</StatLabel>
                <StatNumber>{epochStats.rewarded_artists}</StatNumber>
              </Stat>
            </StatGroup>
          </Box>
        </SimpleGrid>

        <Box>
          <Text fontSize="sm" color="gray.500">
            Start: {new Date(currentEpoch.start_time).toLocaleString()}
          </Text>
          <Text fontSize="sm" color="gray.500">
            End: {new Date(currentEpoch.end_time).toLocaleString()}
          </Text>
        </Box>
      </VStack>
    </Box>
  );
} 