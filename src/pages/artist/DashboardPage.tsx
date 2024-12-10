import { useState, useEffect } from 'react';
import {
  Container,
  VStack,
  Heading,
  Button,
  useDisclosure,
  Box,
  Alert,
  AlertIcon,
  Spinner,
  Center,
} from '@chakra-ui/react';
import { ArtistService, type PayoutSummary } from '../../services/ArtistService';
import { PayoutRequestModal } from '../../components/artist/PayoutRequestModal';
import { PayoutHistoryTable } from '../../components/artist/PayoutHistoryTable';

export function DashboardPage() {
  const [payoutSummaries, setPayoutSummaries] = useState<PayoutSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [selectedArtwork, setSelectedArtwork] = useState<PayoutSummary | null>(null);

  useEffect(() => {
    loadPayoutSummaries();
  }, []);

  const loadPayoutSummaries = async () => {
    try {
      setLoading(true);
      setError(null);
      const summaries = await ArtistService.getPayoutSummary();
      setPayoutSummaries(summaries);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load payout summaries');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestPayout = async (amount: number) => {
    if (!selectedArtwork) return;

    try {
      await ArtistService.requestPayout(selectedArtwork.artwork_id, amount);
      onClose();
      await loadPayoutSummaries();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request payout');
    }
  };

  if (loading) {
    return (
      <Center py={20}>
        <Spinner size="xl" />
      </Center>
    );
  }

  if (error) {
    return (
      <Container maxW="container.xl" py={8}>
        <Alert status="error">
          <AlertIcon />
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Heading size="xl">Artist Dashboard</Heading>

        {payoutSummaries.map(artwork => (
          <Box key={artwork.artwork_id} p={4} borderWidth={1} borderRadius="lg">
            <VStack align="stretch" spacing={4}>
              <Heading size="md">{artwork.title}</Heading>
              
              <Alert status="info">
                <AlertIcon />
                Available for payout: {artwork.available_amount.toFixed(2)} SLN
                (≈ ${(artwork.available_amount * 0.01).toFixed(2)} USD)
              </Alert>

              {artwork.pending_amount > 0 && (
                <Alert status="warning">
                  <AlertIcon />
                  Pending payout: {artwork.pending_amount.toFixed(2)} SLN
                  (≈ ${(artwork.pending_amount * 0.01).toFixed(2)} USD)
                </Alert>
              )}

              <Button
                colorScheme="blue"
                isDisabled={artwork.available_amount <= 0}
                onClick={() => {
                  setSelectedArtwork(artwork);
                  onOpen();
                }}
              >
                Request Payout
              </Button>
            </VStack>
          </Box>
        ))}

        <Box mt={8}>
          <Heading size="lg" mb={4}>Payout History</Heading>
          <PayoutHistoryTable />
        </Box>

        {selectedArtwork && (
          <PayoutRequestModal
            isOpen={isOpen}
            onClose={() => {
              setSelectedArtwork(null);
              onClose();
            }}
            artwork={selectedArtwork}
            onSubmit={handleRequestPayout}
          />
        )}
      </VStack>
    </Container>
  );
} 