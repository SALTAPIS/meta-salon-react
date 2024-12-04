import {
  Box,
  VStack,
  Heading,
  Text,
  Button,
  SimpleGrid,
  useColorModeValue,
  useToast,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { TokenService } from '../../services/token/tokenService';
import type { Database } from '../../types/supabase';

interface VotePacksProps {
  userId: string;
}

type VotePack = Database['public']['Tables']['vote_packs']['Row'];

export function VotePacks({ userId }: VotePacksProps) {
  const toast = useToast();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const { data: votePacks, isLoading } = useQuery({
    queryKey: ['userVotePacks', userId],
    queryFn: () => TokenService.getInstance().getUserVotePacks(userId),
  });

  const handlePurchase = async (type: string, amount: number) => {
    try {
      const tokenService = TokenService.getInstance();
      await tokenService.purchaseVotePack(userId, type as any, amount);
      toast({
        title: 'Success',
        description: 'Vote pack purchased successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to purchase vote pack',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const votePackOptions = [
    { type: 'basic', amount: 10, price: 100, title: 'Basic Pack' },
    { type: 'pro', amount: 25, price: 200, title: 'Pro Pack' },
    { type: 'elite', amount: 50, price: 350, title: 'Elite Pack' },
  ];

  return (
    <VStack spacing={6} align="stretch">
      <Box>
        <Heading size="md" mb={2}>Available Vote Packs</Heading>
        <Text color="gray.500">
          Purchase vote packs to participate in artwork voting
        </Text>
      </Box>

      <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4}>
        {votePackOptions.map((pack) => (
          <Box
            key={pack.type}
            p={6}
            bg={bgColor}
            borderWidth="1px"
            borderColor={borderColor}
            borderRadius="lg"
            shadow="sm"
          >
            <VStack spacing={4} align="stretch">
              <Heading size="md">{pack.title}</Heading>
              <Text>
                {pack.amount} votes for {pack.price} tokens
              </Text>
              <Button
                colorScheme="blue"
                onClick={() => handlePurchase(pack.type, pack.amount)}
                isLoading={isLoading}
              >
                Purchase
              </Button>
            </VStack>
          </Box>
        ))}
      </SimpleGrid>

      {votePacks && votePacks.length > 0 && (
        <Box mt={8}>
          <Heading size="md" mb={4}>Your Active Vote Packs</Heading>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
            {votePacks.map((pack: VotePack) => (
              <Box
                key={pack.id}
                p={6}
                bg={bgColor}
                borderWidth="1px"
                borderColor={borderColor}
                borderRadius="lg"
                shadow="sm"
              >
                <VStack spacing={2} align="stretch">
                  <Text fontWeight="bold">
                    {pack.votes_remaining} votes remaining
                  </Text>
                  <Text color="gray.500">
                    Expires {pack.expires_at ? new Date(pack.expires_at).toLocaleDateString() : 'Never'}
                  </Text>
                </VStack>
              </Box>
            ))}
          </SimpleGrid>
        </Box>
      )}
    </VStack>
  );
} 