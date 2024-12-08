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

export function VotePacks() {
  const { user } = useAuth();
  const [packs, setPacks] = React.useState<VotePack[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isPurchasing, setIsPurchasing] = React.useState(false);
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

  const handlePurchase = async (packType: typeof AVAILABLE_PACKS[number]['type'], amount: number, cost: number) => {
    if (!user) return;
    
    try {
      setIsPurchasing(true);
      console.log('Purchasing pack:', { packType, amount, cost });
      
      await tokenService.purchaseVotePack(user.id, packType, cost);
      
      // Refresh packs after purchase
      const userPacks = await tokenService.getUserVotePacks(user.id);
      setPacks(userPacks);
      
      toast({
        title: 'Purchase successful',
        description: `You've purchased a ${packType} pack with ${amount} votes`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
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
                  isLoading={isPurchasing}
                  onClick={() => handlePurchase(pack.type, pack.amount, pack.cost)}
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
    </VStack>
  );
} 