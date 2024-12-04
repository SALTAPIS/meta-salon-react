import React, { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Box,
  VStack,
  Heading,
  Text,
  Input,
  Button,
  FormControl,
  FormLabel,
  useColorModeValue,
  Link,
  useToast,
} from '@chakra-ui/react';
import { useAuth } from '../../components/auth/AuthProvider';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signInWithMagicLink } = useAuth();
  const toast = useToast();

  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.700', 'gray.200');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.400');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    try {
      await signInWithMagicLink(email);
      toast({
        title: 'Magic link sent!',
        description: 'Check your email for the sign in link.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (err) {
      console.error('Sign in error:', err);
      toast({
        title: 'Error',
        description: 'Failed to send magic link. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxW="md" py={16}>
      <Box p={8} borderWidth="1px" borderRadius="lg" bg={bg} borderColor={borderColor}>
        <VStack spacing={6}>
          <VStack spacing={2} align="center" w="full">
            <Heading size="lg" color={textColor}>Welcome Back</Heading>
            <Text color={secondaryTextColor}>Sign in to your account</Text>
          </VStack>

          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel color={textColor}>Email address</FormLabel>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                />
              </FormControl>

              <Button
                type="submit"
                colorScheme="blue"
                size="lg"
                width="full"
                isLoading={isLoading}
              >
                Send Magic Link
              </Button>
            </VStack>
          </form>

          <Text color={secondaryTextColor}>
            Don't have an account?{' '}
            <Link as={RouterLink} to="/auth/signup" color="blue.500">
              Sign up
            </Link>
          </Text>
        </VStack>
      </Box>
    </Container>
  );
} 