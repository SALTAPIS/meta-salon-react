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

interface VotePackProps {
  userId: string;
}

interface PackOption {
  type: 'basic' | 'pro' | 'elite';
  votes: number;
  price: number;
  description?: string;
}

const packOptions: PackOption[] = [
  {
    type: 'basic',
    votes: 10,
    price: 100,
    description: 'Good for casual voters',
  },
  {
    type: 'pro',
    votes: 25,
    price: 200,
    description: 'Perfect for art enthusiasts',
  },
  {
    type: 'elite',
    votes: 50,
    price: 350,
    description: 'For serious collectors',
  },
];

export function VotePacks({ userId }: VotePackProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const toast = useToast();
  const { balance = 0 } = useTokens();

  const handlePurchase = async (pack: PackOption) => {
    if (balance < pack.price) {
      toast({
        title: 'Insufficient Balance',
        description: `You need ${pack.price} tokens. Current balance: ${balance}`,
        status: 'warning',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsLoading(pack.type);
      const tokenService = TokenService.getInstance();
      await tokenService.purchaseVotePack(userId, pack.type, pack.price);
      
      toast({
        title: 'Purchase Successful',
        description: `You've purchased ${pack.votes} votes for ${pack.price} tokens`,
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
        {packOptions.map((pack) => (
          <Box
            key={pack.type}
            p={6}
            borderWidth="1px"
            borderRadius="lg"
            position="relative"
          >
            <Heading size="md" mb={2}>
              {pack.type.charAt(0).toUpperCase() + pack.type.slice(1)} Pack
            </Heading>
            <Text mb={4}>
              {pack.votes} votes for {pack.price} tokens
            </Text>
            {pack.description && (
              <Text fontSize="sm" color="gray.500" mb={4}>
                {pack.description}
              </Text>
            )}
            <Tooltip
              isDisabled={balance >= pack.price}
              label={`Insufficient balance. You need ${pack.price} tokens`}
              placement="top"
            >
              <Button
                colorScheme="blue"
                width="full"
                onClick={() => handlePurchase(pack)}
                isLoading={isLoading === pack.type}
                isDisabled={balance < pack.price}
              >
                Purchase
              </Button>
            </Tooltip>
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  );
} 