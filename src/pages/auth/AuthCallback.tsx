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

        // Log all URL parameters for debugging
        console.log('[AuthCallback] URL parameters:', 
          Object.fromEntries(searchParams.entries()));

        // Check if we're in PKCE flow (has code parameter)
        const code = searchParams.get('code');
        if (code) {
          console.log('[AuthCallback] Detected PKCE flow with code');
          // The session should already be established by Supabase client
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) throw sessionError;
          if (!session) throw new Error('No session established after PKCE flow');
          
          console.log('[AuthCallback] PKCE flow successful, session established');
          await handleSuccessfulAuth(session);
          return;
        }

        // If not PKCE, try OTP flow
        const tokenHash = searchParams.get('token_hash') || searchParams.get('token');
        const type = searchParams.get('type');

        if (!tokenHash) {
          console.error('[AuthCallback] No authentication parameters found');
          throw new Error('Invalid authentication callback URL');
        }

        console.log('[AuthCallback] Processing OTP flow:', { type, hasToken: !!tokenHash });

        // Exchange the token for a session
        const result = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: type === 'recovery' ? 'recovery' : 'email'
        });

        if (result.error) {
          console.error('[AuthCallback] Token verification error:', result.error);
          throw result.error;
        }

        if (!result.data.session) {
          throw new Error('No session established after OTP verification');
        }

        await handleSuccessfulAuth(result.data.session);
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

    const handleSuccessfulAuth = async (session: any) => {
      try {
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
        const username = session.user.user_metadata?.username || session.user.email?.split('@')[0];
        if (!username) {
          console.error('[AuthCallback] No username found in session:', session);
          throw new Error('No username found in session');
        }
        navigate(`/${username}/dashboard`, { replace: true });
      } catch (error) {
        console.error('[AuthCallback] Error in handleSuccessfulAuth:', error);
        throw error;
      }
    };

    handleAuthCallback();
  }, [navigate, toast, searchParams]);

  return (
    <Center h="100vh">
      <VStack spacing={4}>
        <Spinner size="xl" />
        <Text>Completing authentication...</Text>
      </VStack>
    </Center>
  );
} 