import React from 'react';
import {
  Box,
  Text,
  VStack,
  Flex,
  Badge,
  Skeleton,
  StackDivider,
} from '@chakra-ui/react';
import { useAuth } from '../../hooks/useAuth';
import { TokenService } from '../../services/token/tokenService';
import type { Database } from '../../types/supabase';

type VotePack = Database['public']['Tables']['vote_packs']['Row'];

export function VotePacks() {
  const { user } = useAuth();
  const [packs, setPacks] = React.useState<VotePack[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const tokenService = TokenService.getInstance();

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
      } finally {
        setIsLoading(false);
      }
    }

    loadPacks();
  }, [user]);

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

  if (packs.length === 0) {
    return (
      <Text color="gray.500">No active vote packs</Text>
    );
  }

  return (
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
  );
} 