import {
  Box,
  Button,
  Heading,
  Text,
  SimpleGrid,
  useToast,
  Tooltip,
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
  const toast = useToast();
  const { balance = 0 } = useTokens();

  const handlePurchase = async (packType: VotePackDefinition['type'], votes: number, votePower: number) => {
    const price = calculatePackPrice(votes, votePower);
    
    if (balance < price) {
      toast({
        title: 'Insufficient Balance',
        description: `You need ${price} tokens. Current balance: ${balance}`,
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsLoading(packType);
      const tokenService = TokenService.getInstance();
      await tokenService.purchaseVotePack(userId, packType, price);
      
      toast({
        title: 'Purchase Successful',
        description: `You've purchased ${votes} votes with ${votePower}× power for ${price} tokens`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error purchasing vote pack:', error);
      toast({
        title: 'Purchase Failed',
        description: error instanceof Error ? error.message : 'Failed to purchase vote pack',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
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
                  onClick={() => handlePurchase(pack.type, pack.votes, pack.votePower)}
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
  );
} 