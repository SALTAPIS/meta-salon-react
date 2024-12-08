import * as React from 'react';
import {
  Box,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  useColorModeValue,
  Skeleton,
  chakra,
} from '@chakra-ui/react';
import { useTokens } from '../../hooks/token/useTokens';
import { animate } from 'framer-motion';

const MotionStatNumber = chakra(StatNumber, {
  shouldComponentUpdate: true,
  baseStyle: {
    display: 'block',
  },
});

export function TokenBalance() {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const { balance, isLoading } = useTokens();
  const prevBalanceRef = React.useRef<number>(balance ?? 0);
  const numberRef = React.useRef<HTMLDivElement>(null);
  const mountedRef = React.useRef(true);

  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  React.useEffect(() => {
    if (!isLoading && balance !== null && numberRef.current) {
      try {
        const controls = animate(prevBalanceRef.current, balance, {
          duration: 0.5,
          onUpdate: (value) => {
            if (numberRef.current && mountedRef.current) {
              numberRef.current.textContent = Math.round(value).toString();
            }
          },
          onComplete: () => {
            if (mountedRef.current) {
              prevBalanceRef.current = balance;
            }
          },
        });

        return () => {
          controls.stop();
        };
      } catch (error) {
        console.error('Animation error:', {
          error,
          currentBalance: balance,
          prevBalance: prevBalanceRef.current,
          timestamp: new Date().toISOString()
        });
        // Fallback to direct update
        if (numberRef.current && mountedRef.current) {
          numberRef.current.textContent = balance.toString();
        }
      }
    }
  }, [balance, isLoading]);

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
          <MotionStatNumber ref={numberRef}>
            {balance ?? 0}
          </MotionStatNumber>
        </Skeleton>
        <StatHelpText>Available tokens</StatHelpText>
      </Stat>
    </Box>
  );
} 