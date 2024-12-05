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
  InputGroup,
  InputRightElement,
  IconButton,
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { useAuth } from '../../hooks/auth/useAuth';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const toast = useToast();
  const { signUpWithPassword } = useAuth();

  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.400');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    if (!email || !password) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters long',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('Attempting to sign up with email:', email);
      const { error, data } = await signUpWithPassword(email, password);

      if (error) {
        console.error('Signup error response:', error);
        throw error;
      }

      if (data?.session) {
        console.log('Signup successful with session');
        toast({
          title: 'Welcome!',
          description: 'Your account has been created successfully',
          status: 'success',
          duration: 10000,
          isClosable: true,
        });
        // Navigation will be handled by AuthProvider
      } else {
        console.log('Signup successful, email confirmation required');
        toast({
          title: 'Check your email',
          description: 'Please check your email to confirm your account. The confirmation link will expire in 24 hours.',
          status: 'info',
          duration: 20000,
          isClosable: true,
          position: 'bottom',
          variant: 'solid',
        });
        // Add a delay before redirecting
        setTimeout(() => {
          window.location.href = '/auth/signin';
        }, 3000);
      }
    } catch (error) {
      console.error('Sign up error:', error);
      let errorMessage = 'Failed to create account';
      
      if (error instanceof Error) {
        if (error.message.includes('already registered')) {
          errorMessage = 'This email is already registered. Please sign in instead.';
        } else {
          errorMessage = error.message;
        }
      }

      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 10000,
        isClosable: true,
        position: 'bottom',
        variant: 'solid',
      });
      setIsSubmitting(false);
    }
  };

  return (
    <Container maxW="md" py={16}>
      <Box p={8} borderWidth="1px" borderRadius="lg" bg={bg} borderColor={borderColor}>
        <VStack spacing={6}>
          <VStack spacing={2} align="center" w="full">
            <Heading size="lg" color={textColor}>Create Account</Heading>
            <Text color={secondaryTextColor}>Join Meta.Salon to participate in the art community</Text>
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
                  isDisabled={isSubmitting}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel color={textColor}>Password</FormLabel>
                <InputGroup>
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    isDisabled={isSubmitting}
                  />
                  <InputRightElement>
                    <IconButton
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                      variant="ghost"
                      onClick={() => setShowPassword(!showPassword)}
                      isDisabled={isSubmitting}
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              <Button
                type="submit"
                colorScheme="blue"
                size="lg"
                width="full"
                isLoading={isSubmitting}
                loadingText="Creating Account..."
              >
                Create Account
              </Button>
            </VStack>
          </form>

          <Text color={secondaryTextColor}>
            Already have an account?{' '}
            <Link as={RouterLink} to="/auth/signin" color="blue.500">
              Sign in
            </Link>
          </Text>
        </VStack>
      </Box>
    </Container>
  );
} 