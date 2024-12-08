import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Center, Spinner, VStack, Text, useToast } from '@chakra-ui/react';
import { AuthService } from '../../services/auth/authService';

export default function AuthCallback() {
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const authService = AuthService.getInstance();
        const { data, error } = await authService.handleEmailConfirmation();
        
        if (error) throw error;

        if (data?.user) {
          toast({
            title: 'Email confirmed!',
            description: 'Your email has been confirmed. You can now sign in.',
            status: 'success',
            duration: 5000,
            isClosable: true,
          });

          // Redirect to dashboard if user is confirmed
          navigate('/dashboard', { replace: true });
        } else {
          // If no user, something went wrong
          throw new Error('Failed to confirm email');
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        toast({
          title: 'Authentication Error',
          description: error instanceof Error ? error.message : 'Failed to complete authentication',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        navigate('/auth/signin', { replace: true });
      }
    };

    handleAuthCallback();
  }, [navigate, toast]);

  return (
    <Center h="100vh">
      <VStack spacing={4}>
        <Spinner size="xl" />
        <Text>Verifying your account...</Text>
      </VStack>
    </Center>
  );
} 