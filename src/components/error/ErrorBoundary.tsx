import React from 'react';
import { Container, VStack, Heading, Text, Button } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    console.error('Error caught in boundary:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error details:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />;
    }

    return this.props.children;
  }
}

function ErrorFallback() {
  const navigate = useNavigate();

  const handleRetry = () => {
    navigate('/', { replace: true });
    window.location.reload();
  };

  return (
    <Container maxW="xl" py={16}>
      <VStack spacing={6} align="center" textAlign="center">
        <Heading size="xl">We'll be right back</Heading>
        <Text fontSize="lg">The page is temporarily unavailable. Please try again.</Text>
        <Button colorScheme="blue" onClick={handleRetry}>
          Return to Home
        </Button>
      </VStack>
    </Container>
  );
} 