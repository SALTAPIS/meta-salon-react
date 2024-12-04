import { useState } from 'react';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  Text,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { useAuth } from '../auth/AuthProvider';
import type { User } from '../../types/user';

export function UserProfile() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const toast = useToast();
  const [formData, setFormData] = useState({
    wallet: user?.wallet || '',
  });

  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);

    try {
      // TODO: Implement save functionality
      toast({
        title: 'Profile updated',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setIsEditing(false);
    } catch (error) {
      toast({
        title: 'Error updating profile',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading size="lg" mb={6}>Profile</Heading>
          
          <Stack spacing={6}>
            <FormControl>
              <FormLabel>Email</FormLabel>
              <Text>{user.email}</Text>
            </FormControl>

            <FormControl>
              <FormLabel>Wallet Address</FormLabel>
              {isEditing ? (
                <Input
                  value={formData.wallet}
                  onChange={(e) => setFormData({ ...formData, wallet: e.target.value })}
                  placeholder="Enter your wallet address"
                />
              ) : (
                <Text>{user.wallet || 'Not set'}</Text>
              )}
            </FormControl>

            <FormControl>
              <FormLabel>Role</FormLabel>
              <Text textTransform="capitalize">{user.role || 'User'}</Text>
            </FormControl>

            {user.balance !== undefined && (
              <FormControl>
                <FormLabel>Balance</FormLabel>
                <Text>{user.balance} SLN</Text>
              </FormControl>
            )}

            {user.premiumUntil && (
              <FormControl>
                <FormLabel>Premium Status</FormLabel>
                <Text>
                  Premium until {new Date(user.premiumUntil).toLocaleDateString()}
                </Text>
              </FormControl>
            )}

            <Box>
              {isEditing ? (
                <Stack direction="row" spacing={4}>
                  <Button
                    colorScheme="blue"
                    onClick={handleSave}
                    isLoading={isSaving}
                  >
                    Save Changes
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </Button>
                </Stack>
              ) : (
                <Button
                  colorScheme="blue"
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile
                </Button>
              )}
            </Box>
          </Stack>
        </Box>
      </VStack>
    </Container>
  );
} 