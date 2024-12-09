import { useState } from 'react';
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
} from '@chakra-ui/react';
import { useTokens } from '../../hooks/token/useTokens';
import type { VotePack } from '../../types/database.types';

const AVAILABLE_PACKS = [
  { votes: 10, price: 99 },
  { votes: 50, price: 450 },
  { votes: 100, price: 850 },
];

export function VotePacks() {
  const toast = useToast();
  const { votePacks, refreshBalance } = useTokens();
  const [selectedPack, setSelectedPack] = useState<typeof AVAILABLE_PACKS[number] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handlePackSelect = (pack: typeof AVAILABLE_PACKS[number]) => {
    setSelectedPack(pack);
    onOpen();
  };

  const handlePurchase = async () => {
    if (!selectedPack) return;

    try {
      setIsLoading(true);
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
      setIsLoading(false);
    }
  };

  const activePacks = votePacks.filter((pack: VotePack) => pack.status === 'active');
  const totalVotes = activePacks.reduce((sum, pack) => sum + pack.votes, 0);

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
                      onClick={(e) => {
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
                isLoading={isLoading}
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