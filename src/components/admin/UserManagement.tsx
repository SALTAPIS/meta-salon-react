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
  HStack,
  Tag,
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
  premium_until: string | null;
  updated_at: string;
};

export function UserManagement() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUsers() {
      if (!user?.id) {
        setError('No user found');
        setLoading(false);
        return;
      }
      
      try {
        console.log('Fetching profiles using admin function...');
        
        // Use the get_all_profiles_admin function
        const { data: profiles, error: queryError } = await supabase
          .rpc('get_all_profiles_admin');

        if (queryError) {
          console.error('Query error:', queryError);
          throw new Error('Failed to fetch user data: ' + queryError.message);
        }

        console.log('Query response:', {
          profilesLength: profiles?.length || 0,
          firstProfile: profiles?.[0],
          hasMultiple: profiles && profiles.length > 1
        });

        setUsers(profiles || []);
        setError(null);
      } catch (error) {
        console.error('Error in fetchUsers:', error);
        setError(error instanceof Error ? error.message : 'Failed to load users');
        setUsers([]);
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
      <HStack mb={4} justify="space-between">
        <Text color="gray.600">
          Total Users: <Tag colorScheme="blue">{users.length}</Tag>
        </Text>
        <HStack spacing={4}>
          <Text color="gray.600">
            Admins: <Tag colorScheme="red">
              {users.filter(u => u.role === 'admin').length}
            </Tag>
          </Text>
          <Text color="gray.600">
            Premium: <Tag colorScheme="purple">
              {users.filter(u => u.premium_until && new Date(u.premium_until) > new Date()).length}
            </Tag>
          </Text>
        </HStack>
      </HStack>

      <Table variant="simple" size="sm" bg="white" shadow="sm" rounded="lg">
        <Thead bg="gray.50">
          <Tr>
            <Th>Email</Th>
            <Th>Role</Th>
            <Th isNumeric>Balance</Th>
            <Th>Premium Until</Th>
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
                <Badge 
                  colorScheme={user.role === 'admin' ? 'red' : 'blue'}
                  px={2}
                  py={1}
                  rounded="md"
                >
                  {user.role || 'user'}
                </Badge>
              </Td>
              <Td isNumeric>
                <Text color={user.balance > 0 ? 'green.600' : 'gray.600'} fontWeight="medium">
                  {user.balance?.toLocaleString() || '0'} SLN
                </Text>
              </Td>
              <Td>
                {user.premium_until ? (
                  <Badge 
                    colorScheme={new Date(user.premium_until) > new Date() ? 'purple' : 'gray'}
                    variant="subtle"
                  >
                    {new Date(user.premium_until).toLocaleDateString()}
                  </Badge>
                ) : (
                  <Text color="gray.500">—</Text>
                )}
              </Td>
              <Td>
                <Text color="gray.600">
                  {new Date(user.created_at).toLocaleDateString()}
                </Text>
              </Td>
            </Tr>
          ))}
          {users.length === 0 && (
            <Tr>
              <Td colSpan={5} textAlign="center">
                <Text color="gray.500">No users found</Text>
              </Td>
            </Tr>
          )}
        </Tbody>
      </Table>
    </Box>
  );
} 