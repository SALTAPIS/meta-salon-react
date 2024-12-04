import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Spinner, VStack, Text } from '@chakra-ui/react';
import { supabase } from '../../lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Get the URL hash
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (accessToken && refreshToken) {
          // Set the session manually if tokens are in URL
          const { data: { session }, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          });

          if (error) throw error;
          if (session) {
            console.log('Session set successfully, redirecting to dashboard');
            navigate('/dashboard', { replace: true });
            return;
          }
        }

        // Fallback to getting current session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error during auth callback:', error);
          navigate('/auth/signin', { replace: true });
          return;
        }

        if (!session) {
          console.log('No session found in callback');
          navigate('/auth/signin', { replace: true });
          return;
        }

        console.log('Session found, redirecting to dashboard');
        navigate('/dashboard', { replace: true });
      } catch (error) {
        console.error('Unexpected error in auth callback:', error);
        navigate('/auth/signin', { replace: true });
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