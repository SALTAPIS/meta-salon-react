import { useState } from 'react';
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
} from '@chakra-ui/react';
import { useAuth } from '../../components/auth/AuthProvider';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { signUpWithPassword } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      console.log('Attempting to sign up with email:', email);
      const { data, error } = await signUpWithPassword(email, password);

      if (error) {
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

      // Show success message immediately
      toast({
        title: 'Check your email',
        description: 'Please check your email to confirm your account. The confirmation link will expire in 24 hours.',
        status: 'success',
        duration: 10000,
        isClosable: true,
        position: 'top',
      });

      // Clear form
      setEmail('');
      setPassword('');
      
      // Redirect after a short delay
      setTimeout(() => {
        navigate('/auth/signin');
      }, 2000);
    } catch (error) {
      console.error('Signup error:', error);
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