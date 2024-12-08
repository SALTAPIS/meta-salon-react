import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Text,
  useToast,
  Container,
  Heading,
  FormErrorMessage,
  useColorModeValue,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { useAuth } from '../../hooks/useAuth';
import { AuthService } from '../../services/auth/authService';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const { signUpWithPassword } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const authService = AuthService.getInstance();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const handleResendEmail = async () => {
    console.log('Attempting to resend email to:', email);
    setResendLoading(true);
    try {
      const { error } = await authService.resendConfirmationEmail(email);
      if (error) {
        console.error('Resend email error:', error);
        toast({
          title: 'Error',
          description: error.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }
      console.log('Confirmation email resent successfully');
      toast({
        title: 'Email sent',
        description: 'A new confirmation email has been sent. Please check your inbox and spam folder.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error resending email:', error);
      toast({
        title: 'Error',
        description: 'Failed to resend confirmation email',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setResendLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      console.log('Starting signup process for:', email);
      const { error, data } = await signUpWithPassword(email, password);

      if (error) {
        console.error('Signup error:', error);
        setError(error.message);
        toast({
          title: 'Error',
          description: error.message,
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        return;
      }

      console.log('Signup response:', data);
      
      // Show success message even if user is null (email confirmation required)
      setIsSuccess(true);
      setPassword('');
      
      toast({
        title: 'Account Created',
        description: 'Please check your email to confirm your account. The confirmation link will expire in 24 hours.',
        status: 'success',
        duration: 10000,
        isClosable: true,
        position: 'top',
      });
    } catch (error) {
      console.error('Signup process error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An error occurred during sign up';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <Container maxW="lg" py={{ base: '12', md: '24' }} px={{ base: '0', sm: '8' }}>
        <Box
          py={{ base: '8', sm: '12' }}
          px={{ base: '4', sm: '10' }}
          bg={bgColor}
          boxShadow={{ base: 'none', sm: 'md' }}
          borderRadius={{ base: 'none', sm: 'xl' }}
          borderWidth="1px"
          borderColor={borderColor}
        >
          <VStack spacing="6">
            <Alert
              status="success"
              variant="subtle"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              textAlign="center"
              borderRadius="lg"
              py={6}
            >
              <AlertIcon boxSize="8" />
              <AlertTitle mt={4} mb={1} fontSize="lg">
                Account created successfully!
              </AlertTitle>
              <AlertDescription maxWidth="sm">
                Please check your email to confirm your account. The confirmation link will expire in 24 hours.
              </AlertDescription>
            </Alert>

            <Button
              colorScheme="blue"
              width="full"
              onClick={handleResendEmail}
              isLoading={resendLoading}
            >
              Resend confirmation email
            </Button>

            <Text color="gray.600">
              Already confirmed?{' '}
              <Button
                variant="link"
                colorScheme="blue"
                onClick={() => navigate('/auth/signin')}
              >
                Sign in
              </Button>
            </Text>
          </VStack>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxW="lg" py={{ base: '12', md: '24' }} px={{ base: '0', sm: '8' }}>
      <Box
        py={{ base: '8', sm: '12' }}
        px={{ base: '4', sm: '10' }}
        bg={bgColor}
        boxShadow={{ base: 'none', sm: 'md' }}
        borderRadius={{ base: 'none', sm: 'xl' }}
        borderWidth="1px"
        borderColor={borderColor}
      >
        <VStack spacing="6">
          <Heading size="lg">Create an account</Heading>

          <form onSubmit={handleSubmit} style={{ width: '100%' }}>
            <VStack spacing="6" align="stretch">
              <FormControl isInvalid={!!error}>
                <FormLabel htmlFor="email">Email</FormLabel>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </FormControl>

              <FormControl isInvalid={!!error}>
                <FormLabel htmlFor="password">Password</FormLabel>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                {error && <FormErrorMessage>{error}</FormErrorMessage>}
              </FormControl>

              <Button
                type="submit"
                colorScheme="blue"
                size="lg"
                fontSize="md"
                isLoading={isLoading}
              >
                Sign up
              </Button>
            </VStack>
          </form>

          <Text color="gray.600">
            Already have an account?{' '}
            <Button
              variant="link"
              colorScheme="blue"
              onClick={() => navigate('/auth/signin')}
            >
              Sign in
            </Button>
          </Text>
        </VStack>
      </Box>
    </Container>
  );
} 