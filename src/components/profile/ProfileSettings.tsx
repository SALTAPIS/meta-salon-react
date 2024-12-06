import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  useToast,
  Text,
  Divider,
  useColorModeValue,
  Textarea,
  Switch,
  InputGroup,
  InputRightElement,
  IconButton,
} from '@chakra-ui/react';
import { useState } from 'react';
import { useAuth } from '../../hooks/auth/useAuth';
import { supabase } from '../../lib/supabase';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';

export function ProfileSettings() {
  const { user } = useAuth();
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || '',
    display_name: user?.display_name || '',
    bio: user?.bio || '',
    email_notifications: user?.email_notifications ?? true,
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const updateProfile = async () => {
    try {
      setIsLoading(true);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          username: formData.username,
          display_name: formData.display_name,
          bio: formData.bio,
          email_notifications: formData.email_notifications,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      toast({
        title: 'Profile updated',
        status: 'success',
        duration: 3000,
      });
    } catch (error) {
      toast({
        title: 'Error updating profile',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: 'Passwords do not match',
        status: 'error',
        duration: 3000,
      });
      return;
    }

    try {
      setIsLoading(true);
      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword,
      });

      if (error) throw error;

      toast({
        title: 'Password updated successfully',
        status: 'success',
        duration: 3000,
      });

      // Clear password fields
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    } catch (error) {
      toast({
        title: 'Error updating password',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.newPassword) {
      await changePassword();
    } else {
      await updateProfile();
    }
  };

  if (!user) return null;

  return (
    <Box
      as="form"
      onSubmit={handleSubmit}
      bg={bgColor}
      p={6}
      borderRadius="lg"
      borderWidth="1px"
      borderColor={borderColor}
    >
      <VStack spacing={6} align="stretch">
        <Text fontSize="xl" fontWeight="bold">Profile Settings</Text>
        
        <FormControl>
          <FormLabel>Username</FormLabel>
          <Input
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            placeholder="Enter username"
          />
        </FormControl>

        <FormControl>
          <FormLabel>Display Name</FormLabel>
          <Input
            name="display_name"
            value={formData.display_name}
            onChange={handleInputChange}
            placeholder="Enter display name"
          />
        </FormControl>

        <FormControl>
          <FormLabel>Bio</FormLabel>
          <Textarea
            name="bio"
            value={formData.bio}
            onChange={handleInputChange}
            placeholder="Tell us about yourself"
            resize="vertical"
          />
        </FormControl>

        <FormControl display="flex" alignItems="center">
          <FormLabel mb="0">
            Email Notifications
          </FormLabel>
          <Switch
            name="email_notifications"
            isChecked={formData.email_notifications}
            onChange={handleSwitchChange}
          />
        </FormControl>

        <Button
          colorScheme="blue"
          isLoading={isLoading}
          type="submit"
        >
          Save Profile
        </Button>

        <Divider />

        <Text fontSize="xl" fontWeight="bold">Change Password</Text>

        <FormControl>
          <FormLabel>New Password</FormLabel>
          <InputGroup>
            <Input
              name="newPassword"
              type={showPassword ? 'text' : 'password'}
              value={formData.newPassword}
              onChange={handleInputChange}
              placeholder="Enter new password"
            />
            <InputRightElement>
              <IconButton
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                variant="ghost"
                onClick={() => setShowPassword(!showPassword)}
              />
            </InputRightElement>
          </InputGroup>
        </FormControl>

        <FormControl>
          <FormLabel>Confirm New Password</FormLabel>
          <InputGroup>
            <Input
              name="confirmPassword"
              type={showPassword ? 'text' : 'password'}
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="Confirm new password"
            />
            <InputRightElement>
              <IconButton
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                variant="ghost"
                onClick={() => setShowPassword(!showPassword)}
              />
            </InputRightElement>
          </InputGroup>
        </FormControl>

        <Button
          colorScheme="blue"
          isLoading={isLoading}
          onClick={changePassword}
          isDisabled={!formData.newPassword || !formData.confirmPassword}
        >
          Update Password
        </Button>
      </VStack>
    </Box>
  );
} 