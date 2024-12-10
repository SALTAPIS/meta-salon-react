import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Box,
  VStack,
  Heading,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Text,
  Spinner,
  Alert,
  AlertIcon,
  useColorModeValue,
} from '@chakra-ui/react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import type { Transaction } from '../../types/database.types';

export function UserTransactionsPage() {
  const { username } = useParams<{ username: string }>();
  const { user: currentUser } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  useEffect(() => {
    loadTransactions();
  }, [username]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      setError(null);

      // First get the user ID from username
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .single();

      if (profileError) throw profileError;
      if (!profiles) throw new Error('Profile not found');

      // Check if current user is viewing their own transactions
      if (currentUser?.id !== profiles.id) {
        throw new Error('You can only view your own transactions');
      }

      // Load transactions
      const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', profiles.id)
        .order('created_at', { ascending: false });

      if (txError) throw txError;
      setTransactions(transactions || []);
    } catch (error) {
      console.error('Error loading transactions:', error);
      setError(error instanceof Error ? error.message : 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'grant':
        return 'green';
      case 'submission':
        return 'blue';
      case 'vote_pack':
        return 'purple';
      case 'reward':
        return 'yellow';
      case 'premium':
        return 'pink';
      case 'refund':
        return 'orange';
      default:
        return 'gray';
    }
  };

  if (loading) {
    return (
      <Container maxW="container.xl" py={8}>
        <Box textAlign="center" py={8}>
          <Spinner size="xl" />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box p={6} bg={bgColor} borderRadius="lg" borderWidth={1} borderColor={borderColor}>
          <VStack spacing={6} align="stretch">
            <Heading size="lg">Transaction History</Heading>

            <Table variant="simple">
              <Thead>
                <Tr>
                  <Th>Date</Th>
                  <Th>Type</Th>
                  <Th>Description</Th>
                  <Th isNumeric>Amount</Th>
                  <Th>Status</Th>
                </Tr>
              </Thead>
              <Tbody>
                {transactions.map((tx) => (
                  <Tr key={tx.id}>
                    <Td>
                      <Text>{new Date(tx.created_at).toLocaleDateString()}</Text>
                      <Text fontSize="sm" color="gray.500">
                        {new Date(tx.created_at).toLocaleTimeString()}
                      </Text>
                    </Td>
                    <Td>
                      <Badge colorScheme={getTransactionColor(tx.type)}>
                        {tx.type.replace('_', ' ')}
                      </Badge>
                    </Td>
                    <Td>
                      <Text>{tx.description || '-'}</Text>
                    </Td>
                    <Td isNumeric>
                      <Text
                        color={tx.amount > 0 ? 'green.500' : 'red.500'}
                        fontWeight="medium"
                      >
                        {tx.amount > 0 ? '+' : ''}{tx.amount} SLN
                      </Text>
                    </Td>
                    <Td>
                      <Badge
                        colorScheme={
                          tx.status === 'completed'
                            ? 'green'
                            : tx.status === 'pending'
                            ? 'yellow'
                            : 'red'
                        }
                      >
                        {tx.status}
                      </Badge>
                    </Td>
                  </Tr>
                ))}
                {transactions.length === 0 && (
                  <Tr>
                    <Td colSpan={5} textAlign="center">
                      <Text color="gray.500">No transactions found</Text>
                    </Td>
                  </Tr>
                )}
              </Tbody>
            </Table>
          </VStack>
        </Box>
      </VStack>
    </Container>
  );
} 