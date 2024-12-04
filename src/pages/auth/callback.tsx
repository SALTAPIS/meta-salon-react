import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Spinner, VStack, Text } from '@chakra-ui/react';
import { supabase } from '../../lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check for email confirmation success
        const params = new URLSearchParams(window.location.search);
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const type = params.get('type');

        // Handle email confirmation
        if (type === 'email_confirmation' || type === 'signup') {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) throw error;
          
          if (session) {
            console.log('Auto-signed in after email confirmation');
            navigate('/dashboard', { replace: true });
            return;
          }
        }

        // Handle OAuth or other callbacks
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const hashAccessToken = hashParams.get('access_token');
        const hashRefreshToken = hashParams.get('refresh_token');

        if ((accessToken && refreshToken) || (hashAccessToken && hashRefreshToken)) {
          const tokens = {
            access_token: accessToken || hashAccessToken!,
            refresh_token: refreshToken || hashRefreshToken!
          };

          const { data: { session }, error } = await supabase.auth.setSession(tokens);
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