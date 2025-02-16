import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Text,
  useToast,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  HStack,
  Divider,
  Heading,
  useColorModeValue,
  Badge,
} from '@chakra-ui/react';
import { useAuth } from '../../hooks/useAuth';

export default function SignUpPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.400');
  const alertBg = useColorModeValue('green.50', 'rgba(72, 187, 120, 0.1)');
  const alertBorder = useColorModeValue('green.200', 'green.600');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signUp(email, password);
      setIsSuccess(true);
      toast({
        title: 'Sign up successful!',
        description: 'Please check your email to confirm your account.',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Sign up error:', error);
      toast({
        title: 'Sign up failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="center" textAlign="center">
          <Alert
            status="success"
            variant="subtle"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            textAlign="center"
            height="auto"
            py={6}
            px={4}
            borderRadius="lg"
            bg={alertBg}
            border="1px solid"
            borderColor={alertBorder}
          >
            <AlertIcon boxSize="40px" mr={0} />
            <AlertTitle mt={4} mb={1} fontSize="lg" color={textColor}>
              Check your email!
            </AlertTitle>
            <AlertDescription maxWidth="sm" color={secondaryTextColor}>
              We've sent you a confirmation link. Please check your email to complete your registration.
            </AlertDescription>
          </Alert>

          <Box mt={8} px={4}>
            <Text
              fontSize={{ base: "4xl", md: "5xl", lg: "6xl" }}
              fontWeight="bold"
              fontFamily="Allan"
              mb={{ base: 6, md: 8 }}
              lineHeight="1.2"
            >
              In that wondrous moment, it all began...
            </Text>
            
            <VStack spacing={4}>
              <Button
                colorScheme="blue"
                size="lg"
                onClick={() => navigate('/artworks')}
                width={{ base: "full", md: "auto" }}
              >
                Explore Winners
              </Button>
              <Button
                variant="outline"
                colorScheme="blue"
                size="lg"
                onClick={() => navigate('/submit')}
                width={{ base: "full", md: "auto" }}
              >
                Request Artist Invitation
              </Button>
            </VStack>
          </Box>
        </VStack>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={16}>
      <VStack spacing={8} align="center">
        <Heading 
          fontSize={{ base: "5xl", md: "6xl", lg: "7xl" }}
          fontFamily="Allan"
          textAlign="center"
          lineHeight="1.2"
          maxW="container.xl"
          w="100%"
        >
          Take the chance, join the dance!
        </Heading>
        <Badge colorScheme="purple" fontSize="sm" px={2} py={0.5}>
          Sign up
        </Badge>

        <Container maxW="md" p={0}>
          <Box p={8} borderWidth="1px" borderRadius="lg" bg={bg} borderColor={borderColor}>
            <VStack spacing={6}>
              <Text color={secondaryTextColor}>Create your account to start your journey</Text>

              <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                <VStack spacing={4}>
                  <FormControl isRequired>
                    <FormLabel color={textColor}>Email</FormLabel>
                    <Input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel color={textColor}>Password</FormLabel>
                    <Input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Create a password"
                    />
                  </FormControl>

                  <Button
                    type="submit"
                    colorScheme="blue"
                    size="lg"
                    width="full"
                    isLoading={loading}
                  >
                    Sign Up
                  </Button>
                </VStack>
              </form>

              <HStack w="full">
                <Divider />
                <Text fontSize="sm" whiteSpace="nowrap" color={secondaryTextColor}>
                  or
                </Text>
                <Divider />
              </HStack>

              <Button
                variant="ghost"
                width="full"
                onClick={() => navigate('/auth/signin')}
              >
                Already have an account? Sign In
              </Button>
            </VStack>
          </Box>
        </Container>
      </VStack>
    </Container>
  );
} 