import { useState, type MouseEvent } from 'react';
import {
  Box,
  Button,
  VStack,
  HStack,
  Text,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  useDisclosure,
  Alert,
  AlertIcon,
  SimpleGrid,
  Card,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Spinner,
  Center,
} from '@chakra-ui/react';
import { useTokens } from '../../hooks/token/useTokens';
import type { VotePack } from '../../types/database.types';

interface AvailablePack {
  votes: number;
  price: number;
}

const AVAILABLE_PACKS: AvailablePack[] = [
  { votes: 10, price: 99 },
  { votes: 50, price: 450 },
  { votes: 100, price: 850 },
];

export function VotePacks() {
  const toast = useToast();
  const { votePacks, isLoading, error, refreshBalance } = useTokens();
  const [selectedPack, setSelectedPack] = useState<AvailablePack | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handlePackSelect = (pack: AvailablePack) => {
    setSelectedPack(pack);
    onOpen();
  };

  const handlePurchase = async () => {
    if (!selectedPack) return;

    try {
      setIsSubmitting(true);
      await refreshBalance();
      toast({
        title: 'Vote pack purchased',
        description: `You purchased ${selectedPack.votes} votes`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      onClose();
    } catch (err) {
      toast({
        title: 'Failed to purchase vote pack',
        description: err instanceof Error ? err.message : 'Unknown error',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Center py={8}>
        <Spinner />
      </Center>
    );
  }

  if (error) {
    return (
      <Alert status="error">
        <AlertIcon />
        Failed to load vote packs: {error instanceof Error ? error.message : 'Unknown error'}
      </Alert>
    );
  }

  const activePacks = votePacks?.filter((pack: VotePack) => 
    pack.votes > 0 && pack.status === 'active'
  ) || [];

  return (
    <Box>
      <VStack spacing={6} align="stretch">
        {/* Current Vote Packs */}
        <Box>
          <Text fontSize="xl" fontWeight="bold" mb={4}>Your Vote Packs</Text>
          {activePacks.length > 0 ? (
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
              {activePacks.map((pack: VotePack) => (
                <Card key={pack.id}>
                  <CardBody>
                    <Stat>
                      <StatLabel>Vote Pack</StatLabel>
                      <StatNumber>{pack.votes}</StatNumber>
                      <StatHelpText>Available votes</StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>
              ))}
            </SimpleGrid>
          ) : (
            <Alert status="info">
              <AlertIcon />
              You don't have any active vote packs
            </Alert>
          )}
        </Box>

        {/* Available Packs */}
        <Box>
          <Text fontSize="xl" fontWeight="bold" mb={4}>Purchase Vote Packs</Text>
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
            {AVAILABLE_PACKS.map((pack) => (
              <Card key={pack.votes} cursor="pointer" onClick={() => handlePackSelect(pack)}>
                <CardBody>
                  <VStack spacing={2}>
                    <Text fontSize="2xl" fontWeight="bold">{pack.votes}</Text>
                    <Text>votes</Text>
                    <Text fontWeight="semibold">{pack.price} SLN</Text>
                    <Button
                      colorScheme="blue"
                      size="sm"
                      width="full"
                      onClick={(e: MouseEvent) => {
                        e.stopPropagation();
                        handlePackSelect(pack);
                      }}
                    >
                      Purchase
                    </Button>
                  </VStack>
                </CardBody>
              </Card>
            ))}
          </SimpleGrid>
        </Box>
      </VStack>

      {/* Purchase Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirm Purchase</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {selectedPack && (
              <VStack spacing={4} align="stretch">
                <Text>
                  You are about to purchase a vote pack with {selectedPack.votes} votes
                  for {selectedPack.price} SLN.
                </Text>
                <Alert status="info">
                  <AlertIcon />
                  Votes can be used to support artworks in challenges
                </Alert>
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <HStack spacing={3}>
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button
                colorScheme="blue"
                onClick={handlePurchase}
                isLoading={isSubmitting}
              >
                Confirm Purchase
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Box>
  );
} 