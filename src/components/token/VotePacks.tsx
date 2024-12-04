import React from 'react';
import {
  Box,
  VStack,
  Grid,
  Text,
  Button,
  useToast,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Badge,
  useColorModeValue,
} from '@chakra-ui/react';
import { useAuth } from '../auth/AuthProvider';
import { useTokens } from '../../hooks/token/useTokens';

interface VotePackOption {
  type: 'basic' | 'art_lover' | 'pro' | 'expert' | 'elite';
  title: string;
  votes: number;
  power: number;
  price: number;
  description: string;
}

const VOTE_PACKS: VotePackOption[] = [
  {
    type: 'basic',
    title: 'Basic Pack',
    votes: 10,
    power: 1,
    price: 10,
    description: 'Start your voting journey',
  },
  {
    type: 'art_lover',
    title: 'Art Lover',
    votes: 100,
    power: 1,
    price: 80,
    description: 'For the dedicated art enthusiast',
  },
  {
    type: 'pro',
    title: 'Pro Pack',
    votes: 10,
    power: 2,
    price: 25,
    description: 'Double voting power',
  },
  {
    type: 'expert',
    title: 'Expert Pack',
    votes: 10,
    power: 5,
    price: 50,
    description: '5x voting power',
  },
  {
    type: 'elite',
    title: 'Elite Pack',
    votes: 10,
    power: 10,
    price: 90,
    description: 'Maximum voting impact',
  },
];

export function VotePacks() {
  const { user } = useAuth();
  const { votePacks, purchaseVotePack } = useTokens();
  const toast = useToast();

  const cardBg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const handlePurchase = async (pack: VotePackOption) => {
    try {
      if (!user) throw new Error('Please sign in to purchase vote packs');
      if ((user.balance || 0) < pack.price) {
        throw new Error('Insufficient balance');
      }

      await purchaseVotePack(pack.type, pack.price);
      toast({
        title: 'Purchase successful',
        description: `You've purchased the ${pack.title}`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Purchase failed',
        description: error instanceof Error ? error.message : 'Failed to purchase vote pack',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const getActiveVotePack = (type: string) => {
    return votePacks?.find(pack => 
      pack.type === type && 
      pack.votes_remaining > 0 && 
      new Date(pack.expires_at) > new Date()
    );
  };

  return (
    <VStack spacing={6} align="stretch">
      <Box p={6} borderRadius="lg" borderWidth="1px">
        <Stat>
          <StatLabel fontSize="lg">Active Vote Packs</StatLabel>
          <StatNumber fontSize="3xl">
            {votePacks?.reduce((sum, pack) => sum + pack.votes_remaining, 0) || 0}
          </StatNumber>
          <StatHelpText>Total votes remaining</StatHelpText>
        </Stat>
      </Box>

      <Grid
        templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }}
        gap={6}
      >
        {VOTE_PACKS.map((pack) => {
          const activePack = getActiveVotePack(pack.type);
          return (
            <Box
              key={pack.type}
              p={6}
              borderRadius="lg"
              borderWidth="1px"
              bg={cardBg}
              borderColor={borderColor}
            >
              <VStack spacing={4} align="stretch">
                <Box>
                  <Text fontSize="xl" fontWeight="bold">
                    {pack.title}
                  </Text>
                  <Text color="gray.500">{pack.description}</Text>
                </Box>

                <Box>
                  <Text>
                    {pack.votes} votes × {pack.power}x power
                  </Text>
                  <Text fontSize="2xl" fontWeight="bold">
                    {pack.price} SLN
                  </Text>
                </Box>

                {activePack && (
                  <Badge colorScheme="green">
                    {activePack.votes_remaining} votes remaining
                  </Badge>
                )}

                <Button
                  colorScheme="blue"
                  onClick={() => handlePurchase(pack)}
                  isDisabled={!user || (user.balance || 0) < pack.price}
                >
                  Purchase Pack
                </Button>
              </VStack>
            </Box>
          );
        })}
      </Grid>
    </VStack>
  );
} 