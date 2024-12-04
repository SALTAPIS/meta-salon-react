import {
  Container,
  VStack,
  Heading,
  Text,
  Button,
} from '@chakra-ui/react';
import { Link as RouterLink } from 'react-router-dom';

export default function UnauthorizedPage() {
  return (
    <Container maxW="xl" py={20}>
      <VStack spacing={6} textAlign="center">
        <Heading size="xl">Access Denied</Heading>
        <Text fontSize="lg" color="gray.600">
          You don't have permission to access this page.
        </Text>
        <Button
          as={RouterLink}
          to="/"
          colorScheme="blue"
          size="lg"
        >
          Go Home
        </Button>
      </VStack>
    </Container>
  );
} 