import React, { useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
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
  HStack,
  Divider,
  InputGroup,
  InputRightElement,
  IconButton,
  Badge,
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { AuthService } from '../../services/auth/authService';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordMode, setIsPasswordMode] = useState(true);
  const navigate = useNavigate();
  const toast = useToast();

  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const textColor = useColorModeValue('gray.800', 'white');
  const secondaryTextColor = useColorModeValue('gray.600', 'gray.400');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const authService = AuthService.getInstance();
      let error;

      if (isPasswordMode) {
        ({ error } = await authService.signInWithPassword(email, password));
      } else {
        ({ error } = await authService.signInWithEmail(email));
      }

      if (error) throw error;

      if (isPasswordMode) {
        const { user } = await authService.signIn({ email, password });
        const username = user.username || user.email?.split('@')[0];
        const redirectPath = user.role === 'admin' ? '/admin' : `/${username}/dashboard`;
        navigate(redirectPath);
      } else {
        toast({
          title: 'Magic link sent',
          description: 'Check your email for the login link',
          status: 'success',
          duration: 5000,
          isClosable: true,
        });
      }
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

  const toggleAuthMode = () => {
    setIsPasswordMode(!isPasswordMode);
    setPassword('');
  };

  return (
    <Container maxW="container.xl" py={16}>
      <VStack spacing={8} align="center">
        <Heading 
          fontSize={{ base: "4xl", md: "2xl" }}
          fontFamily="Allan"
          textAlign="center"
          lineHeight="1.2"
        >
          Make your fate and sign in?
        </Heading>
        <Badge colorScheme="green" fontSize="sm" px={2} py={0.5}>
          Sign in
        </Badge>

        <Container maxW="md" p={0}>
          <Box p={8} borderWidth="1px" borderRadius="lg" bg={bg} borderColor={borderColor}>
            <VStack spacing={6}>
              <Text color={secondaryTextColor}>Sign in to your account</Text>

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

                  {isPasswordMode && (
                    <FormControl isRequired>
                      <FormLabel color={textColor}>Password</FormLabel>
                      <InputGroup>
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="Enter your password"
                        />
                        <InputRightElement>
                          <IconButton
                            aria-label={showPassword ? 'Hide password' : 'Show password'}
                            icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                            variant="ghost"
                            onClick={() => setShowPassword(!showPassword)}
                          />
                        </InputRightElement>
                      </InputGroup>
                    </FormControl>
                  )}

                  <Button
                    type="submit"
                    colorScheme="green"
                    size="lg"
                    width="full"
                    isLoading={isLoading}
                  >
                    {isPasswordMode ? 'Sign In' : 'Send Magic Link'}
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
                variant="outline"
                colorScheme="green"
                width="full"
                onClick={toggleAuthMode}
              >
                {isPasswordMode ? 'Sign in with Magic Link' : 'Sign in with Password'}
              </Button>

              <Text color={secondaryTextColor}>
                Don't have an account?{' '}
                <Link as={RouterLink} to="/auth/signup" color="green.500">
                  Sign up
                </Link>
              </Text>
            </VStack>
          </Box>
        </Container>
      </VStack>
    </Container>
  );
} 