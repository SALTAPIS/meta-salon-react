import { useState } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Text,
  VStack,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import type { PayoutSummary } from '../../services/ArtistService';

interface PayoutRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  artwork: PayoutSummary;
  onSubmit: (amount: number) => Promise<void>;
}

export function PayoutRequestModal({
  isOpen,
  onClose,
  artwork,
  onSubmit
}: PayoutRequestModalProps) {
  const [amount, setAmount] = useState<number>(artwork.available_amount);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      await onSubmit(amount);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="lg">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Request Payout</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <VStack spacing={4} align="stretch">
            <Text>
              Artwork: <strong>{artwork.title}</strong>
            </Text>

            <Alert status="info">
              <AlertIcon />
              <VStack align="start" spacing={1}>
                <Text>Available Balance: {artwork.available_amount.toFixed(2)} SLN</Text>
                <Text>≈ ${(artwork.available_amount * 0.01).toFixed(2)} USD</Text>
              </VStack>
            </Alert>

            {artwork.pending_amount > 0 && (
              <Alert status="warning">
                <AlertIcon />
                <VStack align="start" spacing={1}>
                  <Text>Pending Amount: {artwork.pending_amount.toFixed(2)} SLN</Text>
                  <Text>≈ ${(artwork.pending_amount * 0.01).toFixed(2)} USD</Text>
                </VStack>
              </Alert>
            )}

            <FormControl>
              <FormLabel>Amount to Request (SLN)</FormLabel>
              <NumberInput
                value={amount}
                onChange={(_, value) => setAmount(value)}
                max={artwork.available_amount}
                min={1}
                precision={2}
              >
                <NumberInputField />
                <NumberInputStepper>
                  <NumberIncrementStepper />
                  <NumberDecrementStepper />
                </NumberInputStepper>
              </NumberInput>
            </FormControl>

            <Text fontSize="sm" color="gray.600">
              You will receive approximately ${(amount * 0.01).toFixed(2)} USD
            </Text>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={handleSubmit}
            isLoading={isSubmitting}
            isDisabled={amount <= 0 || amount > artwork.available_amount}
          >
            Request Payout
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
} 