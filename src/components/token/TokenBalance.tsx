import {
  Box,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useColorModeValue,
  Skeleton,
} from '@chakra-ui/react';
import { useTokens } from '../../hooks/token/useTokens';

export function TokenBalance() {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const { balance, isLoading } = useTokens();

  return (
    <Box
      p={6}
      bg={bgColor}
      borderWidth="1px"
      borderColor={borderColor}
      borderRadius="lg"
      shadow="sm"
    >
      <Stat>
        <StatLabel>Token Balance</StatLabel>
        <Skeleton isLoaded={!isLoading}>
          <StatNumber>{balance || 0}</StatNumber>
        </Skeleton>
        <StatHelpText>Available tokens</StatHelpText>
      </Stat>
    </Box>
  );
} 