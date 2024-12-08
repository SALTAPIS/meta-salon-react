import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@chakra-ui/react';
import { supabase } from '../../lib/supabaseClient';

export default function AuthCallback() {
  const navigate = useNavigate();
  const toast = useToast();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const type = params.get('type');
        const email = params.get('email');

        // Handle different auth callback types
        if (type === 'email_confirmation' || type === 'signup' || type === 'recovery') {
          toast({
            title: 'Email confirmed',
            description: `Welcome${email ? ` ${email}` : ''}! You can now sign in.`,
            status: 'success',
            duration: 5000,
          });
          navigate('/login');
        } else if (type === 'magiclink') {
          // Handle magic link
          const { data: { user }, error } = await supabase.auth.getUser();
          
          if (error) {
            console.error('Auth error:', error);
            toast({
              title: 'Authentication error',
              description: error.message,
              status: 'error',
              duration: 5000,
            });
            navigate('/login');
            return;
          }

          if (user) {
            toast({
              title: 'Successfully signed in',
              description: `Welcome back${email ? ` ${email}` : ''}!`,
              status: 'success',
              duration: 5000,
            });
            navigate('/dashboard');
          } else {
            toast({
              title: 'Sign in failed',
              description: 'Please try again',
              status: 'error',
              duration: 5000,
            });
            navigate('/login');
          }
        } else {
          // Unknown callback type
          console.error('Unknown callback type:', type);
          toast({
            title: 'Unknown callback type',
            description: 'Please try signing in again',
            status: 'error',
            duration: 5000,
          });
          navigate('/login');
        }
      } catch (error) {
        console.error('Callback error:', error);
        toast({
          title: 'Error processing callback',
          description: error instanceof Error ? error.message : 'Please try again',
          status: 'error',
          duration: 5000,
        });
        navigate('/login');
      }
    };

    handleCallback();
  }, [navigate, toast]);

  return null;
} 