import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Center, Spinner, VStack, Text, useToast } from '@chakra-ui/react';
import { supabase } from '../../lib/supabaseClient';

export default function AuthCallback() {
  const navigate = useNavigate();
  const toast = useToast();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('[AuthCallback] Starting auth callback handling');
        
        // Get the error and error_description from URL if present
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');

        if (error) {
          throw new Error(errorDescription || error);
        }

        // Get the access_token and refresh_token from URL
        const accessToken = searchParams.get('access_token');
        const refreshToken = searchParams.get('refresh_token');

        if (!accessToken) {
          console.error('[AuthCallback] No access token found');
          throw new Error('No access token found');
        }

        // Exchange the tokens for a session
        const { data: { session }, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken || '',
        });

        if (sessionError) {
          console.error('[AuthCallback] Session error:', sessionError);
          throw sessionError;
        }

        if (session?.user) {
          console.log('[AuthCallback] Session established:', {
            userId: session.user.id,
            email: session.user.email,
          });

          // Update profile with email_verified status
          const { error: updateError } = await supabase
            .from('profiles')
            .update({
              email_verified: true,
              updated_at: new Date().toISOString(),
            })
            .eq('id', session.user.id);

          if (updateError) {
            console.error('[AuthCallback] Profile update error:', updateError);
          } else {
            console.log('[AuthCallback] Profile updated successfully');
          }

          toast({
            title: 'Email confirmed!',
            description: 'Your email has been confirmed and you are now signed in.',
            status: 'success',
            duration: 5000,
            isClosable: true,
          });

          // Redirect to dashboard
          navigate(`/${session.user.user_metadata.username || ''}/dashboard`, { replace: true });
        } else {
          console.error('[AuthCallback] No session found');
          throw new Error('No session found');
        }
      } catch (error) {
        console.error('[AuthCallback] Error:', error);
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
        <Text>Completing authentication...</Text>
      </VStack>
    </Center>
  );
} 