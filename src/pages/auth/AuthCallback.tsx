import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Center, Spinner, VStack, Text, useToast } from '@chakra-ui/react';
import { supabase } from '../../lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('[AuthCallback] Starting auth callback handling');
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('[AuthCallback] Session error:', error);
          throw error;
        }

        if (session?.user) {
          console.log('[AuthCallback] Session found:', {
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
            title: 'Authentication successful!',
            description: 'You have been signed in.',
            status: 'success',
            duration: 5000,
            isClosable: true,
          });

          // Redirect to dashboard
          navigate('/dashboard', { replace: true });
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