import React from 'react';
import { Box, Heading, Text, Button, Center, VStack } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

export default function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <Center minH="100vh" bg="gray.50">
      <Box
        mx="auto"
        maxW="lg"
        w="full"
        p={8}
        borderWidth={1}
        borderRadius="lg"
        boxShadow="lg"
        bg="white"
      >
        <VStack spacing={6} align="center" textAlign="center">
          <Heading size="xl">Unauthorized Access</Heading>
          <Text color="gray.600">
            You don't have permission to access this page.
          </Text>
          <Button
            colorScheme="blue"
            onClick={() => navigate('/')}
          >
            Return to Home
          </Button>
        </VStack>
      </Box>
    </Center>
  );
} 