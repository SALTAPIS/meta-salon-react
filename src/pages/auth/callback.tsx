import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Spinner, VStack, Text } from '@chakra-ui/react';
import { supabase } from '../../lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Log full URL for debugging
        console.log('Callback URL:', window.location.href);
        
        // Check for email confirmation success
        const params = new URLSearchParams(window.location.search);
        console.log('URL Search params:', Object.fromEntries(params.entries()));
        
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');
        const type = params.get('type');
        
        console.log('Auth type:', type);
        console.log('Has access token:', !!accessToken);
        console.log('Has refresh token:', !!refreshToken);

        // Handle email confirmation
        if (type === 'email_confirmation' || type === 'signup' || type === 'recovery') {
          console.log('Handling email confirmation/signup/recovery');
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Error getting session:', error);
            throw error;
          }
          
          if (session) {
            console.log('Session found after confirmation:', session);
            navigate('/dashboard', { replace: true });
            return;
          } else {
            console.log('No session found after confirmation');
          }
        }

        // Handle OAuth or other callbacks
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        console.log('Hash params:', Object.fromEntries(hashParams.entries()));
        
        const hashAccessToken = hashParams.get('access_token');
        const hashRefreshToken = hashParams.get('refresh_token');

        if ((accessToken && refreshToken) || (hashAccessToken && hashRefreshToken)) {
          console.log('Setting session with tokens');
          const tokens = {
            access_token: accessToken || hashAccessToken!,
            refresh_token: refreshToken || hashRefreshToken!
          };

          const { data: { session }, error } = await supabase.auth.setSession(tokens);
          if (error) {
            console.error('Error setting session:', error);
            throw error;
          }

          if (session) {
            console.log('Session set successfully:', session);
            navigate('/dashboard', { replace: true });
            return;
          }
        }

        // Fallback to getting current session
        console.log('Falling back to current session check');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting fallback session:', error);
          navigate('/auth/signin', { replace: true });
          return;
        }

        if (!session) {
          console.log('No fallback session found');
          navigate('/auth/signin', { replace: true });
          return;
        }

        console.log('Fallback session found:', session);
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