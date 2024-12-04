import React from 'react';
import {
  Box,
  VStack,
  Text,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
} from '@chakra-ui/react';
import { useAuth } from '../auth/AuthProvider';
import { useTokens } from '../../hooks/token/useTokens';

export function TokenBalance() {
  const { user } = useAuth();
  const { transactions } = useTokens();

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'grant':
      case 'reward':
        return 'green';
      case 'submission':
      case 'vote_pack':
        return 'blue';
      case 'refund':
        return 'purple';
      default:
        return 'gray';
    }
  };

  return (
    <VStack spacing={6} align="stretch">
      <Box p={6} borderRadius="lg" borderWidth="1px">
        <Stat>
          <StatLabel fontSize="lg">Token Balance</StatLabel>
          <StatNumber fontSize="3xl">{user?.balance || 0} SLN</StatNumber>
          <StatHelpText>Available for voting and rewards</StatHelpText>
        </Stat>
      </Box>

      <Box>
        <Text fontSize="lg" fontWeight="medium" mb={4}>
          Recent Transactions
        </Text>
        <Box borderRadius="lg" borderWidth="1px" overflow="hidden">
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
              {transactions?.map((tx) => (
                <Tr key={tx.id}>
                  <Td>
                    <Badge colorScheme={getTransactionColor(tx.type)}>
                      {tx.type.replace('_', ' ')}
                    </Badge>
                  </Td>
                  <Td color={tx.amount > 0 ? 'green.500' : undefined}>
                    {tx.amount > 0 ? '+' : ''}{tx.amount} SLN
                  </Td>
                  <Td>{tx.description || '-'}</Td>
                  <Td>{new Date(tx.created_at).toLocaleDateString()}</Td>
                </Tr>
              ))}
              {!transactions?.length && (
                <Tr>
                  <Td colSpan={4} textAlign="center">
                    No transactions yet
                  </Td>
                </Tr>
              )}
            </Tbody>
          </Table>
        </Box>
      </Box>
    </VStack>
  );
} 