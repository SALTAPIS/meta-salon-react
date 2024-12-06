import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Text,
  Badge,
  Spinner,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/auth/useAuth';

type User = {
  id: string;
  email: string | null;
  role: string | null;
  created_at: string;
  balance: number;
};

export function UserManagement() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      if (!user?.id) return;
      
      try {
        // First check if current user is admin
        const { data: currentProfile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        if (profileError) throw profileError;

        if (currentProfile?.role !== 'admin') {
          throw new Error('Access denied. Admin privileges required.');
        }

        // Fetch all profiles
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select(`
            id,
            email,
            role,
            balance,
            created_at
          `)
          .order('created_at', { ascending: false });

        if (profilesError) throw profilesError;
        setUsers(profiles || []);
        setError(null);
      } catch (error) {
        console.error('Error fetching users:', error);
        setError(error instanceof Error ? error.message : 'Failed to load users');
      } finally {
        setLoading(false);
      }
    }

    fetchUsers();
  }, [user]);

  if (loading) {
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

  return (
    <Box overflowX="auto">
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Email</Th>
            <Th>Role</Th>
            <Th>Balance</Th>
            <Th>Joined</Th>
          </Tr>
        </Thead>
        <Tbody>
          {users.map((user) => (
            <Tr key={user.id}>
              <Td>
                <Text fontWeight="medium">{user.email || 'No email'}</Text>
              </Td>
              <Td>
                <Badge colorScheme={user.role === 'admin' ? 'red' : 'blue'}>
                  {user.role || 'user'}
                </Badge>
              </Td>
              <Td>{user.balance.toLocaleString()} SLN</Td>
              <Td>{new Date(user.created_at).toLocaleDateString()}</Td>
            </Tr>
          ))}
          {users.length === 0 && (
            <Tr>
              <Td colSpan={4} textAlign="center">
                <Text color="gray.500">No users found</Text>
              </Td>
            </Tr>
          )}
        </Tbody>
      </Table>
    </Box>
  );
} 