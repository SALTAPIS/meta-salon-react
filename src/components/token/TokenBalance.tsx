import React from 'react';
import {
  Box,
  Card,
  CardBody,
  CardHeader,
  Heading,
  Stack,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Skeleton,
} from '@chakra-ui/react';
import { useTokens } from '../../hooks/token/useTokens';

export function TokenBalance() {
  const {
    balance,
    transactions,
    isLoading,
    error,
  } = useTokens();

  if (error) {
    return (
      <Box p={4} bg="red.50" color="red.500" borderRadius="md">
        Error loading token information: {error.message}
      </Box>
    );
  }

  return (
    <Stack spacing={6}>
      <Card>
        <CardHeader>
          <Heading size="md">Token Balance</Heading>
        </CardHeader>
        <CardBody>
          <Skeleton isLoaded={!isLoading}>
            <Text fontSize="3xl" fontWeight="bold">
              {balance} SLN
            </Text>
          </Skeleton>
        </CardBody>
      </Card>

      <Card>
        <CardHeader>
          <Heading size="md">Recent Transactions</Heading>
        </CardHeader>
        <CardBody>
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Type</Th>
                <Th>Amount</Th>
                <Th>Description</Th>
                <Th>Date</Th>
              </Tr>
            </Thead>
            <Tbody>
              {isLoading ? (
                <Tr>
                  <Td colSpan={4}>
                    <Stack>
                      <Skeleton height="20px" />
                      <Skeleton height="20px" />
                      <Skeleton height="20px" />
                    </Stack>
                  </Td>
                </Tr>
              ) : transactions.length === 0 ? (
                <Tr>
                  <Td colSpan={4} textAlign="center">
                    No transactions yet
                  </Td>
                </Tr>
              ) : (
                transactions.map((tx) => (
                  <Tr key={tx.id}>
                    <Td>
                      <Badge
                        colorScheme={
                          tx.type === 'grant' || tx.type === 'reward'
                            ? 'green'
                            : tx.type === 'submission' || tx.type === 'vote_pack'
                            ? 'blue'
                            : 'gray'
                        }
                      >
                        {tx.type}
                      </Badge>
                    </Td>
                    <Td>
                      <Text
                        color={
                          tx.type === 'grant' || tx.type === 'reward'
                            ? 'green.500'
                            : tx.type === 'submission' || tx.type === 'vote_pack'
                            ? 'red.500'
                            : 'gray.500'
                        }
                      >
                        {tx.type === 'grant' || tx.type === 'reward'
                          ? `+${tx.amount}`
                          : `-${tx.amount}`} SLN
                      </Text>
                    </Td>
                    <Td>{tx.description || '-'}</Td>
                    <Td>
                      {new Date(tx.created_at).toLocaleDateString()}
                    </Td>
                  </Tr>
                ))
              )}
            </Tbody>
          </Table>
        </CardBody>
      </Card>
    </Stack>
  );
} 