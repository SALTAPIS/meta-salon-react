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
  Badge,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  useToast,
  Spinner,
  Alert,
  AlertIcon,
  HStack,
  Tag,
  Select,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  FormControl,
  FormLabel,
  VStack,
} from '@chakra-ui/react';
import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import { FiMoreVertical, FiEdit2, FiDollarSign, FiClock } from 'react-icons/fi';

type UserRole = 'user' | 'artist' | 'moderator' | 'admin';

type User = {
  id: string;
  email: string | null;
  role: UserRole | null;
  created_at: string;
  balance: number;
  username: string | null;
  display_name: string | null;
  avatar_url: string | null;
  updated_at: string;
  email_verified: boolean;
  premium_until: string | null;
  artwork_count: number;
};

type ModalType = 'role' | 'balance' | 'premium';

interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  type: ModalType;
  onSubmit: (data: any) => Promise<void>;
}

const UserModal = ({ isOpen, onClose, user, type, onSubmit }: UserModalProps) => {
  const [role, setRole] = useState<UserRole | null>(user.role);
  const [balance, setBalance] = useState<number>(user.balance);
  const [premiumMonths, setPremiumMonths] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      switch (type) {
        case 'role':
          await onSubmit({ role });
          break;
        case 'balance':
          await onSubmit({ balance });
          break;
        case 'premium':
          await onSubmit({ months: premiumMonths });
          break;
      }
      onClose();
    } catch (error) {
      console.error('Error in modal submit:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>
          {type === 'role' && 'Change User Role'}
          {type === 'balance' && 'Adjust Balance'}
          {type === 'premium' && 'Manage Premium Status'}
        </ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={4}>
            <Text fontWeight="medium">{user.email}</Text>
            
            {type === 'role' && (
              <FormControl>
                <FormLabel>Role</FormLabel>
                <Select
                  value={role || ''}
                  onChange={(e) => setRole(e.target.value as UserRole)}
                >
                  <option value="user">User</option>
                  <option value="artist">Artist</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                </Select>
              </FormControl>
            )}

            {type === 'balance' && (
              <FormControl>
                <FormLabel>Balance (SLN)</FormLabel>
                <NumberInput
                  value={balance}
                  onChange={(_, value) => setBalance(value)}
                  min={0}
                  max={1000000}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
            )}

            {type === 'premium' && (
              <FormControl>
                <FormLabel>Premium Duration (Months)</FormLabel>
                <NumberInput
                  value={premiumMonths}
                  onChange={(_, value) => setPremiumMonths(value)}
                  min={1}
                  max={12}
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
              </FormControl>
            )}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSubmit}
            isLoading={isSubmitting}
          >
            Save Changes
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export function UserManagement() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [modalType, setModalType] = useState<ModalType>('role');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const fetchUsers = async () => {
    if (!user?.id) {
      setError('No user found');
      setLoading(false);
      return;
    }
    
    try {
      console.log('Fetching profiles using admin function...');
      
      const { data: profiles, error: queryError } = await supabase
        .rpc('get_all_profiles_admin');

      if (queryError) {
        console.error('Query error:', queryError);
        throw new Error('Failed to fetch user data: ' + queryError.message);
      }

      setUsers(profiles || []);
      setError(null);
    } catch (error) {
      console.error('Error in fetchUsers:', error);
      setError(error instanceof Error ? error.message : 'Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [user]);

  const handleUpdateRole = async (data: { role: UserRole }) => {
    if (!selectedUser) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: data.role })
        .eq('id', selectedUser.id);

      if (error) throw error;

      toast({
        title: 'Role updated',
        description: `User role changed to ${data.role}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      await fetchUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user role',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleUpdateBalance = async (data: { balance: number }) => {
    if (!selectedUser) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ balance: data.balance })
        .eq('id', selectedUser.id);

      if (error) throw error;

      // Record the transaction
      const { error: txError } = await supabase
        .from('transactions')
        .insert({
          user_id: selectedUser.id,
          type: 'admin_adjustment',
          amount: data.balance - selectedUser.balance,
          description: `Admin balance adjustment`,
        });

      if (txError) throw txError;

      toast({
        title: 'Balance updated',
        description: `User balance set to ${data.balance} SLN`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      await fetchUsers();
    } catch (error) {
      console.error('Error updating balance:', error);
      toast({
        title: 'Error',
        description: 'Failed to update user balance',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleUpdatePremium = async (data: { months: number }) => {
    if (!selectedUser) return;

    try {
      const premiumUntil = new Date();
      premiumUntil.setMonth(premiumUntil.getMonth() + data.months);

      const { error } = await supabase
        .from('profiles')
        .update({ premium_until: premiumUntil.toISOString() })
        .eq('id', selectedUser.id);

      if (error) throw error;

      toast({
        title: 'Premium status updated',
        description: `Premium status extended by ${data.months} months`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      await fetchUsers();
    } catch (error) {
      console.error('Error updating premium status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update premium status',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleAction = (user: User, type: ModalType) => {
    setSelectedUser(user);
    setModalType(type);
    onOpen();
  };

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
            <Th isNumeric>Artworks</Th>
            <Th>Joined</Th>
            <Th width="50px"></Th>
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
                  cursor="pointer"
                  onClick={() => handleAction(user, 'role')}
                >
                  {user.role || 'user'}
                </Badge>
              </Td>
              <Td isNumeric>
                <Text
                  cursor="pointer"
                  onClick={() => handleAction(user, 'balance')}
                >
                  {user.balance.toLocaleString()} SLN
                </Text>
              </Td>
              <Td>
                <HStack spacing={2}>
                  <Text>
                    {user.premium_until
                      ? new Date(user.premium_until) > new Date()
                        ? new Date(user.premium_until).toLocaleDateString()
                        : 'Expired'
                      : 'No premium'}
                  </Text>
                  <IconButton
                    aria-label="Extend premium"
                    icon={<FiClock />}
                    size="sm"
                    variant="ghost"
                    onClick={() => handleAction(user, 'premium')}
                  />
                </HStack>
              </Td>
              <Td isNumeric>
                <Text>{user.artwork_count}</Text>
              </Td>
              <Td>
                <Text color="gray.600" fontSize="sm">
                  {new Date(user.created_at).toLocaleDateString()}
                </Text>
              </Td>
              <Td>
                <Menu>
                  <MenuButton
                    as={IconButton}
                    icon={<FiMoreVertical />}
                    variant="ghost"
                    size="sm"
                  />
                  <MenuList>
                    <MenuItem
                      icon={<FiEdit2 />}
                      onClick={() => handleAction(user, 'role')}
                    >
                      Change Role
                    </MenuItem>
                    <MenuItem
                      icon={<FiDollarSign />}
                      onClick={() => handleAction(user, 'balance')}
                    >
                      Adjust Balance
                    </MenuItem>
                  </MenuList>
                </Menu>
              </Td>
            </Tr>
          ))}
          {users.length === 0 && (
            <Tr>
              <Td colSpan={7} textAlign="center">
                <Text color="gray.500">No users found</Text>
              </Td>
            </Tr>
          )}
        </Tbody>
      </Table>

      {selectedUser && (
        <UserModal
          isOpen={isOpen}
          onClose={() => {
            onClose();
            setSelectedUser(null);
          }}
          user={selectedUser}
          type={modalType}
          onSubmit={
            modalType === 'role'
              ? handleUpdateRole
              : modalType === 'balance'
              ? handleUpdateBalance
              : handleUpdatePremium
          }
        />
      )}
    </Box>
  );
} 