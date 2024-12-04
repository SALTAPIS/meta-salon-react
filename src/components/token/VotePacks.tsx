import React from 'react';
import {
  Box,
  Button,
  Card,
  CardBody,
  CardHeader,
  Grid,
  Heading,
  Stack,
  Text,
  useToast,
  Progress,
  Badge,
} from '@chakra-ui/react';
import { useTokens } from '../../hooks/token/useTokens';

const VOTE_PACK_PRICES = {
  basic: 10,
  art_lover: 25,
  pro: 50,
  expert: 100,
  elite: 200,
};

const VOTE_PACK_POWERS = {
  basic: 1,
  art_lover: 2,
  pro: 3,
  expert: 4,
  elite: 5,
};

export function VotePacks() {
  const {
    votePacks,
    activeVotePack,
    balance,
    isLoading,
    error,
    purchaseVotePack,
  } = useTokens();

  const toast = useToast();

  const handlePurchase = async (type: keyof typeof VOTE_PACK_PRICES) => {
    try {
      await purchaseVotePack(type, VOTE_PACK_PRICES[type]);
      toast({
        title: 'Vote Pack Purchased',
        description: `Successfully purchased ${type} vote pack`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (err) {
      toast({
        title: 'Purchase Failed',
        description: err instanceof Error ? err.message : 'Failed to purchase vote pack',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  if (error) {
    return (
      <Box p={4} bg="red.50" color="red.500" borderRadius="md">
        Error loading vote packs: {error.message}
      </Box>
    );
  }

  return (
    <Stack spacing={6}>
      <Card>
        <CardHeader>
          <Heading size="md">Active Vote Pack</Heading>
        </CardHeader>
        <CardBody>
          {activeVotePack ? (
            <Stack spacing={4}>
              <Box>
                <Text fontWeight="bold">
                  {activeVotePack.type.replace('_', ' ').toUpperCase()} Pack
                </Text>
                <Text fontSize="sm" color="gray.500">
                  Vote Power: {VOTE_PACK_POWERS[activeVotePack.type as keyof typeof VOTE_PACK_POWERS]}x
                </Text>
              </Box>
              <Box>
                <Text mb={2}>Votes Remaining</Text>
                <Progress
                  value={(activeVotePack.votes_remaining / 10) * 100}
                  colorScheme="blue"
                />
                <Text mt={2} fontSize="sm">
                  {activeVotePack.votes_remaining} votes left
                </Text>
              </Box>
              {activeVotePack.expires_at && (
                <Text fontSize="sm" color="gray.500">
                  Expires: {new Date(activeVotePack.expires_at).toLocaleDateString()}
                </Text>
              )}
            </Stack>
          ) : (
            <Text>No active vote pack</Text>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <Heading size="md">Available Vote Packs</Heading>
        </CardHeader>
        <CardBody>
          <Grid templateColumns="repeat(auto-fit, minmax(200px, 1fr))" gap={4}>
            {Object.entries(VOTE_PACK_PRICES).map(([type, price]) => (
              <Card key={type} variant="outline">
                <CardBody>
                  <Stack spacing={4}>
                    <Box>
                      <Heading size="sm" textTransform="capitalize">
                        {type.replace('_', ' ')} Pack
                      </Heading>
                      <Badge colorScheme="purple">
                        {VOTE_PACK_POWERS[type as keyof typeof VOTE_PACK_POWERS]}x Vote Power
                      </Badge>
                    </Box>
                    <Text fontWeight="bold">{price} SLN</Text>
                    <Button
                      colorScheme="blue"
                      isDisabled={balance < price || isLoading}
                      onClick={() => handlePurchase(type as keyof typeof VOTE_PACK_PRICES)}
                    >
                      Purchase
                    </Button>
                  </Stack>
                </CardBody>
              </Card>
            ))}
          </Grid>
        </CardBody>
      </Card>

      {votePacks.length > 0 && (
        <Card>
          <CardHeader>
            <Heading size="md">Your Vote Packs</Heading>
          </CardHeader>
          <CardBody>
            <Stack spacing={4}>
              {votePacks.map((pack) => (
                <Box
                  key={pack.id}
                  p={4}
                  borderWidth={1}
                  borderRadius="md"
                  borderColor="gray.200"
                >
                  <Stack direction="row" justify="space-between" align="center">
                    <Box>
                      <Text fontWeight="bold" textTransform="capitalize">
                        {pack.type.replace('_', ' ')} Pack
                      </Text>
                      <Text fontSize="sm" color="gray.500">
                        {pack.votes_remaining} votes remaining
                      </Text>
                    </Box>
                    <Badge colorScheme="purple">
                      {VOTE_PACK_POWERS[pack.type as keyof typeof VOTE_PACK_POWERS]}x Power
                    </Badge>
                  </Stack>
                </Box>
              ))}
            </Stack>
          </CardBody>
        </Card>
      )}
    </Stack>
  );
} 