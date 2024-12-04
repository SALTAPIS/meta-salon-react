import {
  Box,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useColorModeValue,
} from '@chakra-ui/react';
import { useQuery } from '@tanstack/react-query';
import { TokenService } from '../../services/token/tokenService';

interface TokenBalanceProps {
  userId: string;
}

export function TokenBalance({ userId }: TokenBalanceProps) {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const { data: balance, isLoading } = useQuery({
    queryKey: ['userBalance', userId],
    queryFn: () => TokenService.getInstance().getUserBalance(userId),
  });

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
        <StatNumber>{isLoading ? '-' : balance || 0}</StatNumber>
        <StatHelpText>Available tokens</StatHelpText>
      </Stat>
    </Box>
  );
} 