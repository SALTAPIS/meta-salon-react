import { useState } from 'react';
import type { MouseEvent } from 'react';
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
  Badge,
} from '@chakra-ui/react';
import { useTokens } from '../../hooks/token/useTokens';
import { TokenService } from '../../services/token/tokenService';
import type { VotePack } from '../../types/database.types';
import { VOTE_PACK_DEFINITIONS, calculatePackPrice } from '../../config/votePackConfig';

export function VotePacks() {
  const toast = useToast();
  const { votePacks, isLoading, error, refreshBalance } = useTokens();
  const [selectedPack, setSelectedPack] = useState<typeof VOTE_PACK_DEFINITIONS[0] | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handlePackSelect = (pack: typeof VOTE_PACK_DEFINITIONS[0]) => {
    setSelectedPack(pack);
    onOpen();
  };

  const handlePurchase = async () => {
    if (!selectedPack) return;

    try {
      setIsSubmitting(true);
      await TokenService.purchaseVotePack(selectedPack.type);
      await refreshBalance();
      toast({
        title: 'Vote pack purchased',
        description: `You purchased a ${selectedPack.type} pack with ${selectedPack.votes} votes`,
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
    pack.votes_remaining > 0 && (!pack.expires_at || new Date(pack.expires_at) > new Date())
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
                      <StatLabel>
                        {pack.type.charAt(0).toUpperCase() + pack.type.slice(1)} Pack
                        <Badge ml={2} colorScheme={pack.vote_power > 1 ? 'purple' : 'blue'}>
                          {pack.vote_power}x Power
                        </Badge>
                      </StatLabel>
                      <StatNumber>{pack.votes_remaining}</StatNumber>
                      <StatHelpText>
                        {pack.expires_at 
                          ? `Expires ${new Date(pack.expires_at).toLocaleDateString()}`
                          : 'No expiration'
                        }
                      </StatHelpText>
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
            {VOTE_PACK_DEFINITIONS.map((pack) => (
              <Card key={pack.type} cursor="pointer" onClick={() => handlePackSelect(pack)}>
                <CardBody>
                  <VStack spacing={2}>
                    <Text fontSize="2xl" fontWeight="bold">{pack.votes}</Text>
                    <Text>votes</Text>
                    <Badge colorScheme={pack.votePower > 1 ? 'purple' : 'blue'}>
                      {pack.votePower}x Vote Power
                    </Badge>
                    <Text fontSize="sm" color="gray.600" textAlign="center">
                      {pack.description}
                    </Text>
                    <Text fontWeight="semibold">
                      {calculatePackPrice(pack.votes, pack.votePower)} SLN
                    </Text>
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
                  You are about to purchase a {selectedPack.type} pack with:
                </Text>
                <HStack spacing={4} justify="center">
                  <Stat>
                    <StatLabel>Votes</StatLabel>
                    <StatNumber>{selectedPack.votes}</StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>Vote Power</StatLabel>
                    <StatNumber>{selectedPack.votePower}x</StatNumber>
                  </Stat>
                  <Stat>
                    <StatLabel>Price</StatLabel>
                    <StatNumber>{calculatePackPrice(selectedPack.votes, selectedPack.votePower)} SLN</StatNumber>
                  </Stat>
                </HStack>
                <Alert status="info">
                  <AlertIcon />
                  {selectedPack.description}
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