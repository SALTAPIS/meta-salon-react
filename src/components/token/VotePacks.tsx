import React from 'react';
import {
  Box,
  Text,
  VStack,
  Flex,
  Badge,
  Skeleton,
  StackDivider,
  Button,
  useToast,
  Heading,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react';
import { useAuth } from '../../hooks/useAuth';
import { TokenService } from '../../services/token/tokenService';
import type { Database } from '../../types/supabase';

type VotePack = Database['public']['Tables']['vote_packs']['Row'];

const AVAILABLE_PACKS = [
  { type: 'basic', amount: 10, cost: 10, description: 'Basic Pack - 10 votes (1 SLN per vote)' },
  { type: 'art_lover', amount: 100, cost: 100, description: 'Art Lover Pack - 100 votes (1 SLN per vote)' },
  { type: 'pro', amount: 25, cost: 50, description: 'Pro Pack - 25 votes (2 SLN per vote)' },
  { type: 'expert', amount: 50, cost: 250, description: 'Expert Pack - 50 votes (5 SLN per vote)' },
  { type: 'elite', amount: 100, cost: 1000, description: 'Elite Pack - 100 votes (10 SLN per vote)' },
] as const;

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  pack: typeof AVAILABLE_PACKS[number];
  onConfirm: () => void;
  isLoading: boolean;
}

function PurchaseModal({ isOpen, onClose, pack, onConfirm, isLoading }: PurchaseModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Confirm Purchase</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <VStack align="stretch" spacing={4}>
            <Box>
              <Text fontWeight="bold">{pack.description}</Text>
              <Text color="gray.600">Cost: {pack.cost} tokens</Text>
            </Box>
            <Text>Are you sure you want to purchase this vote pack?</Text>
          </VStack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button
            colorScheme="blue"
            onClick={onConfirm}
            isLoading={isLoading}
          >
            Confirm Purchase
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

export function VotePacks() {
  const { user } = useAuth();
  const [packs, setPacks] = React.useState<VotePack[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isPurchasing, setIsPurchasing] = React.useState(false);
  const [selectedPack, setSelectedPack] = React.useState<typeof AVAILABLE_PACKS[number] | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const tokenService = TokenService.getInstance();
  const toast = useToast();

  React.useEffect(() => {
    if (!user?.id) {
      setPacks([]);
      setIsLoading(false);
      return;
    }

    async function loadPacks() {
      try {
        const userPacks = await tokenService.getUserVotePacks(user!.id);
        console.log('VotePacks: Loaded packs:', userPacks);
        setPacks(userPacks);
      } catch (error) {
        console.error('VotePacks: Error loading packs:', error);
        toast({
          title: 'Error loading vote packs',
          description: error instanceof Error ? error.message : 'Unknown error',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    }

    loadPacks();
  }, [user, toast]);

  const handlePurchaseClick = (pack: typeof AVAILABLE_PACKS[number]) => {
    setSelectedPack(pack);
    onOpen();
  };

  const handlePurchaseConfirm = async () => {
    if (!user || !selectedPack) return;
    
    try {
      setIsPurchasing(true);
      console.log('Purchasing pack:', selectedPack);
      
      await tokenService.purchaseVotePack(user.id, selectedPack.type, selectedPack.cost);
      
      // Refresh packs after purchase
      const userPacks = await tokenService.getUserVotePacks(user.id);
      setPacks(userPacks);
      
      toast({
        title: 'Purchase successful',
        description: `You've purchased a ${selectedPack.type} pack with ${selectedPack.amount} votes`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      onClose();
    } catch (error) {
      console.error('Error purchasing pack:', error);
      toast({
        title: 'Purchase failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  if (!user) {
    return null;
  }

  if (isLoading) {
    return (
      <VStack spacing={4}>
        <Skeleton height="60px" width="100%" />
        <Skeleton height="60px" width="100%" />
      </VStack>
    );
  }

  return (
    <VStack spacing={6} align="stretch">
      {/* Available Packs */}
      <Box>
        <Heading size="sm" mb={4}>Available Packs</Heading>
        <VStack spacing={3} align="stretch">
          {AVAILABLE_PACKS.map((pack) => (
            <Box
              key={pack.type}
              p={4}
              borderRadius="md"
              borderWidth="1px"
              _hover={{ borderColor: 'blue.500' }}
              transition="all 0.2s"
            >
              <Flex justify="space-between" align="center">
                <Box>
                  <Text fontWeight="bold" textTransform="capitalize">
                    {pack.description}
                  </Text>
                  <Text fontSize="sm" color="gray.600">
                    Cost: {pack.cost} tokens
                  </Text>
                </Box>
                <Button
                  colorScheme="blue"
                  size="sm"
                  isLoading={isPurchasing && selectedPack?.type === pack.type}
                  onClick={() => handlePurchaseClick(pack)}
                >
                  Purchase
                </Button>
              </Flex>
            </Box>
          ))}
        </VStack>
      </Box>

      {/* Active Packs */}
      {packs.length > 0 && (
        <Box>
          <Heading size="sm" mb={4}>Your Active Packs</Heading>
          <VStack
            divider={<StackDivider borderColor="gray.200" />}
            spacing={4}
            align="stretch"
          >
            {packs.map((pack) => (
              <Box
                key={pack.id}
                p={4}
                borderRadius="md"
                borderWidth="1px"
                _hover={{ borderColor: 'blue.500' }}
                transition="all 0.2s"
              >
                <Flex justify="space-between" align="center">
                  <Box>
                    <Text fontWeight="bold" textTransform="capitalize">
                      {pack.type} Pack
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                      {pack.votes_remaining} votes remaining
                    </Text>
                  </Box>
                  <Badge colorScheme="green">
                    {pack.expires_at
                      ? new Date(pack.expires_at).toLocaleDateString()
                      : 'Never expires'}
                  </Badge>
                </Flex>
              </Box>
            ))}
          </VStack>
        </Box>
      )}

      {/* Purchase Confirmation Modal */}
      {selectedPack && (
        <PurchaseModal
          isOpen={isOpen}
          onClose={onClose}
          pack={selectedPack}
          onConfirm={handlePurchaseConfirm}
          isLoading={isPurchasing}
        />
      )}
    </VStack>
  );
} 