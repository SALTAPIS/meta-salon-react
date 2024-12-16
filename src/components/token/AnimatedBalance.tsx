import { Text, type ChakraProps } from '@chakra-ui/react';
import { motion } from 'framer-motion';

interface AnimatedBalanceProps extends ChakraProps {
  balance: number;
}

export function AnimatedBalance({ balance, ...props }: AnimatedBalanceProps) {
  return (
    <motion.div
      initial={{ scale: 1 }}
      animate={{ scale: [1, 1.1, 1] }}
      transition={{
        duration: 0.5,
        times: [0, 0.5, 1],
      }}
      style={{
        display: 'inline-block',
        padding: '0.5rem',
        borderRadius: '0.375rem',
      }}
    >
      <Text {...props}>
        {balance.toLocaleString()} SLN
      </Text>
    </motion.div>
  );
} 