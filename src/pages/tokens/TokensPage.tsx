import {
  Container,
  Box,
  Heading,
  Text,
  VStack,
  useColorModeValue,
  Button,
} from '@chakra-ui/react';
import { VotePacks } from '../../components/token/VotePacks';
import { useAuth } from '../../hooks/useAuth';
import { Navigate, Link as RouterLink } from 'react-router-dom';
import { useState } from 'react';
import { useTokens } from '../../hooks/token/useTokens';

export function TokensPage() {
  const { user } = useAuth();
  const { balance } = useTokens();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const [purchaseComplete, setPurchaseComplete] = useState(false);

  if (!user) {
    return <Navigate to="/auth/signin" />;
  }

  return (
    <div>
      <Container maxW="container.xl" py={8}>
        <VStack spacing={6} align="center" mb={12} textAlign="center">
          <Box maxW="container.md">
            {purchaseComplete ? (
              <Heading 
                size="2xl" 
                fontFamily="'Allan', cursive"
                letterSpacing="wide"
                mb={4}
              >
                Let the games begin
              </Heading>
            ) : (
              <VStack spacing={2} mb={4}>
                <Heading 
                  size="2xl" 
                  fontFamily="'Allan', cursive"
                  letterSpacing="wide"
                >
                  Your vote has value
                </Heading>
                <Heading 
                  size="xl" 
                  fontFamily="'Allan', cursive"
                  letterSpacing="wide"
                >
                  Your balance has {balance || 0} SLN
                </Heading>
              </VStack>
            )}
            {purchaseComplete ? (
              <VStack spacing={6}>
                <Text fontSize="lg" color="gray.600">
                  Time to discover and support amazing artworks! In each round, you'll be presented 
                  with a pair of artworks. Simply choose your favorite by clicking on it. Your votes 
                  directly support the artists and help shape the future of digital art.
                </Text>
                <Button
                  as={RouterLink}
                  to="/game"
                  size="lg"
                  colorScheme="blue"
                  mt={4}
                >
                  Enter the Arena
                </Button>
              </VStack>
            ) : (
              <Text fontSize="lg" color="gray.600">
                Get Vote Packs at different sizes. Your votes directly support the artists 
                you appreciate - it's a way to spread love and create real value in the artistic community.
              </Text>
            )}
          </Box>
        </VStack>

        {!purchaseComplete && (
          <Box 
            width="100%" 
            p={8} 
            bg={bgColor} 
            borderRadius="lg" 
            borderWidth={1} 
            borderColor={borderColor}
          >
            <VotePacks onPurchaseComplete={() => setPurchaseComplete(true)} />
          </Box>
        )}
      </Container>
    </div>
  );
} 