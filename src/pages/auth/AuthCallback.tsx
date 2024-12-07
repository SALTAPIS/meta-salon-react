import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Center, Spinner, VStack, Text } from '@chakra-ui/react';
import { supabase } from '../../lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN') {
        navigate('/dashboard');
      } else if (event === 'SIGNED_OUT') {
        navigate('/auth/signin');
      }
    });
  }, [navigate]);

  return (
    <Center h="100vh">
      <VStack spacing={4}>
        <Spinner size="xl" />
        <Text>Verifying your account...</Text>
      </VStack>
    </Center>
  );
} 