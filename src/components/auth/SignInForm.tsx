import { useState } from 'react';
import {
  Box,
  Button,
  Center,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  Text,
  useToast,
  VStack,
  InputGroup,
  InputLeftElement,
  Icon,
  Divider,
  HStack,
} from '@chakra-ui/react';
import { useAuth } from './AuthProvider';
import { MdEmail, MdLock } from 'react-icons/md';

export function SignInForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signInWithPassword } = useAuth();
  const toast = useToast();

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signIn(email);
      toast({
        title: 'Check your email',
        description: 'We sent you a magic link to sign in',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to sign in',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await signInWithPassword(email, password);
      toast({
        title: 'Success',
        description: 'You have been signed in',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to sign in',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Center minH="100vh" bg="gray.50">
      <Box
        mx="auto"
        maxW="md"
        w="full"
        p={8}
        borderWidth={1}
        borderRadius="lg"
        boxShadow="lg"
        bg="white"
      >
        <VStack spacing={6}>
          <Stack spacing={2} align="center" textAlign="center">
            <Heading size="xl">Meta Salon</Heading>
            <Text color="gray.600">
              Sign in to join the art community
            </Text>
          </Stack>

          <form onSubmit={handlePasswordSignIn} style={{ width: '100%' }}>
            <Stack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Email address</FormLabel>
                <InputGroup>
                  <InputLeftElement pointerEvents='none'>
                    <Icon as={MdEmail} color='gray.300' />
                  </InputLeftElement>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                  />
                </InputGroup>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Password</FormLabel>
                <InputGroup>
                  <InputLeftElement pointerEvents='none'>
                    <Icon as={MdLock} color='gray.300' />
                  </InputLeftElement>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                  />
                </InputGroup>
              </FormControl>

              <Button
                type="submit"
                colorScheme="blue"
                size="lg"
                isLoading={isLoading}
                leftIcon={<Icon as={MdLock} />}
              >
                Sign In with Password
              </Button>
            </Stack>
          </form>

          <HStack w="full">
            <Divider />
            <Text fontSize="sm" color="gray.500" whiteSpace="nowrap" px={3}>
              or continue with
            </Text>
            <Divider />
          </HStack>

          <Button
            w="full"
            variant="outline"
            colorScheme="blue"
            size="lg"
            onClick={handleEmailSignIn}
            isLoading={isLoading}
            leftIcon={<Icon as={MdEmail} />}
          >
            Magic Link
          </Button>
        </VStack>
      </Box>
    </Center>
  );
} 