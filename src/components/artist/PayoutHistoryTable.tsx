import { useEffect, useState } from 'react';
import {
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Box,
  Text,
  Spinner,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { ArtistService, type ArtistPayout } from '../../services/ArtistService';

export function PayoutHistoryTable() {
  const [payouts, setPayouts] = useState<ArtistPayout[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPayoutHistory();
  }, []);

  const loadPayoutHistory = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const history = await ArtistService.getPayoutHistory();
      setPayouts(history);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payout history');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'completed':
        return 'green';
      case 'processing':
        return 'blue';
      case 'pending':
        return 'yellow';
      case 'failed':
        return 'red';
      default:
        return 'gray';
    }
  };

  if (isLoading) {
    return (
      <Box textAlign="center" py={8}>
        <Spinner size="xl" />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert status="error">
        <AlertIcon />
        {error}
      </Alert>
    );
  }

  if (payouts.length === 0) {
    return (
      <Alert status="info">
        <AlertIcon />
        No payout history available
      </Alert>
    );
  }

  return (
    <Box overflowX="auto">
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Date</Th>
            <Th>Amount</Th>
            <Th>Status</Th>
            <Th>Processed</Th>
            <Th>Transaction ID</Th>
          </Tr>
        </Thead>
        <Tbody>
          {payouts.map(payout => (
            <Tr key={payout.id}>
              <Td>
                {new Date(payout.created_at).toLocaleDateString()}
              </Td>
              <Td>
                <Text fontWeight="bold">
                  {payout.amount.toFixed(2)} SLN
                </Text>
                <Text fontSize="sm" color="gray.600">
                  ≈ ${(payout.amount * 0.01).toFixed(2)} USD
                </Text>
              </Td>
              <Td>
                <Badge colorScheme={getStatusColor(payout.status)}>
                  {payout.status}
                </Badge>
              </Td>
              <Td>
                {payout.processed_at
                  ? new Date(payout.processed_at).toLocaleDateString()
                  : '-'}
              </Td>
              <Td>
                <Text fontSize="sm" fontFamily="mono">
                  {payout.transaction_id
                    ? payout.transaction_id.slice(0, 8) + '...'
                    : '-'}
                </Text>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
} 