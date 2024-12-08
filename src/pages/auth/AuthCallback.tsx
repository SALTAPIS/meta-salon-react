import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Center, Spinner, VStack, Text, useToast } from '@chakra-ui/react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/auth/useAuth';

export default function AuthCallback() {
  const navigate = useNavigate();
  const toast = useToast();
  const { refreshUser } = useAuth();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;

        if (session?.user) {
          await refreshUser();
          
          toast({
            title: 'Welcome back!',
            description: 'You have been successfully signed in.',
            status: 'success',
            duration: 5000,
            isClosable: true,
          });

          navigate('/dashboard', { replace: true });
        } else {
          navigate('/auth/signin', { replace: true });
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
  }, [navigate, toast, refreshUser]);

  return (
    <Center h="100vh">
      <VStack spacing={4}>
        <Spinner size="xl" />
        <Text>Verifying your account...</Text>
      </VStack>
    </Center>
  );
} 