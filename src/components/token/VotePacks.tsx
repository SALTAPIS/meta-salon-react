import {
  Box,
  Button,
  Heading,
  Text,
  SimpleGrid,
  useToast,
  Tooltip,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Stack,
  Divider,
  Portal,
} from '@chakra-ui/react';
import { useState, useCallback, useEffect } from 'react';
import { TokenService } from '../../services/token/tokenService';
import { useTokens } from '../../hooks/token/useTokens';
import { VOTE_PACK_DEFINITIONS, calculatePackPrice, VotePackDefinition } from '../../config/votePackConfig';

interface VotePackProps {
  userId: string;
}

const formatExpiryDate = (expiryDate: string | null): string => {
  if (!expiryDate) return 'No expiration';
  return new Date(expiryDate).toLocaleDateString();
};

export function VotePacks({ userId }: VotePackProps) {
  const [isLoading, setIsLoading] = useState<VotePackDefinition['type'] | null>(null);
  const [selectedPack, setSelectedPack] = useState<VotePackDefinition | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast({
    position: 'top',
    duration: 5000,
    isClosable: true,
  });
  const { balance = 0, votePacks = [] } = useTokens();

  // Debug logs for component state
  useEffect(() => {
    console.log('🎁 VotePacks component state:', {
      isOpen,
      selectedPack,
      balance,
      votePacks: votePacks.length
    });
  }, [isOpen, selectedPack, balance, votePacks.length]);

  const handlePurchaseClick = useCallback((pack: VotePackDefinition) => {
    try {
      console.log('🛍️ Purchase button clicked:', { pack });
      setSelectedPack(pack);
      console.log('🎯 Opening modal...');
      onOpen();
      console.log('🚀 Modal should be open:', { isOpen: true });
    } catch (error) {
      console.error('❌ Error in handlePurchaseClick:', error);
    }
  }, [onOpen]);

  const handlePurchaseConfirm = async () => {
    if (!selectedPack) {
      console.error('❌ No pack selected for purchase');
      return;
    }
    
    const { type, votes, votePower } = selectedPack;
    const price = calculatePackPrice(votes, votePower);
    
    console.log('💳 Confirming purchase:', { type, votes, votePower, price, balance });
    
    if (balance < price) {
      console.log('⚠️ Insufficient balance:', { required: price, available: balance });
      toast({
        title: 'Insufficient Balance',
        description: `You need ${price} tokens. Current balance: ${balance}`,
        status: 'warning',
      });
      onClose();
      return;
    }

    try {
      setIsLoading(type);
      const tokenService = TokenService.getInstance();
      await tokenService.purchaseVotePack(userId, type, price);
      
      console.log('✅ Purchase successful');
      toast({
        title: 'Purchase Successful',
        description: `You've purchased ${votes} votes with ${votePower}× power for ${price} tokens`,
        status: 'success',
      });
      onClose();
    } catch (error) {
      console.error('❌ Purchase failed:', error);
      toast({
        title: 'Purchase Failed',
        description: error instanceof Error ? error.message : 'Failed to purchase vote pack',
        status: 'error',
      });
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <Box>
      <Stack spacing={8}>
        <Box>
          <Heading size="md" mb={4}>
            🎁 Available Vote Packs
          </Heading>
          <Text mb={6} color="gray.500">
            Purchase vote packs to participate in artwork voting
          </Text>

          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
            {VOTE_PACK_DEFINITIONS.map((pack) => {
              const price = calculatePackPrice(pack.votes, pack.votePower);
              return (
                <Box
                  key={pack.type}
                  p={6}
                  borderWidth="1px"
                  borderRadius="lg"
                  position="relative"
                >
                  <Heading size="md" mb={2}>
                    {pack.type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Pack
                  </Heading>
                  <Text mb={2}>
                    {pack.votes} votes × {pack.votePower} SLN each
                  </Text>
                  <Text fontSize="md" color="blue.500" mb={4}>
                    Total Price: {price} SLN
                  </Text>
                  {pack.description && (
                    <Text fontSize="sm" color="gray.500" mb={4}>
                      {pack.description}
                    </Text>
                  )}
                  <Tooltip
                    isDisabled={balance >= price}
                    label={`Insufficient balance. You need ${price} tokens`}
                    placement="top"
                  >
                    <Button
                      colorScheme="blue"
                      width="full"
                      onClick={() => {
                        console.log('🖱️ Button clicked for pack:', pack.type);
                        handlePurchaseClick(pack);
                      }}
                      isLoading={isLoading === pack.type}
                      isDisabled={balance < price}
                    >
                      Purchase
                    </Button>
                  </Tooltip>
                </Box>
              )
            })}
          </SimpleGrid>
        </Box>

        {votePacks.length > 0 && (
          <Box>
            <Divider my={8} />
            <Heading size="md" mb={4}>
              Your Vote Packs
            </Heading>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
              {votePacks.map((pack) => (
                <Box
                  key={pack.id}
                  p={6}
                  borderWidth="1px"
                  borderRadius="lg"
                  position="relative"
                >
                  <Heading size="md" mb={2}>
                    {pack.type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Pack
                  </Heading>
                  <Text mb={2}>
                    {pack.votes_remaining} votes remaining
                  </Text>
                  <Text mb={2}>
                    {pack.vote_power}× voting power
                  </Text>
                  <Text fontSize="sm" color="gray.500" mb={4}>
                    Expires: {formatExpiryDate(pack.expires_at)}
                  </Text>
                  <Button
                    colorScheme="green"
                    width="full"
                    isDisabled={pack.votes_remaining === 0}
                  >
                    {pack.votes_remaining > 0 ? 'Use Pack' : 'Expired'}
                  </Button>
                </Box>
              ))}
            </SimpleGrid>
          </Box>
        )}
      </Stack>

      <Portal>
        <Modal 
          isOpen={isOpen} 
          onClose={onClose} 
          isCentered
          closeOnOverlayClick={false}
        >
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>Confirm Purchase</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              {selectedPack && (
                <>
                  <Text mb={4}>
                    You are about to purchase:
                  </Text>
                  <Box p={4} borderWidth="1px" borderRadius="md" bg="gray.50">
                    <Text fontWeight="bold" mb={2}>
                      {selectedPack.type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Pack
                    </Text>
                    <Text mb={2}>• {selectedPack.votes} votes</Text>
                    <Text mb={2}>• {selectedPack.votePower}× vote power</Text>
                    <Text mb={2}>• Total price: {calculatePackPrice(selectedPack.votes, selectedPack.votePower)} SLN</Text>
                    <Text fontSize="sm" color="gray.600">Your balance after purchase will be: {balance - calculatePackPrice(selectedPack.votes, selectedPack.votePower)} SLN</Text>
                  </Box>
                </>
              )}
            </ModalBody>

            <ModalFooter>
              <Button variant="ghost" mr={3} onClick={onClose}>
                Cancel
              </Button>
              <Button 
                colorScheme="blue" 
                onClick={handlePurchaseConfirm}
                isLoading={isLoading === selectedPack?.type}
              >
                Confirm Purchase
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </Portal>
    </Box>
  );
} 