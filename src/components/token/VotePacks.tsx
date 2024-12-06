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
  VStack,
  Divider,
  useColorModeValue,
} from '@chakra-ui/react';
import { useState, useCallback } from 'react';
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
  const { balance = 0, votePacks = [], setBalance } = useTokens();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const handleModalClose = useCallback(() => {
    if (!isLoading) {
      onClose();
      setSelectedPack(null);
    }
  }, [isLoading, onClose]);

  const handlePurchaseClick = useCallback((pack: VotePackDefinition) => {
    setSelectedPack(pack);
    onOpen();
  }, [onOpen]);

  const handlePurchaseConfirm = useCallback(async () => {
    if (!selectedPack) return;
    
    const { type, votes, votePower } = selectedPack;
    const price = calculatePackPrice(votes, votePower);
    
    if (balance < price) {
      toast({
        title: 'Insufficient Balance',
        description: `You need ${price} tokens. Current balance: ${balance}`,
        status: 'warning',
      });
      handleModalClose();
      return;
    }

    try {
      setIsLoading(type);
      const tokenService = TokenService.getInstance();
      await tokenService.purchaseVotePack(userId, type, price);
      
      setBalance(prev => prev - price);
      
      toast({
        title: 'Purchase Successful',
        description: `You've purchased ${votes} votes with ${votePower}× power for ${price} tokens`,
        status: 'success',
      });
    } catch (error) {
      toast({
        title: 'Purchase Failed',
        description: error instanceof Error ? error.message : 'Failed to purchase vote pack',
        status: 'error',
      });
    } finally {
      setIsLoading(null);
      handleModalClose();
    }
  }, [selectedPack, balance, userId, handleModalClose, toast]);

  return (
    <VStack spacing={8} p={6} align="stretch">
      {/* Owned Vote Packs */}
      {votePacks.length > 0 && (
        <Box>
          <Heading size="md" mb={4}>
            Your Vote Packs
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6}>
            {votePacks.map((pack) => {
              const isBasicPack = pack.type === 'basic';
              return (
                <Box
                  key={pack.id}
                  p={6}
                  borderWidth="1px"
                  borderColor={borderColor}
                  borderRadius="lg"
                  bg={bgColor}
                  shadow="sm"
                >
                  <Heading size="md" mb={2}>
                    {isBasicPack ? '🎁 ' : ''}{pack.type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Pack
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
              );
            })}
          </SimpleGrid>
        </Box>
      )}

      {/* Available Vote Packs */}
      <Box>
        <Heading size="md" mb={4}>
          Available Vote Packs
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
                borderColor={borderColor}
                borderRadius="lg"
                bg={bgColor}
                shadow="sm"
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
                    onClick={() => handlePurchaseClick(pack)}
                    isLoading={isLoading === pack.type}
                    isDisabled={balance < price}
                  >
                    Purchase
                  </Button>
                </Tooltip>
              </Box>
            );
          })}
        </SimpleGrid>
      </Box>

      {/* Purchase Modal */}
      <Modal
        isOpen={isOpen}
        onClose={handleModalClose}
        isCentered
        closeOnOverlayClick={!isLoading}
        motionPreset="scale"
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            Confirm Purchase
          </ModalHeader>
          {!isLoading && <ModalCloseButton />}
          <ModalBody>
            {selectedPack && (
              <VStack spacing={4} align="stretch">
                <Text>
                  You are about to purchase:
                </Text>
                <Box p={4} borderWidth="1px" borderRadius="md" bg="gray.50">
                  <Stack spacing={3}>
                    <Text fontWeight="bold">
                      {selectedPack.type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Pack
                    </Text>
                    <Text>• {selectedPack.votes} votes</Text>
                    <Text>• {selectedPack.votePower}× vote power</Text>
                    <Text>• Total price: {calculatePackPrice(selectedPack.votes, selectedPack.votePower)} SLN</Text>
                    <Divider />
                    <Text fontSize="sm" color="gray.600">
                      Your balance after purchase will be: {balance - calculatePackPrice(selectedPack.votes, selectedPack.votePower)} SLN
                    </Text>
                  </Stack>
                </Box>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              onClick={handleModalClose}
              isDisabled={!!isLoading}
            >
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
    </VStack>
  );
} 