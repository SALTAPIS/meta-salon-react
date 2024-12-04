import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Spinner, VStack, Text } from '@chakra-ui/react';
import { supabase } from '../../lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error during auth callback:', error);
          navigate('/auth/signin');
          return;
        }

        if (!session) {
          console.log('No session found in callback');
          navigate('/auth/signin');
          return;
        }

        console.log('Session found, redirecting to dashboard');
        navigate('/dashboard');
      } catch (error) {
        console.error('Unexpected error in auth callback:', error);
        navigate('/auth/signin');
      }
    };

    handleAuthCallback();
  }, [navigate]);

  return (
    <Container maxW="md" py={16}>
      <VStack spacing={4}>
        <Spinner size="xl" />
        <Text>Completing sign in...</Text>
      </VStack>
    </Container>
  );
} 