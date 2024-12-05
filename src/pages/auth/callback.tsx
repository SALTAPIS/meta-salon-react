import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Spinner, VStack, Text, useToast } from '@chakra-ui/react';
import { supabase } from '../../lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Clear any existing session first
        await supabase.auth.signOut();

        // Get URL parameters
        const params = new URLSearchParams(window.location.search);
        const type = params.get('type');
        const email = params.get('email');
        
        console.log('Auth callback type:', type);
        console.log('Email from params:', email);

        // Handle email confirmation
        if (type === 'email_confirmation' || type === 'signup' || type === 'recovery') {
          // Get the token from the URL
          const token = params.get('token') || params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (!token) {
            throw new Error('No authentication token found');
          }

          // Set the session with the provided tokens
          const { data: { session }, error: sessionError } = await supabase.auth.setSession({
            access_token: token,
            refresh_token: refreshToken || ''
          });

          if (sessionError) {
            console.error('Session error:', sessionError);
            throw sessionError;
          }

          if (!session) {
            throw new Error('No session established after confirmation');
          }

          // Verify the session is for the correct user
          if (email && session.user.email !== email) {
            console.error('Session user mismatch:', {
              expected: email,
              got: session.user.email
            });
            await supabase.auth.signOut();
            throw new Error('Session user mismatch');
          }

          toast({
            title: 'Email Verified',
            description: 'Your email has been verified. Welcome to Meta.Salon!',
            status: 'success',
            duration: 5000,
            isClosable: true,
          });

          navigate('/dashboard', { replace: true });
          return;
        }

        // Handle other auth types (OAuth, etc.)
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          throw error;
        }

        if (!session) {
          navigate('/auth/signin', { replace: true });
          return;
        }

        navigate('/dashboard', { replace: true });
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
    <Container centerContent py={10}>
      <VStack spacing={4}>
        <Spinner size="xl" />
        <Text>Completing authentication...</Text>
      </VStack>
    </Container>
  );
} 