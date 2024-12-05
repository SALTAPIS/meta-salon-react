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
} from '@chakra-ui/react';
import { useState } from 'react';
import { TokenService } from '../../services/token/tokenService';
import { useTokens } from '../../hooks/token/useTokens';
import { VOTE_PACK_DEFINITIONS, calculatePackPrice, VotePackDefinition } from '../../config/votePackConfig';

interface VotePackProps {
  userId: string;
}

export function VotePacks({ userId }: VotePackProps) {
  const [isLoading, setIsLoading] = useState<VotePackDefinition['type'] | null>(null);
  const [selectedPack, setSelectedPack] = useState<VotePackDefinition | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();
  const { balance = 0 } = useTokens();

  const handlePurchaseClick = (pack: VotePackDefinition) => {
    console.log('Purchase clicked:', {
      pack,
      isOpen,
      selectedPack
    });
    setSelectedPack(pack);
    onOpen();
    console.log('Modal should be open:', {
      isOpenAfter: isOpen,
      selectedPackAfter: selectedPack
    });
  };

  const handlePurchaseConfirm = async () => {
    if (!selectedPack) {
      console.error('No pack selected for purchase');
      return;
    }
    
    const { type, votes, votePower } = selectedPack;
    const price = calculatePackPrice(votes, votePower);
    
    console.log('Confirming vote pack purchase:', {
      userId,
      type,
      votes,
      votePower,
      price,
      currentBalance: balance
    });
    
    if (balance < price) {
      console.log('Purchase rejected: Insufficient balance', {
        required: price,
        available: balance,
        difference: price - balance
      });
      toast({
        title: 'Insufficient Balance',
        description: `You need ${price} tokens. Current balance: ${balance}`,
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      onClose();
      return;
    }

    try {
      setIsLoading(type);
      console.log('Calling purchaseVotePack:', { userId, type, price });
      const tokenService = TokenService.getInstance();
      await tokenService.purchaseVotePack(userId, type, price);
      
      console.log('Purchase successful:', {
        type,
        votes,
        votePower,
        price,
        newBalance: balance - price
      });
      
      toast({
        title: 'Purchase Successful',
        description: `You've purchased ${votes} votes with ${votePower}× power for ${price} tokens`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      onClose();
    } catch (error) {
      console.error('Vote pack purchase failed:', {
        error,
        userId,
        type,
        price,
        errorMessage: error instanceof Error ? error.message : 'Unknown error'
      });
      toast({
        title: 'Purchase Failed',
        description: error instanceof Error ? error.message : 'Failed to purchase vote pack',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      console.log('Purchase attempt completed');
      setIsLoading(null);
    }
  };

  return (
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
                  onClick={() => handlePurchaseClick(pack)}
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

      <Modal isOpen={isOpen} onClose={onClose} isCentered>
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
    </Box>
  );
} 